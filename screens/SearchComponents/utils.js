import { collection, getDocs, query, where, addDoc, getDoc, deleteDoc, doc, documentId } from "firebase/firestore";
import { database} from "../../config/firebase";
import { getAuth } from "firebase/auth"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const saveSearchHistory = async (user, history, blockedUsers) => {
  try {
    const filteredHistory = history.map((userItem) => ({
      id: userItem.id,
      username: userItem.username,
      profileImage: userItem.profileImage,
      isPrivate: userItem.isPrivate || false,
      hasStories: false,
    }));

    await AsyncStorage.setItem(
      `searchHistory_${user.uid}`,
      JSON.stringify(filteredHistory)
    );
  } catch (error) {
    console.error("Error saving search history:", error);
  }
};

export const normalizeText = (text) => {
  return text
      .normalize("NFD") // Descompone caracteres acentuados
      .replace(/[\u0300-\u036f]/g, "") // Elimina los signos diacríticos
      .toLowerCase(); // Convierte a minúsculas
};



export const fetchUsers = async (searchTerm, setResults) => {
  const auth = getAuth();
  if (!auth.currentUser) return;

  if (searchTerm.trim().length > 0) {
    try {
      const user = auth.currentUser;
      const userRef = doc(database, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
      const blockedUsers = userSnapshot.data()?.blockedUsers || [];
      const hideStoriesFrom = userSnapshot.data()?.hideStoriesFrom || [];

      const normalizedSearchTerm = normalizeText(searchTerm);

      // Crear consulta para traer todos los usuarios
      const usersRef = collection(database, "users");
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);

      // Procesar cada usuario y verificar si tiene historias activas
      const userList = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const userId = doc.id;

          // Verificar si el usuario actual es amigo del usuario encontrado
          const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
          const friendSnapshot = await getDocs(query(friendsRef, where("friendId", "==", userId)));
          const isFriend = !friendSnapshot.empty;

          // Verificar si el usuario es privado
          const isPrivate = data.isPrivate || false;

          let hasStories = false;
          let userStories = [];

          // Solo verificar historias si el usuario no es privado o si el usuario actual es su amigo
          if (!isPrivate || isFriend) {
            const storiesRef = collection(database, "users", userId, "stories");
            const storiesSnapshot = await getDocs(storiesRef);
            const now = new Date();

            // Filtrar historias activas (no expiradas)
            userStories = storiesSnapshot.docs
              .map((storyDoc) => {
                const storyData = storyDoc.data();
                return {
                  id: storyDoc.id,
                  ...storyData,
                  expiresAt: storyData.expiresAt.toDate(),
                };
              })
              .filter((story) => story.expiresAt > now && !hideStoriesFrom.includes(userId));

            hasStories = userStories.length > 0;
          }

          return {
            id: userId,
            ...data,
            isFriend,
            isPrivate,
            hasStories,
            userStories,
            profileImage:
              data.photoUrls && data.photoUrls.length > 0
                ? data.photoUrls[0]
                : "https://via.placeholder.com/150",
          };
        })
      );

      // Filtrar usuarios bloqueados, el usuario actual y aplicar el término de búsqueda
      const filteredList = userList
    .filter(
        (user) =>
            user.id !== auth.currentUser.uid &&
            !blockedUsers.includes(user.id) &&
            (
                normalizeText(user.username || "").includes(normalizedSearchTerm) ||
                normalizeText(user.firstName || "").includes(normalizedSearchTerm) ||
                normalizeText(user.lastName || "").includes(normalizedSearchTerm)
            )
    )
    .slice(0, 8);


      setResults(filteredList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  } else {
    setResults([]);
  }
};




export const fetchRecommendations = async (user, setRecommendations, forceRefresh = false) => {
  const auth = getAuth();
  
  if (!user || !user.uid) {
    console.error("fetchRecommendations: Usuario no autenticado o sin UID.");
    return;
  }

  try {
    const userRef = doc(database, "users", user.uid);
    const userSnapshot = await getDoc(userRef);
    const blockedUsers = userSnapshot.data()?.blockedUsers || [];

    const friendsRef = collection(database, "users", user.uid, "friends");
    const friendsSnapshot = await getDocs(friendsRef);
    const friendsList = friendsSnapshot.docs.map(doc => doc.data().friendId);

    if (!friendsList.length) {
      setRecommendations([]);
      return;
    }

    let potentialFriends = [];
    for (const friendId of friendsList) {
      const friendFriendsRef = collection(database, "users", friendId, "friends");
      const friendFriendsSnapshot = await getDocs(friendFriendsRef);
      potentialFriends.push(...friendFriendsSnapshot.docs.map(doc => doc.data().friendId));
    }

    potentialFriends = potentialFriends.filter(
      id => id !== user.uid && !friendsList.includes(id) && !blockedUsers.includes(id)
    );

    const uniquePotentialFriends = [...new Set(potentialFriends)];

    if (!uniquePotentialFriends.length) {
      setRecommendations([]);
      return;
    }

    const chunkSize = 10;
    let recommendedUsers = [];

    for (let i = 0; i < uniquePotentialFriends.length; i += chunkSize) {
      const chunk = uniquePotentialFriends.slice(i, i + chunkSize);

      if (!chunk.length || chunk.some(id => !id)) {
        continue;
      }

      const qUsers = query(collection(database, "users"), where(documentId(), "in", chunk));
      const chunkSnapshot = await getDocs(qUsers);

      for (const docSnap of chunkSnapshot.docs) {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const profileImage = userData.photoUrls?.[0] || "https://via.placeholder.com/150";
          const lowQualityProfileImage = profileImage ? `${profileImage}?alt=media&w=30&h=30&q=1` : null;

          recommendedUsers.push({
            id: docSnap.id,
            ...userData,
            profileImage,
            lowQualityProfileImage,
          });
        }
      }
    }

    setRecommendations(recommendedUsers);

    await AsyncStorage.setItem(
      `recommendations_${user.uid}`,
      JSON.stringify({
        recommendations: recommendedUsers, // Guardamos las recomendaciones sin timestamp
      })
    );
  } catch (error) {
    console.error("Error fetching friend recommendations:", error);
  }
};



export const sendFriendRequest = async (user, setStatus) => {
  const auth = getAuth(); 
  if (!auth.currentUser || !user) return;

  const currentUser = auth.currentUser;
  const friendsRef = collection(
    database,
    "users",
    currentUser.uid,
    "friends"
  );
  const q = query(friendsRef, where("friendId", "==", user.id));
  const friendSnapshot = await getDocs(q);

  if (friendSnapshot.empty) {
    const requestRef = collection(
      database,
      "users",
      user.id,
      "friendRequests"
    );
    const existingRequestQuery = query(
      requestRef,
      where("fromId", "==", currentUser.uid)
    );
    const existingRequestSnapshot = await getDocs(existingRequestQuery);

    const userDocRef = doc(database, "users", currentUser.uid);
    const userDocSnapshot = await getDoc(userDocRef);
    const currentUserData = userDocSnapshot.exists()
      ? userDocSnapshot.data()
      : {
          username: "Anonymous User",
          photoUrls: ["https://via.placeholder.com/150"],
        };

    const profileImage =
      currentUserData.photoUrls && currentUserData.photoUrls.length > 0
        ? currentUserData.photoUrls[0]
        : "https://via.placeholder.com/150";

    if (existingRequestSnapshot.empty) {
      try {
        await addDoc(requestRef, {
          fromName: currentUserData.username,
          fromId: currentUser.uid,
          fromImage: profileImage,
          status: "pending",
          seen: false, 
          timestamp: new Date(), 
          createdAt: new Date(), 
        });

        setStatus("pending");
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
    } else {
      // Request already exists
    }
  } else {
    Alert.alert(t('alreadyFriends'), t('alreadyFriendsMessage'));
  }
};

export const cancelFriendRequest = async (user, setStatus, t) => {
  const auth = getAuth();
  if (!auth.currentUser || !user) return;

  try {
    const requestRef = collection(database, "users", user.id, "friendRequests");
    const existingRequestQuery = query(
      requestRef,
      where("fromId", "==", auth.currentUser.uid)
    );
    const existingRequestSnapshot = await getDocs(existingRequestQuery);

    if (!existingRequestSnapshot.empty) {
      const requestId = existingRequestSnapshot.docs[0].id;
      const requestDocRef = doc(database, "users", user.id, "friendRequests", requestId);
      await deleteDoc(requestDocRef);

      setStatus(null);
    }
  } catch (error) {
    console.error(t('errorCancelingFriendRequest'), error);
    Alert.alert(t('error'), t('errorCancelingFriendRequestMessage'));
  }
};


export const deleteFriendRequest = async (user, setStatus) => {
  const auth = getAuth();
  if (!auth.currentUser || !user) return;

  try {
    const requestRef = collection(database, "users", user.id, "friendRequests");
    const existingRequestQuery = query(
      requestRef,
      where("fromId", "==", auth.currentUser.uid)
    );
    const existingRequestSnapshot = await getDocs(existingRequestQuery);

    if (!existingRequestSnapshot.empty) {
      const requestId = existingRequestSnapshot.docs[0].id;
      const requestDocRef = doc(database, "users", user.id, "friendRequests", requestId);
      await deleteDoc(requestDocRef);

      setStatus(null);
    }
  } catch (error) {
    console.error("Error deleting friend request:", error);
  }
};

export const handleUserPress = (
  selectedUser,
  { blockedUsers, searchHistory, setSearchHistory, navigation, currentUser, t }
) => {
  if (blockedUsers.includes(selectedUser.id)) {
    Alert.alert(t("error"), t("cannotInteractWithUser"));
    return;
  }

  const isPrivate = selectedUser.isPrivate || false;
  const isFriend = selectedUser.isFriend || false;

  // Navegar según si es privado y si somos amigos
  if (isPrivate && !isFriend) {
    navigation.navigate("PrivateUserProfile", {
      selectedUser: { ...selectedUser, isPrivate, isFriend },
    });
  } else {
    navigation.navigate("UserProfile", {
      selectedUser: { ...selectedUser, isPrivate, isFriend },
    });
  }

  // Actualiza el historial inmediatamente
  const updatedHistory = [
    selectedUser,
    ...searchHistory.filter((item) => item.id !== selectedUser.id)
  ].slice(0, 5);

  // Actualiza estado y caché de forma síncrona
  setSearchHistory(updatedHistory);
  saveSearchHistory(currentUser, updatedHistory, blockedUsers);

  // Forzar actualización después de la navegación
  setTimeout(() => {
    setSearchHistory([...updatedHistory]);
  }, 100);
};
import { collection, getDocs, query, where, addDoc, getDoc, deleteDoc, doc, documentId } from "firebase/firestore";
import { database} from "../../config/firebase";
import { getAuth } from "firebase/auth"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const saveSearchHistory = async (user, history, blockedUsers) => {
  try {
    // Actualiza el almacenamiento persistente del historial
    await AsyncStorage.setItem(
      `searchHistory_${user.uid}`,
      JSON.stringify(history)
    );

    // Actualiza la caché con el historial actualizado
    await AsyncStorage.setItem(
      `searchHistoryCache_${user.uid}`,
      JSON.stringify({
        data: history,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    console.error("Error saving search history:", error);
  }
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

      const normalizedSearchTerm = searchTerm.toLowerCase();

      // Create query to search users by username, firstName, and lastName
      const usersRef = collection(database, "users");
      const q = query(usersRef);

      const querySnapshot = await getDocs(q);

      // Process each user and check if they have stories
      const userList = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Check if the current user is a friend
          const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
          const friendSnapshot = await getDocs(query(friendsRef, where("friendId", "==", doc.id)));
          const isFriend = !friendSnapshot.empty;

          // Check if the user is private
          const isPrivate = data.isPrivate || false;

          // Only check for stories if the user is not private or if the current user is a friend
          let hasStories = false;
          if (!isPrivate || isFriend) {
            const storiesRef = collection(database, "users", doc.id, "stories");
            const storiesSnapshot = await getDocs(storiesRef);
            const now = new Date();

            hasStories = storiesSnapshot.docs.some((storyDoc) => {
              const storyData = storyDoc.data();
              return (
                new Date(storyData.expiresAt.toDate()) > now &&
                !hideStoriesFrom.includes(doc.id)
              );
            });
          }

          return {
            id: doc.id,
            ...data,
            isFriend,
            isPrivate,
            hasStories,
            profileImage:
              data.photoUrls && data.photoUrls.length > 0
                ? data.photoUrls[0]
                : "https://via.placeholder.com/150",
          };
        })
      );

      // Filter blocked users, current user, and apply search term
      const filteredList = userList.filter(
        (user) =>
          user.id !== auth.currentUser.uid &&
          !blockedUsers.includes(user.id) &&
          (user.username.toLowerCase().includes(normalizedSearchTerm) ||
           user.firstName.toLowerCase().includes(normalizedSearchTerm) ||
           user.lastName.toLowerCase().includes(normalizedSearchTerm))
      );

      setResults(filteredList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  } else {
    setResults([]);
  }
};


export const fetchRecommendations = async (user, setRecommendations) => {
  const auth = getAuth();
  if (!user) return;

  try {
    // 1) Leer datos del usuario, para conocer a bloqueados
    const userRef = doc(database, "users", user.uid);
    const userSnapshot = await getDoc(userRef);
    const blockedUsers = userSnapshot.data()?.blockedUsers || [];

    // 2) Leer caché
    const cachedData = await AsyncStorage.getItem(`recommendations_${user.uid}`);
    if (cachedData) {
      const { recommendations: cachedRecs, timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      // Ejemplo: 1 hora de vigencia
      if (now - timestamp < 60 * 60 * 1000) {
        // Filtrar bloqueados de la lista cacheada
        const filtered = cachedRecs.filter(
          (rec) => !blockedUsers.includes(rec.id)
        );
        setRecommendations(filtered);
      } else {
        console.log("Caché expirada, recargando recomendaciones...");
      }
    }

    // 3) Obtener la lista de amigos del usuario
    const friendsRef = collection(database, "users", user.uid, "friends");
    const friendsSnapshot = await getDocs(friendsRef);
    const friendsList = friendsSnapshot.docs.map((doc) => doc.data().friendId);

    // 4) Ir armando la lista de "amigos de mis amigos"
    let potentialFriends = [];
    for (const friendId of friendsList) {
      const friendFriendsRef = collection(database, "users", friendId, "friends");
      const friendFriendsSnapshot = await getDocs(friendFriendsRef);
      potentialFriends.push(
        ...friendFriendsSnapshot.docs.map((doc) => doc.data().friendId)
      );
    }

    // 5) Filtrar:
    potentialFriends = potentialFriends.filter(
      (id) =>
        id !== user.uid &&
        !friendsList.includes(id) &&
        !blockedUsers.includes(id)
    );

    // Quitar duplicados
    const uniquePotentialFriends = [...new Set(potentialFriends)];

    // 6) Hacer consultas por lotes (chunks) para no sobrepasar el límite de Firestore
    const chunkSize = 10;
    let recommendedUsers = [];

    for (let i = 0; i < uniquePotentialFriends.length; i += chunkSize) {
      const chunk = uniquePotentialFriends.slice(i, i + chunkSize);

      // Consulta por lotes:
      const qUsers = query(
        collection(database, "users"),
        where(documentId(), "in", chunk)
      );

      const chunkSnapshot = await getDocs(qUsers);
      chunkSnapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();

          // Imagen optimizada usando expo-image
          const profileImage =
            userData.photoUrls?.[0] || "https://via.placeholder.com/150";
          const lowQualityProfileImage = profileImage
            ? `${profileImage}?alt=media&w=30&h=30&q=1`
            : null;

          recommendedUsers.push({
            id: docSnap.id,
            ...userData,
            profileImage,
            lowQualityProfileImage,
          });
        }
      });
    }

    // 7) Asignar a estado final
    setRecommendations(recommendedUsers);

    // 8) Guardar en caché (solo si hay resultados)
    if (recommendedUsers.length > 0) {
      await AsyncStorage.setItem(
        `recommendations_${user.uid}`,
        JSON.stringify({
          recommendations: recommendedUsers,
          timestamp: Date.now(),
        })
      );
    }
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

// En utils.js, modifica la función handleUserPress para que guarde el historial en segundo plano sin await:
export const handleUserPress = (
  selectedUser,
  { blockedUsers, searchHistory, setSearchHistory, navigation, currentUser, t }
) => {
  if (blockedUsers.includes(selectedUser.id)) {
    Alert.alert(t("error"), t("cannotInteractWithUser"));
    return;
  }

  // Actualiza el historial sin esperar la operación asíncrona
  const updatedHistory = searchHistory.filter(item => item.id !== selectedUser.id);
  updatedHistory.unshift(selectedUser);
  while (updatedHistory.length > 5) {
    updatedHistory.pop();
  }
  setSearchHistory(updatedHistory);
  // Llamada sin await para no bloquear la navegación
  saveSearchHistory(currentUser, updatedHistory, blockedUsers);

  // Asegurarse de que isPrivate e isFriend sean booleanos
  const isPrivate = selectedUser.isPrivate || false;
  const isFriend = selectedUser.isFriend || false;

  if (isPrivate && !isFriend) {
    navigation.navigate("PrivateUserProfile", {
      selectedUser: { ...selectedUser, isPrivate, isFriend },
    });
  } else {
    navigation.navigate("UserProfile", {
      selectedUser: { ...selectedUser, isPrivate, isFriend },
    });
  }
};



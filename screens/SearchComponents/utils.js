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
  const user = auth.currentUser;
  if (!user) return;

  const trimmed = searchTerm.trim();
  const normalizedSearchTerm = normalizeText(trimmed);

  if (!trimmed) {
    setResults([]);
    return;
  }

  try {
    const userRef = doc(database, "users", user.uid);
    const userSnapshot = await getDoc(userRef);
    const blockedUsers = userSnapshot.data()?.blockedUsers || [];
    const hideStoriesFrom = userSnapshot.data()?.hideStoriesFrom || [];

    const usersRef = collection(database, "users");

    // 🔁 Agregá esto para traer todos los amigos una vez
const friendsRef = collection(database, "users", user.uid, "friends");
const friendsSnap = await getDocs(friendsRef);
const friendsSet = new Set(friendsSnap.docs.map(doc => doc.data().friendId));

    // 🔍 3 búsquedas individuales con prefijo
    const queries = [
      query(usersRef, where("username", ">=", normalizedSearchTerm), where("username", "<=", normalizedSearchTerm + "\uf8ff")),
      query(usersRef, where("firstName", ">=", normalizedSearchTerm), where("firstName", "<=", normalizedSearchTerm + "\uf8ff")),
      query(usersRef, where("lastName", ">=", normalizedSearchTerm), where("lastName", "<=", normalizedSearchTerm + "\uf8ff")),
    ];

    const snapshots = await Promise.all(queries.map(getDocs));

    const combinedDocs = [
      ...snapshots[0].docs,
      ...snapshots[1].docs,
      ...snapshots[2].docs,
    ];

    const uniqueUsers = new Map();
    

    for (const docSnap of combinedDocs) {
      if (!docSnap.exists()) continue;

      const data = docSnap.data();
      const userId = docSnap.id;

      if (
        userId === user.uid ||
        blockedUsers.includes(userId) ||
        uniqueUsers.has(userId)
      ) continue;

      const isPrivate = data.isPrivate || false;

      // 🔁 Verificar si es amigo
      const isFriend = friendsSet.has(userId);

      let hasStories = false;
      let userStories = [];

      if (!isPrivate || isFriend) {
        const storiesRef = collection(database, "users", userId, "stories");
        const storiesSnap = await getDocs(storiesRef);
        const now = new Date();

        userStories = storiesSnap.docs
          .map((doc) => {
            const story = doc.data();
            return {
              id: doc.id,
              ...story,
              expiresAt: story.expiresAt?.toDate?.() || new Date(0),
            };
          })
          .filter(
            (story) =>
              story.expiresAt > now && !hideStoriesFrom.includes(userId)
          );

        hasStories = userStories.length > 0;
      }

      uniqueUsers.set(userId, {
        id: userId,
        ...data,
        profileImage: data.photoUrls?.[0] || "https://via.placeholder.com/150",
        isFriend,
        isPrivate,
        hasStories,
        userStories,
      });
    }

    setResults(Array.from(uniqueUsers.values()).slice(0, 8));
  } catch (error) {
    console.error("Error fetching users:", error);
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

    // Obtener lista de amigos actuales
    const friendsRef = collection(database, "users", user.uid, "friends");
    const friendsSnapshot = await getDocs(friendsRef);
    const friendsList = friendsSnapshot.docs.map(doc => doc.data().friendId);

    // Obtener lista de solicitudes de amistad pendientes
    const sentRequestsRef = collection(database, "users", user.uid, "sentFriendRequests");
    const sentRequestsSnapshot = await getDocs(sentRequestsRef);
    const sentRequestsList = sentRequestsSnapshot.docs.map(doc => doc.data().toId);

    let potentialFriends = [];
    
    // Solo buscar recomendaciones si el usuario tiene amigos
    if (friendsList.length > 0) {
      for (const friendId of friendsList) {
        const friendFriendsRef = collection(database, "users", friendId, "friends");
        const friendFriendsSnapshot = await getDocs(friendFriendsRef);
        potentialFriends.push(...friendFriendsSnapshot.docs.map(doc => doc.data().friendId));
      }
    }

    // Filtrar usuarios que:
    // 1. No son el usuario actual
    // 2. No son ya amigos
    // 3. No están bloqueados
    // 4. No tienen solicitudes pendientes
    potentialFriends = potentialFriends.filter(
      id => id !== user.uid && 
            !friendsList.includes(id) && 
            !blockedUsers.includes(id) &&
            !sentRequestsList.includes(id)
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
          
          // Verificar si ya son amigos (por si acaso)
          const isFriend = friendsList.includes(docSnap.id);
          if (isFriend) continue; // Saltar si ya son amigos
          
          const profileImage = userData.photoUrls?.[0] || "https://via.placeholder.com/150";
          const lowQualityProfileImage = profileImage ? `${profileImage}?alt=media&w=30&h=30&q=1` : null;

          recommendedUsers.push({
            id: docSnap.id,
            ...userData,
            profileImage,
            lowQualityProfileImage,
            isFriend // Añadir esta propiedad para facilitar el filtrado
          });
        }
      }
    }

    const finalRecommendations = recommendedUsers.filter((user) => !user.isFriend);
setRecommendations(finalRecommendations);


await AsyncStorage.setItem(
  `recommendations_${user.uid}`,
  JSON.stringify({
    recommendations: finalRecommendations, 
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
import { collection, getDocs, query, where, addDoc, getDoc, deleteDoc, doc, or } from "firebase/firestore";
import { database, auth } from "../../config/firebase";
import { getAuth } from "firebase/auth"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useTranslation } from 'react-i18next';


export const fetchUsers = async (searchTerm, setResults) => {
  const auth = getAuth();
  if (searchTerm.trim().length > 0) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load blocked users
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
      
          const storiesRef = collection(database, "users", doc.id, "stories");
          const storiesSnapshot = await getDocs(storiesRef);
          const now = new Date();
      
          const hasStories = storiesSnapshot.docs.some((storyDoc) => {
            const storyData = storyDoc.data();
            return (
              new Date(storyData.expiresAt.toDate()) > now &&
              !hideStoriesFrom.includes(doc.id)
            );
          });
      
          return {
            id: doc.id,
            ...data,
            isFriend,
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

      console.log("Users with available stories:", filteredList);

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
    // Cargar usuarios bloqueados
    const userRef = doc(database, "users", user.uid);
    const userSnapshot = await getDoc(userRef);
    const blockedUsers = userSnapshot.data()?.blockedUsers || [];

    const friendsRef = collection(database, "users", user.uid, "friends");
    const friendsSnapshot = await getDocs(friendsRef);
    const friendsList = friendsSnapshot.docs.map(
      (doc) => doc.data().friendId
    );

    let potentialFriends = [];
    for (const friendId of friendsList) {
      const friendFriendsRef = collection(
        database,
        "users",
        friendId,
        "friends"
      );
      const friendFriendsSnapshot = await getDocs(friendFriendsRef);
      potentialFriends.push(
        ...friendFriendsSnapshot.docs.map((doc) => doc.data().friendId)
      );
    }

    potentialFriends = potentialFriends.filter(
      (id) =>
        id !== user.uid &&
        !friendsList.includes(id) &&
        !blockedUsers.includes(id) 
    );

    const uniquePotentialFriends = [...new Set(potentialFriends)];

    const recommendedUsers = [];
    for (const friendId of uniquePotentialFriends) {
      const userDoc = await getDoc(doc(database, "users", friendId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        recommendedUsers.push({
          id: friendId,
          ...userData,
          profileImage:
            userData.photoUrls && userData.photoUrls.length > 0
              ? userData.photoUrls[0]
              : "https://via.placeholder.com/150",
        });
      }
    }

    setRecommendations(recommendedUsers);
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

export const saveSearchHistory = async (currentUser, history, blockedUsers) => {
  if (!currentUser) return;

  try {
    const safeHistory = JSON.stringify(
      history
        .filter((item) => !blockedUsers.includes(item.id)) 
        .map((item) => ({
          id: item.id,
          username: item.username,
          firstName: item.firstName || "",
          lastName: item.lastName || "",
          profileImage: item.profileImage || "https://via.placeholder.com/150",
          isPrivate: item.isPrivate || false, 
        }))
    );

    await AsyncStorage.setItem(`searchHistory_${currentUser.uid}`, safeHistory);
  } catch (error) {
    console.error("Error al guardar el historial de búsqueda:", error);
  }
};


import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { database } from "../../config/firebase";
import { Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchBlockedUsers = async (params) => {
  const user = params.user
  const setBlockedUsers = params.setBlockedUsers

    try {
      const userRef = doc(database, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
      const blockedList = userSnapshot.data()?.blockedUsers || [];
      setBlockedUsers(blockedList);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    }
  };

export const handleBlockUser = async (params) => {
  const user = params.user
  const selectedUser = params.selectedUser
  const t = params.t

  if (!user || !selectedUser) return;

  try {
    // Referencias a los documentos de amistad en ambas direcciones
    const currentUserFriendRef = collection(
      database,
      "users",
      user.uid,
      "friends"
    );
    const currentFriendQuery = query(
      currentUserFriendRef,
      where("friendId", "==", selectedUser.id)
    );

    const selectedUserFriendRef = collection(
      database,
      "users",
      selectedUser.id,
      "friends"
    );
    const selectedFriendQuery = query(
      selectedUserFriendRef,
      where("friendId", "==", user.uid)
    );

    // Obtener y eliminar las relaciones de amistad
    const [currentFriendSnapshot, selectedFriendSnapshot] = await Promise.all([
      getDocs(currentFriendQuery),
      getDocs(selectedFriendQuery),
    ]);

    currentFriendSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    selectedFriendSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    // Eliminar solicitudes de amistad pendientes entre ambos usuarios
    const currentUserRequestsRef = collection(
      database,
      "users",
      selectedUser.id,
      "friendRequests"
    );
    const requestQuery = query(
      currentUserRequestsRef,
      where("fromId", "==", user.uid)
    );
    const requestSnapshot = await getDocs(requestQuery);
    requestSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    const reverseRequestQuery = query(
      collection(database, "users", user.uid, "friendRequests"),
      where("fromId", "==", selectedUser.id)
    );
    const reverseRequestSnapshot = await getDocs(reverseRequestQuery);
    reverseRequestSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    // Agregar el usuario bloqueado a la lista de bloqueados del usuario actual
    const currentUserRef = doc(database, "users", user.uid);
    await updateDoc(currentUserRef, {
      blockedUsers: arrayUnion(selectedUser.id),
      manuallyBlocked: arrayUnion(selectedUser.id), // Campo nuevo para bloqueos manuales
    });

    // Agregar al usuario actual a la lista de bloqueados del usuario seleccionado
    const selectedUserRef = doc(database, "users", selectedUser.id);
    await updateDoc(selectedUserRef, {
      blockedUsers: arrayUnion(user.uid),
    });

    // Eliminar el usuario bloqueado del historial de búsqueda
    const searchHistoryKey = `searchHistory_${user.uid}`;
    const savedHistory = await AsyncStorage.getItem(searchHistoryKey);
    if (savedHistory !== null) {
      const parsedHistory = JSON.parse(savedHistory);
      const updatedHistory = parsedHistory.filter(item => item.id !== selectedUser.id);
      await AsyncStorage.setItem(searchHistoryKey, JSON.stringify(updatedHistory));
    }

    Alert.alert(
      t("userProfile.userBlocked"),
      `${selectedUser.firstName} ${t("userProfile.isBlocked")}`
    );
  } catch (error) {
    console.error("Error blocking user:", error);
    Alert.alert(t("userProfile.error"), t("userProfile.blockError"));
  }
};

export const handleReport = async (params) => {
  const selectedUser = params.selectedUser
  const setIsReportModalVisible = params.setIsReportModalVisible
  const setMenuVisible = params.setMenuVisible
  const t = params.t

  if (!selectedUser || !selectedUser.id) {
    Alert.alert(t("userProfile.error"), t("userProfile.cannotReportUser"));
    return;
  }

  try {
    const userDoc = await getDoc(doc(database, "users", selectedUser.id));

    if (userDoc.exists()) {
      setIsReportModalVisible(true);
      setMenuVisible(false);
    } else {
      Alert.alert(t("userProfile.error"), t("userProfile.userInfoError"));
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    Alert.alert(t("userProfile.error"), t("userProfile.userDataAccessError"));
  }
};

export const checkHiddenStatus = async (params) => {
  const user = params.user
  const selectedUser = params.selectedUser
  const setHideStories = params.setHideStories
  const setHideMyStories = params.setHideMyStories

  if (user && selectedUser) {
    const userDoc = await getDoc(doc(database, "users", user.uid));
    const userData = userDoc.data();
    setHideStories(
      userData.hiddenStories?.includes(selectedUser.id) || false
    );
    setHideMyStories(
      userData.hideStoriesFrom?.includes(selectedUser.id) || false
    );
  }
};

export const checkHideMyStoriesStatus = async (params) => {
  const user = params.user
  const selectedUser = params.selectedUser
  const setHideMyStories = params.setHideMyStories

  if (!user || !selectedUser) return;

  const selectedUserRef = doc(database, "users", selectedUser.id);

  try {
    const selectedUserDoc = await getDoc(selectedUserRef);
    if (!selectedUserDoc.exists()) return;

    const selectedUserData = selectedUserDoc.data();
    const isHidden = selectedUserData.hideStoriesFrom?.includes(user.uid) || false;

    setHideMyStories(isHidden);
  } catch (error) {
    console.error("Error fetching hideStoriesFrom status:", error);
  }
};

export const handleLikeProfile = async (params) => {
  const blockedUsers = params.blockedUsers
  const selectedUser = params.selectedUser
  const isLiked = params.isLiked
  const t = params.t
  const likeCount = params.likeCount
  const setIsLiked = params.setIsLiked
  const setLikeCount = params.setLikeCount
  const user = params.user

  if (blockedUsers.includes(selectedUser.id)) {
    Alert.alert(
      t("userProfile.userBlocked"),
      t("userProfile.cannotLikeProfile")
    );
    return;
  }

  // Actualización optimista del estado local
  const newIsLiked = !isLiked;
  const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
  setIsLiked(newIsLiked);
  setLikeCount(newLikeCount);

  // Sincronización con Firestore
  try {
    const likesRef = collection(database, "users", selectedUser.id, "likes");
    const likeQuery = query(likesRef, where("userId", "==", user.uid));
    const likeSnapshot = await getDocs(likeQuery);

    const batch = writeBatch(database); // Usa consistentemente writeBatch

    if (likeSnapshot.empty) {
      // Agregar un "like"
      const userDoc = await getDoc(doc(database, "users", user.uid));
      const userData = userDoc.data();
      const profileImage =
        userData.photoUrls && userData.photoUrls.length > 0
          ? userData.photoUrls[0]
          : "https://via.placeholder.com/150";

      // Agregar a la colección de "likes"
      const newLikeRef = doc(
        collection(database, "users", selectedUser.id, "likes")
      );
      batch.set(newLikeRef, {
        userId: user.uid,
        username: userData.username,
        userImage: profileImage,
        timestamp: serverTimestamp(),
      });

      // Incrementar contador de "likes"
      const userRef = doc(database, "users", selectedUser.id);
      batch.update(userRef, {
        likeCount: newLikeCount,
      });

      // Notificación al usuario
      const notificationsRef = doc(
        collection(database, "users", selectedUser.id, "notifications")
      );
      batch.set(notificationsRef, {
        type: "like",
        fromId: user.uid,
        fromName: userData.username,
        fromImage: profileImage,
        message: t("userProfile.likedYourProfile", {
          username: userData.username,
        }),
        timestamp: serverTimestamp(),
        seen: false,
      });
    } else {
      // Eliminar "like"
      const likeDoc = likeSnapshot.docs[0];

      // Eliminar de la colección de "likes"
      batch.delete(doc(database, "users", selectedUser.id, "likes", likeDoc.id));

      // Decrementar contador de "likes"
      const userRef = doc(database, "users", selectedUser.id);
      batch.update(userRef, {
        likeCount: newLikeCount,
      });
    }

    await batch.commit(); // Ejecuta el batch una vez
  } catch (error) {
    console.error("Error liking profile:", error);

    // Revertir el estado local si ocurre un error
    setIsLiked(!newIsLiked);
    setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);

    Alert.alert(t("userProfile.error"), t("userProfile.likeProfileError"));
  }
};

export const checkLikeStatus = async (params) => {
  const user = params.user
  const selectedUser = params.selectedUser
  const setIsLiked = params.setIsLiked

  if (user && selectedUser) {
    const likesRef = collection(
      database,
      "users",
      selectedUser.id,
      "likes"
    );
    const likeQuery = query(likesRef, where("userId", "==", user.uid));
    const likeSnapshot = await getDocs(likeQuery);
    setIsLiked(!likeSnapshot.empty);
  }
};

export const fetchUserData = async (params) => {
  const selectedUser = params.selectedUser
  const setIsPrivate = params.setIsPrivate
  const user = params.user
  const navigation = params.navigation
  const setPhotoUrls = params.setPhotoUrls
  const setFirstHobby = params.setFirstHobby
  const setSecondHobby = params.setSecondHobby
  const setRelationshipStatus = params.setRelationshipStatus
  const setFirstInterest = params.setFirstInterest
  const setSecondInterest = params.setSecondInterest

  if (selectedUser && selectedUser.id) {
    const userDoc = await getDoc(doc(database, "users", selectedUser.id));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setIsPrivate(userData.isPrivate || false);

      // Check if the current user is a friend of the selected profile
      const friendsRef = collection(database, "users", user.uid, "friends");
      const q = query(friendsRef, where("friendId", "==", selectedUser.id));
      const friendSnapshot = await getDocs(q);
      const isFriend = !friendSnapshot.empty;

      // If the profile is private and the user is not a friend, redirect to PrivateUserProfile
      if (userData.isPrivate && !isFriend) {
        navigation.replace("PrivateUserProfile", { selectedUser });
        return;
      }

      setPhotoUrls(userData.photoUrls || ["https://via.placeholder.com/400"]);
      setFirstHobby(userData.firstHobby || "");
      setSecondHobby(userData.secondHobby || "");
      setRelationshipStatus(userData.relationshipStatus || "");
      setFirstInterest(userData.firstInterest || "");
      setSecondInterest(userData.secondInterest || "");
    }
  }
};

export const fetchFriendCount = async (params) => {
  const selectedUser = params.selectedUser
  const setFriendCount = params.setFriendCount

  if (selectedUser && selectedUser.id) {
    const friendsRef = collection(
      database,
      "users",
      selectedUser.id,
      "friends"
    );
    const friendSnapshot = await getDocs(friendsRef);
    setFriendCount(friendSnapshot.size);
  }
};

export const fetchEvents = async (params) => {
  const selectedUser = params.selectedUser
  const blockedUsers = params.blockedUsers
  const setEvents = params.setEvents
  const parseEventDate = params.parseEventDate

  if (selectedUser && selectedUser.id) {
    const eventsRef = collection(
      database,
      "users",
      selectedUser.id,
      "events"
    );
    const eventsSnapshot = await getDocs(eventsRef);
    const userEvents = eventsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (blockedUsers.includes(selectedUser.id)) {
   
      setEvents([]); // Asegúrate de que esta lógica es la deseada
    } else {
      setEvents(userEvents);
    
    }
  };
};

export const checkFriendship = async (params) => {
  const user = params.user
  const selectedUser = params.selectedUser
  const setFriendshipStatus = params.setFriendshipStatus
  const setPendingRequest = params.setPendingRequest

  if (user && selectedUser && selectedUser.id) {
    const friendsRef = collection(database, "users", user.uid, "friends");
    const q = query(friendsRef, where("friendId", "==", selectedUser.id));
    const friendSnapshot = await getDocs(q);
    setFriendshipStatus(!friendSnapshot.empty);

    const requestRef = collection(
      database,
      "users",
      selectedUser.id,
      "friendRequests"
    );
    const requestSnapshot = await getDocs(
      query(requestRef, where("fromId", "==", user.uid))
    );
    setPendingRequest(!requestSnapshot.empty);
  }
};

export const fetchMutualFriends = async (params) => {
  const user = params.user
  const selectedUser = params.selectedUser
  const setMutualFriends = params.setMutualFriends


  if (user && selectedUser && selectedUser.id) {
    const userFriendsRef = collection(
      database,
      "users",
      user.uid,
      "friends"
    );

    const selectedUserFriendsRef = collection(
      database,
      "users",
      selectedUser.id,
      "friends"
    );

    const [userFriendsSnapshot, selectedUserFriendsSnapshot] =
      await Promise.all([
        getDocs(userFriendsRef),
        getDocs(selectedUserFriendsRef),
      ]);

    const userFriendIds = new Set(
      userFriendsSnapshot.docs.map((doc) => doc.data().friendId)
    );
    const mutualFriendIds = selectedUserFriendsSnapshot.docs
      .map((doc) => doc.data().friendId)
      .filter((id) => userFriendIds.has(id));

      const mutualFriendsData = await Promise.all(
        mutualFriendIds.map(async (id) => {
          const friendDoc = await getDoc(doc(database, "users", id));
          return friendDoc.exists() ? friendDoc.data() : null; // Validar si existe
        })
      );

      setMutualFriends(mutualFriendsData.filter((friend) => friend !== null)); // Filtrar valores nulos
  }
};

export const handleSendMessage = async (params) => {
  const blockedUsers = params.blockedUsers
  const selectedUser = params.selectedUser
  const navigation = params.navigation
  const t = params.t

  if (blockedUsers.includes(selectedUser.id)) {
    Alert.alert(
      t("userProfile.userBlocked"),
      t("userProfile.cannotSendMessage")
    );
    return;
  }

  const currentParams = {
    recipientUser: selectedUser,
  };

  // Solo pasar imageUri si es necesario
  if (selectedUser.profileImage) {
    currentParams.imageUri = selectedUser.profileImage;
  }

  navigation.navigate("ChatUsers", currentParams);
};

export const handleBoxPress = (params) => {
  const { box, navigation, t } = params;
  const coordinates = box.coordinates || { latitude: 0, longitude: 0 };
  navigation.navigate("BoxDetails", {
    box: {
      title: box.title || t("userProfile.noTitle"),
      imageUrl: box.imageUrl || "https://via.placeholder.com/150",
      dateArray: box.dateArray || [],
      hours: box.hours || {},
      phoneNumber: box.phoneNumber || t("userProfile.noNumber"),
      locationLink: box.locationLink || t("userProfile.noLocation"),
      coordinates: coordinates,
    },
    selectedDate: box.date || t("userProfile.noDate"),
  });
};

export const handleToggleHiddenStories = async (params) => {
  const user = params.user
  const selectedUser = params.selectedUser
  const t = params.t
  const setHideStories = params.setHideStories
  const hideStories = params.hideStories

  if (!user || !selectedUser) return;

  const userRef = doc(database, "users", user.uid);

  try {
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const currentHiddenStories = userData.hiddenStories || [];

    if (currentHiddenStories.includes(selectedUser.id)) {
      // Si el UID ya está en la lista, lo eliminamos
      await updateDoc(userRef, {
        hiddenStories: arrayRemove(selectedUser.id),
      });
      Alert.alert(
        t("userProfile.success"),
        t("userProfile.removedFromHiddenStories")
      );
    } else {
      // Si no está en la lista, lo añadimos
      await updateDoc(userRef, {
        hiddenStories: arrayUnion(selectedUser.id),
      });
      Alert.alert(
        t("userProfile.success"),
        t("userProfile.addedToHiddenStories")
      );
    }

    // Actualizamos el estado local para reflejar el cambio
    setHideStories(!hideStories);
  } catch (error) {
    console.error("Error updating hidden stories:", error);
    Alert.alert(
      t("userProfile.error"),
      t("userProfile.hiddenStoriesUpdateError")
    );
  }
};

export const toggleHideMyStories = async (params) => {
  const user = params.user
  const selectedUser = params.selectedUser
  const t = params.t
  const setHideMyStories = params.setHideMyStories
  const hideMyStories = params.hideMyStories

  if (!user || !selectedUser) return;

  const selectedUserRef = doc(database, "users", selectedUser.id);

  try {
      // Obtener los datos actuales del usuario seleccionado
      const selectedUserDoc = await getDoc(selectedUserRef);
      if (!selectedUserDoc.exists()) {
          Alert.alert(
              t("userProfile.error"),
              t("userProfile.userNotFound")
          );
          return;
      }

      const selectedUserData = selectedUserDoc.data();
      const currentHideStoriesFrom = selectedUserData.hideStoriesFrom || [];

      if (currentHideStoriesFrom.includes(user.uid)) {
          // Si nuestro UID ya está en su lista, lo eliminamos
          await updateDoc(selectedUserRef, {
              hideStoriesFrom: arrayRemove(user.uid),
          });
          Alert.alert(
              t("userProfile.success"),
              t("userProfile.removedFromHideStories")
          );
      } else {
          // Si nuestro UID no está en su lista, lo añadimos
          await updateDoc(selectedUserRef, {
              hideStoriesFrom: arrayUnion(user.uid),
          });
          Alert.alert(
              t("userProfile.success"),
              t("userProfile.addedToHideStories")
          );
      }

      // Actualizar el estado local para reflejar el cambio
      setHideMyStories(!hideMyStories);
  } catch (error) {
      console.error("Error updating hide stories:", error);
      Alert.alert(
          t("userProfile.error"),
          t("userProfile.hideStoriesUpdateError")
      );
  }
};

export const toggleUserStatus = async (params) => {
  const {
    user,
    selectedUser,
    friendCount,
    t,
    friendshipStatus,
  } = params;

  if (!user || !selectedUser) return; // No hacer nada si faltan parámetros

  try {
    // Optimistic UI update
    const wasFriends = friendshipStatus; // Estado anterior
    let updatedFriendshipStatus = wasFriends;
    let updatedPendingRequest = false;

    const friendsRef = collection(database, "users", user.uid, "friends");
    const q = query(friendsRef, where("friendId", "==", selectedUser.id));
    const friendSnapshot = await getDocs(q);

    const currentUserRequestsRef = collection(
      database,
      "users",
      user.uid,
      "friendRequests"
    );
    const existingRequestFromThemQuery = query(
      currentUserRequestsRef,
      where("fromId", "==", selectedUser.id)
    );
    const existingRequestFromThemSnapshot = await getDocs(
      existingRequestFromThemQuery
    );

    if (!existingRequestFromThemSnapshot.empty && friendSnapshot.empty) {
      Alert.alert(
        "Solicitud pendiente",
        "Este usuario ya te envió una solicitud de amistad. Revisa tus notificaciones."
      );
      return {
        friendshipStatus: wasFriends,
        pendingRequest: false,
      };
    }

    if (friendSnapshot.empty) {
      const requestRef = collection(
        database,
        "users",
        selectedUser.id,
        "friendRequests"
      );
      const existingRequestQuery = query(
        requestRef,
        where("fromId", "==", user.uid)
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      const userDocRef = doc(database, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      const currentUser = userDocSnapshot.exists()
        ? userDocSnapshot.data()
        : {
            username: t("userProfile.anonymousUser"),
            profileImage: "https://via.placeholder.com/150",
          };

      const profileImage =
        currentUser.photoUrls && currentUser.photoUrls.length > 0
          ? currentUser.photoUrls[0]
          : "https://via.placeholder.com/150";

      if (existingRequestSnapshot.empty) {
        await addDoc(requestRef, {
          fromName: currentUser.username,
          fromId: user.uid,
          fromImage: profileImage,
          status: "pending",
          timestamp: Timestamp.now(),
          seen: false,
        });

        updatedPendingRequest = true;
      } else {
        existingRequestSnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });

        updatedPendingRequest = false;
      }
    } else {
      // Si ya son amigos, eliminar la relación
      friendSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      const reverseFriendSnapshot = await getDocs(
        query(
          collection(database, "users", selectedUser.id, "friends"),
          where("friendId", "==", user.uid)
        )
      );
      reverseFriendSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      const requestQuery = query(
        collection(database, "users", selectedUser.id, "friendRequests"),
        where("fromId", "==", user.uid)
      );
      const requestSnapshot = await getDocs(requestQuery);
      requestSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      const reverseRequestQuery = query(
        collection(database, "users", user.uid, "friendRequests"),
        where("fromId", "==", selectedUser.id)
      );
      const reverseRequestSnapshot = await getDocs(reverseRequestQuery);
      reverseRequestSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      updatedFriendshipStatus = false;
    }

    return {
      friendshipStatus: updatedFriendshipStatus,
      pendingRequest: updatedPendingRequest,
    };
  } catch (error) {
    console.error("Error toggling user status:", error);
    throw error;
  }
};

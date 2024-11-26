import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { Menu, Provider } from "react-native-paper";
import { auth, database } from "../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
  deleteDoc,
  setDoc,
  Timestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import FriendListModal from "../Components/Modals/FriendListModal";
import Complaints from "../Components/Complaints/Complaints";
import MutualFriendsModal from "../Components/Mutual-Friends-Modal/MutualFriendsModal";

import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

const NameDisplay = ({
  firstName,
  lastName,
  friendCount,
  showFriendCount,
  onFriendListPress,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.nameContainer}>
      <Text style={styles.name}>
        {firstName} {lastName}
      </Text>
      {showFriendCount && (
        <TouchableOpacity
          onPress={onFriendListPress}
          style={styles.friendCountContainer}
        >
          <Text style={styles.friendCountText}>{friendCount} </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function UserProfile({ route, navigation }) {
  const { t } = useTranslation();
  const { selectedUser } = route.params || {};
  const [friendCount, setFriendCount] = useState(0);
  const [isNightMode, setIsNightMode] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [friendshipStatus, setFriendshipStatus] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [isFriendListVisible, setIsFriendListVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [firstHobby, setFirstHobby] = useState("");
  const [secondHobby, setSecondHobby] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [firstInterest, setFirstInterest] = useState("");
  const [secondInterest, setSecondInterest] = useState("");
  const [mutualFriends, setMutualFriends] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0); // Added likeCount state
  const [isElementsVisible, setIsElementsVisible] = useState(true);
  const [hideStories, setHideStories] = useState(false);
  const [hideMyStories, setHideMyStories] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [heartCount, setHeartCount] = useState(0);
  const [isHearted, setIsHearted] = useState(false);
  const [isMutualFriendsModalVisible, setIsMutualFriendsModalVisible] =
    useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const userRef = doc(database, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        const blockedList = userSnapshot.data()?.blockedUsers || [];
        setBlockedUsers(blockedList);
      } catch (error) {
        console.error("Error fetching blocked users:", error);
      }
    };

    fetchBlockedUsers();
  }, [user]);

  const user = auth.currentUser;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleLongPress = () => {
    setIsElementsVisible(false);
  };

  const handlePressOut = () => {
    setIsElementsVisible(true);
  };

  const handleFriendSelect = (friend) => {
    navigation.navigate("UserProfile", { selectedUser: friend });
    setIsFriendListVisible(false);
  };
  const handleMutualFriendsPress = () => {
    setIsMutualFriendsModalVisible(true);
  };
  const handleBlockUser = async () => {
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

      Alert.alert(
        t("userProfile.userBlocked"),
        `${selectedUser.firstName} ${t("userProfile.isBlocked")}`
      );
    } catch (error) {
      console.error("Error blocking user:", error);
      Alert.alert(t("userProfile.error"), t("userProfile.blockError"));
    }
  };



  const handleUnblockUser = async () => {
    if (!user || !selectedUser) return;

    try {
      // Referencia al documento del usuario actual
      const currentUserRef = doc(database, "users", user.uid);

      // Eliminar el UID del usuario seleccionado del array de bloqueados
      await updateDoc(currentUserRef, {
        blockedUsers: arrayRemove(selectedUser.id),
      });

      Alert.alert(
        t("userProfile.userUnblocked"),
        `${selectedUser.firstName} ${t("userProfile.isUnblocked")}`
      );
    } catch (error) {
      console.error("Error unblocking user:", error);
      Alert.alert(t("userProfile.error"), t("userProfile.unblockError"));
    }
  };

  const handleReport = async () => {
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

  const handleHeartPress = () => {
    if (!isHearted) {
      setHeartCount(heartCount + 1);
      setIsHearted(true);
    } else {
      setHeartCount(heartCount - 1);
      setIsHearted(false);
    }
  };

  const handleReportSubmit = async (reason, description) => {
    try {
      const complaintsRef = collection(database, "complaints");
      const newComplaint = {
        reporterId: user.uid,
        reporterName: user.displayName || t("userProfile.anonymous"),
        reporterUsername: user.email ? user.email.split("@")[0] : "unknown",
        reportedId: selectedUser.id,
        reportedName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        reportedUsername: selectedUser.username || "unknown",
        reason: reason,
        description: description,
        timestamp: Timestamp.now(),
      };
      await addDoc(complaintsRef, newComplaint);
      Alert.alert(t("userProfile.thankYou"), t("userProfile.reportSubmitted"));
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert(
        t("userProfile.error"),
        t("userProfile.reportSubmissionError")
      );
    }
    setIsReportModalVisible(false);
  };

  useEffect(() => {
    const checkHiddenStatus = async () => {
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
    checkHiddenStatus();
  }, [user, selectedUser]);

  useEffect(() => {
    const checkHideMyStoriesStatus = async () => {
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
  
    checkHideMyStoriesStatus();
  }, [user, selectedUser]);



 


  const handleLikeProfile = async () => {
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

  useEffect(() => {
    const checkLikeStatus = async () => {
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

    checkLikeStatus();
  }, [user, selectedUser]);

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchUserData = async () => {
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

    const fetchFriendCount = async () => {
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
    const fetchEvents = async () => {
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

        // Filtrar eventos si el usuario está bloqueado
        if (blockedUsers.includes(selectedUser.id)) {
          setEvents([]);
        } else {
          const filteredEvents = checkAndRemoveExpiredEvents(userEvents);
          setEvents(filteredEvents);
        }
      }
    };

    const checkFriendship = async () => {
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

    const fetchMutualFriends = async () => {
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

    fetchUserData();
    fetchFriendCount();
    fetchEvents();
    checkFriendship();
    fetchMutualFriends();
  }, [selectedUser, user, friendshipStatus, navigation]);

  const checkAndRemoveExpiredEvents = (eventsList) => {
    const currentDate = new Date();
    const filteredEvents = eventsList.filter((event) => {
      const eventDate = parseEventDate(event.date);
      const timeDifference = currentDate - eventDate;
      const hoursPassed = timeDifference / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        // Remove the expired event from Firestore
        deleteDoc(doc(database, "users", selectedUser.id, "events", event.id))
          .then(() => console.log(`Event ${event.id} removed successfully`))
          .catch((error) =>
            console.error(`Error removing event ${event.id}:`, error)
          );
        return false;
      }
      return true;
    });

    return filteredEvents;
  };

  const parseEventDate = (dateString) => {
    const [day, month] = dateString.split(" ");
    const currentYear = new Date().getFullYear();
    const monthIndex = t("months", { returnObjects: true }).indexOf(
      month.toLowerCase()
    );
    return new Date(currentYear, monthIndex, parseInt(day));
  };

  const isUserBlocked = async () => {
    const blockedRef = collection(database, "users", user.uid, "blockedUsers");
    const blockedSnapshot = await getDocs(blockedRef);
    const blockedIds = blockedSnapshot.docs.map((doc) => doc.data().blockedId);

    return blockedIds.includes(selectedUser.id);
  };

  const handleSendMessage = async () => {
    if (blockedUsers.includes(selectedUser.id)) {
      Alert.alert(
        t("userProfile.userBlocked"),
        t("userProfile.cannotSendMessage")
      );
      return;
    }
  
    const params = {
      recipientUser: selectedUser,
    };
  
    // Solo pasar imageUri si es necesario
    if (selectedUser.profileImage) {
      params.imageUri = selectedUser.profileImage;
    }
  
    navigation.navigate("ChatUsers", params);
  };

  const renderMutualFriends = () => {
    if (mutualFriends.length === 0) {
      return (
        <View style={styles.mutualFriendsContainer}>
          <Text style={styles.noMutualFriendsText}>
            {t("userProfile.noMutualFriends")}
          </Text>
        </View>
      );
    }

    const containerWidth = mutualFriends.length * 40;

    return (
      <TouchableOpacity
        onPress={handleMutualFriendsPress}
        style={[
          styles.mutualFriendsContainer,
          { flexDirection: "row", alignItems: "center" },
        ]}
      >
        <View
          style={[
            styles.mutualFriendImagesContainer,
            { width: containerWidth },
          ]}
        >
          {Array.isArray(mutualFriends) && mutualFriends.slice(0, 4).map((friend, index) => (
            <Image
              key={friend?.id || index}
              source={{ uri: friend?.photoUrls?.[0] || "https://via.placeholder.com/150" }}
              style={[styles.mutualFriendImage, { left: index * 30 }]}
              cachePolicy="memory-disk"
            />
          ))}
        </View>
        <Text style={[styles.mutualFriendMoreText, { marginLeft: 10 }]}>
          {mutualFriends.length > 4
            ? t("userProfile.andMoreMutualFriends", {
                count: mutualFriends.length - 4,
              })
            : t("userProfile.mutualFriends")}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleBoxPress = (box) => {
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

  const handleToggleHiddenStories = async () => {
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

  const toggleHideMyStories = async () => {
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
  
  
  

  

  const toggleUserStatus = async () => {
    if (!user || !selectedUser) return;
  
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
  
    if (!existingRequestFromThemSnapshot.empty) {
      Alert.alert(
        "Solicitud pendiente",
        "Este usuario ya te envió una solicitud de amistad. Revisa tus notificaciones."
      );
      return;
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
        try {
          await addDoc(requestRef, {
            fromName: currentUser.username,
            fromId: user.uid,
            fromImage: profileImage,
            status: "pending",
            timestamp: Timestamp.now(),
            seen: false,
            
          });
  
          setPendingRequest(true);
        } catch (error) {
          console.error("Error sending friend request:", error);
        }
      } else {
        try {
          existingRequestSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
  
          setPendingRequest(false);
        } catch (error) {
          console.error("Error canceling friend request:", error);
        }
      }
    } else {
      try {
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
  
        setFriendshipStatus(false);
        setFriendCount(friendCount - 1);
      } catch (error) {
        console.error("Error removing friendship:", error);
      }
    }
  };
  

  const renderOval = (value) => (
    <View style={styles.oval}>
      <Text style={styles.ovalText}>{value}</Text>
    </View>
  );

  const renderEvents = (start, end) => (
    <View style={styles.buttonContainer}>
      {events.slice(start, end).map((event, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => handleBoxPress(event)}
        >
          <Text style={styles.buttonText}>
            {event.title.length > 9
              ? event.title.substring(0, 5) + "..."
              : event.title}{" "}
            {event.date || t("userProfile.noTitle")}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  useEffect(() => {
    const fetchLikeCount = async () => {
      if (selectedUser && selectedUser.id) {
        const userDoc = await getDoc(doc(database, "users", selectedUser.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setLikeCount(userData.likeCount || 0);
        }
      }
    };

    fetchLikeCount();
  }, [selectedUser]); // Added useEffect to fetch like count

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          {isElementsVisible && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel={t("userProfile.backButton")}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isNightMode ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          )}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewHorizontal}
            onScroll={(event) => {
              const contentOffset = event.nativeEvent.contentOffset;
              const viewSize = event.nativeEvent.layoutMeasurement;
              const pageNum = Math.floor(contentOffset.x / viewSize.width);
              setCurrentImageIndex(pageNum);
            }}
            scrollEventThrottle={16}
          >
            {photoUrls.map((url, index) => (
              <Pressable
                key={index}
                style={styles.imageContainer}
                onLongPress={handleLongPress}
                onPressOut={handlePressOut}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.backgroundImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                {isElementsVisible && (
                  <View style={styles.overlay}>
                    <NameDisplay
                      firstName={selectedUser.firstName}
                      lastName={selectedUser.lastName}
                      friendCount={friendCount}
                      showFriendCount={index === 0}
                      onFriendListPress={() => setIsFriendListVisible(true)}
                    />
                    <View style={styles.infoContainer}>
                      {index === 0 && (
                        <>
                          <View style={styles.spacer} />
                          {renderEvents(0, 4)}
                        </>
                      )}
                      {index === 1 && (
                        <>
                          <View style={styles.spacer} />
                          <View style={styles.friendCountContainer}>
                            {renderMutualFriends()}
                          </View>
                          {renderEvents(4, 6)}
                        </>
                      )}
                      {index === 2 && (
                        <>
                          <View style={styles.contentWrapper}>
                            <View style={styles.ovalAndIconsContainer}>
                              <View style={styles.ovalWrapper}>
                                <View style={styles.ovalContainer}>
                                  {renderOval(firstHobby)}
                                  {renderOval(secondHobby)}
                                </View>

                                <View style={styles.ovalContainer}>
                                  {renderOval(firstInterest)}
                                  {renderOval(secondInterest)}
                                </View>
                              </View>
                              <View style={styles.iconsContainer}>
                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={toggleUserStatus}
                                >
                                  <AntDesign
                                    name={
                                      friendshipStatus
                                        ? "deleteuser"
                                        : pendingRequest
                                        ? "clockcircle"
                                        : "adduser"
                                    }
                                    size={24}
                                    color="white"
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={handleLikeProfile}
                                >
                                  <AntDesign
                                    name={isLiked ? "heart" : "hearto"}
                                    size={24}
                                    color="white"
                                  />
                                  <Text style={styles.heartCountText}>
                                    {likeCount}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={handleSendMessage}
                                >
                                  <AntDesign
                                    name="message1"
                                    size={24}
                                    color="white"
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
          {isElementsVisible && (
            <View style={styles.menuContainer}>
              <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={
                  <TouchableOpacity
                    onPress={openMenu}
                    accessibilityLabel={t("userProfile.openOptionsMenu")}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                }
                contentStyle={styles.menuContent}
              >
               <Menu.Item
  onPress={() => {
    if (!blockedUsers.includes(selectedUser.id)) {
      toggleUserStatus();
    } else {
      Alert.alert(
        t('userProfile.userBlocked'),
        t('userProfile.cannotAddFriend')
      );
    }
    closeMenu();
  }}
  title={
    friendshipStatus
      ? t('userProfile.removeFriend')
      : pendingRequest
      ? t('userProfile.cancelRequest')
      : t('userProfile.addFriend')
  }
/>
                <Menu.Item
                  onPress={() => {
                    handleBlockUser(); // Llamar a la nueva función
                    closeMenu();
                  }}
                  title={t("userProfile.block")}
                  titleStyle={{ color: "#FF3B30" }}
                />
                <Menu.Item
                  onPress={handleReport}
                  title={t("userProfile.report")}
                />
                <Menu.Item
                  onPress={handleToggleHiddenStories}
                  title={
                    hideStories
                      ? t("userProfile.seeTheirStories")
                      : t("userProfile.hideTheirStories")
                  }
                />
                <Menu.Item
                  onPress={toggleHideMyStories}
                  title={
                    hideMyStories
                      ? t("userProfile.showMyStories")
                      : t("userProfile.hideMyStories")
                  }
                />
              </Menu>
            </View>
          )}
        </View>
      </ScrollView>
      <FriendListModal
        isVisible={isFriendListVisible}
        onClose={() => setIsFriendListVisible(false)}
        userId={selectedUser.id}
        onFriendSelect={handleFriendSelect}
      />
      <Complaints
        isVisible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSubmit={handleReportSubmit}
      />
      <MutualFriendsModal
        isVisible={isMutualFriendsModalVisible}
        onClose={() => setIsMutualFriendsModalVisible(false)}
        friends={mutualFriends}
      />
    </Provider>
  );
}
const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  scrollViewHorizontal: {
    // This can be left empty as it's not needed for fixing the white space issue
  },
  imageContainer: {
    width: width,
    height: "100%",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
    paddingBottom: 40,
  },
  infoContainer: {
    padding: 20,
  },
  nameContainer: {
    position: "absolute",
    top: 550,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  name: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
  friendCountText: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
    marginTop: 5,
  },
  spacer: {
    height: 150,
  },
  friendCountContainer: {
    alignItems: "flex-start",
    marginTop: 20,
    marginBottom: 20,
  },
  number: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 5,
    gap: 10,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  menuContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  menuContent: {
    marginTop: 60, // Ajusta este valor para mover el menú hacia abajo
    borderRadius: 10,
  },
  menuStyle: {
    borderRadius: 10,
  },
  ovalContainer: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: 30,
  },
  oval: {
    width: "42%",
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  ovalText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  contentWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ovalAndIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  ovalWrapper: {
    flex: 1,
  },
  iconsContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginLeft: 10,
    gap: 20,
  },
  iconButton: {
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  mutualFriendIm: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: -15,
    borderWidth: 2,
    borderColor: "white",
  },
  mutualFriendsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  mutualFriendImagesContainer: {
    flexDirection: "row",
    position: "relative",
    height: 40,
  },
  mutualFriendImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "absolute",
  },
  mutualFriendMoreText: {
    color: "white",
    fontSize: 14,
    marginLeft: 10,
  },
  noMutualFriendsText: {
    color: "white",
    fontSize: 14,
  },
  heartCountText: {
    color: "white",
    fontSize: 16,
    marginTop: 5,
    textAlign: "center",
  },
});

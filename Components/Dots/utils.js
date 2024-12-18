import { collection, getDocs, doc, query, where, getDoc } from "firebase/firestore";
import { Alert } from "react-native";
import { auth, database } from "../../config/firebase";

export const handleUserPress = async ({
    uid,
    navigation,
    blockedUsers,
    t,
    setSelectedStories,
    setIsModalVisible,
  }) => {
    if (blockedUsers.includes(uid)) {
      Alert.alert(t("dotIndicatorBoxDetails.blockedUserError"));
      return;
    }
  
    if (auth.currentUser?.uid === uid) {
      navigation.navigate("Profile", { selectedUser: auth.currentUser });
      return;
    }
  
    try {
      // Obtener datos de nuestro propio perfil
      const currentUserRef = doc(database, "users", auth.currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
  
      if (!currentUserDoc.exists()) {
        Alert.alert(t("dotIndicatorBoxDetails.errorFetchingUserDetails"));
        return;
      }
  
      const currentUserData = currentUserDoc.data();
      const hideStoriesFrom = currentUserData?.hideStoriesFrom || [];
  
      // Verificar si el usuario está en nuestro hideStoriesFrom
      const isHiddenFromUs = hideStoriesFrom.includes(uid);
  
      // Obtener los datos del usuario al que hacemos clic
      const userDoc = await getDoc(doc(database, "users", uid));
      if (!userDoc.exists()) {
        Alert.alert(t("dotIndicatorBoxDetails.noDetailsFound"));
        return;
      }
  
      const userData = userDoc.data();
  
      if (isHiddenFromUs) {
        // Redirigir al perfil del usuario con los datos obtenidos
        navigation.navigate("UserProfile", {
          selectedUser: {
            id: uid,
            username: userData.username || t("dotIndicatorBoxDetails.unknownUser"),
            firstName: userData.firstName || t("dotIndicatorBoxDetails.unknownUser"),
            lastName: userData.lastName || t("dotIndicatorBoxDetails.unknownUser"),
            profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
            isPrivate: userData.isPrivate || false,
          },
        });
        return;
      }
  
      // Continuar con la lógica estándar si no está oculto
      const isPrivate = userData?.isPrivate || false;
  
      const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
      const friendQuery = query(friendsRef, where("friendId", "==", uid));
      const friendSnapshot = await getDocs(friendQuery);
      const isFriend = !friendSnapshot.empty;
  
      if (isPrivate && !isFriend) {
        navigation.navigate("UserProfile", {
          selectedUser: {
            id: uid,
            username: userData.username || t("dotIndicatorBoxDetails.unknownUser"),
            firstName: userData.firstName || t("dotIndicatorBoxDetails.unknownUser"),
            lastName: userData.lastName || t("dotIndicatorBoxDetails.unknownUser"),
            profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
            isPrivate: userData.isPrivate || false,
          },
        });
        return;
      }
  
      const storiesRef = collection(database, "users", uid, "stories");
      const storiesSnapshot = await getDocs(storiesRef);
      const now = new Date();
      const activeStories = storiesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
          expiresAt: doc.data().expiresAt,
        }))
        .filter((story) => new Date(story.expiresAt.toDate()) > now);
  
      if (activeStories.length === 0) {
        navigation.navigate("UserProfile", {
          selectedUser: {
            id: uid,
            username: userData.username || t("dotIndicatorBoxDetails.unknownUser"),
            firstName: userData.firstName || t("dotIndicatorBoxDetails.unknownUser"),
            lastName: userData.lastName || t("dotIndicatorBoxDetails.unknownUser"),
            profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
            isPrivate: userData.isPrivate || false,
          },
        });
        return;
      }
  
      setSelectedStories([{
        uid,
        username: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
        userStories: activeStories,
      }]);
      setIsModalVisible(true);
    } catch (error) {
      console.error(t("dotIndicatorBoxDetails.errorHandlingUserClick"), error);
      Alert.alert(t("dotIndicatorBoxDetails.errorFetchingUserDetails"));
    }
  };
  
  
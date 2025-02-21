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
  setModalVisible, // Nuevo parámetro
}) => {
  if (blockedUsers.includes(uid)) {
    Alert.alert(t("dotIndicatorBoxDetails.blockedUserError"));
    return;
  }

  if (auth.currentUser?.uid === uid) {
    // Obtener datos de mi perfil
    const userDoc = await getDoc(doc(database, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Consultar las historias de mi perfil
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
      if (activeStories.length > 0) {
        // Si hay historias activas, abrir el StoryViewer
        setSelectedStories([
          {
            uid,
            username: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
            profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
            userStories: activeStories,
          },
        ]);
        setIsModalVisible(true);
        return;
      }
    }
    // Si no hay historias activas, cerrar el modal y navegar a mi perfil
    setModalVisible(false);
    navigation.navigate("Profile", { selectedUser: auth.currentUser });
    return;
  }

  try {
    // Lógica para otros usuarios...
    const currentUserRef = doc(database, "users", auth.currentUser.uid);
    const currentUserDoc = await getDoc(currentUserRef);

    if (!currentUserDoc.exists()) {
      Alert.alert(t("dotIndicatorBoxDetails.errorFetchingUserDetails"));
      return;
    }

    const currentUserData = currentUserDoc.data();
    const hideStoriesFrom = currentUserData?.hideStoriesFrom || [];

    const isHiddenFromUs = hideStoriesFrom.includes(uid);

    const userDoc = await getDoc(doc(database, "users", uid));
    if (!userDoc.exists()) {
      Alert.alert(t("dotIndicatorBoxDetails.noDetailsFound"));
      return;
    }

    const userData = userDoc.data();

    if (isHiddenFromUs) {
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

    setSelectedStories([
      {
        uid,
        username: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
        userStories: activeStories,
      },
    ]);
    setIsModalVisible(true);
  } catch (error) {
    console.error(t("dotIndicatorBoxDetails.errorHandlingUserClick"), error);
    Alert.alert(t("dotIndicatorBoxDetails.errorFetchingUserDetails"));
  }
};

  
  
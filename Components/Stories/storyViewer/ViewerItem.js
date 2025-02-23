import React from "react";
import { TouchableOpacity, Text, Alert } from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { Image } from "expo-image"; // Usando expo-image para mejor optimización
import styles from "./StoryViewStyles";
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion, collection, query, where, getDocs } from "firebase/firestore";
import i18next from 'i18next';

const ViewerItem = ({
  item,
  currentStory,
  pinnedViewers,
  setPinnedViewers,
  handlePinViewer,
  setViewersModalVisible,
  setIsPaused,
  auth,
  database,
  t = i18next.t,
  navigation,
}) => {
  const hasLiked = currentStory?.likes?.some((like) => like.uid === item.uid);
  const isPinned = pinnedViewers.some((pv) => pv.uid === item.uid);

  const handleToggleHideMyStories = async () => {
    const selectedUserRef = doc(database, "users", item.uid);
    try {
      const selectedUserDoc = await getDoc(selectedUserRef);
      const selectedUserData = selectedUserDoc.data();
      const currentHideStoriesFrom = selectedUserData.hideStoriesFrom || [];

      if (currentHideStoriesFrom.includes(auth.currentUser.uid)) {
        await updateDoc(selectedUserRef, {
          hideStoriesFrom: arrayRemove(auth.currentUser.uid),
        });
        Alert.alert(t("userProfile.success"), t("storyViewer.viewerCanSeeStories"));
      } else {
        await updateDoc(selectedUserRef, {
          hideStoriesFrom: arrayUnion(auth.currentUser.uid),
        });
        Alert.alert(t("userProfile.success"), t("userProfile.userCannotSeeStories"));
      }
    } catch (error) {
      console.error("Error updating hide stories:", error);
      Alert.alert(t("userProfile.error"), t("userProfile.hideStoriesUpdateError"));
    }
  };

  return (
    <TouchableOpacity
      style={styles.viewerItem}
      onPress={async () => {
        // 1) Cierra el modal y “reanuda” la historia
        setViewersModalVisible(false);
        setIsPaused(false);
      
        // 2) (Opcional) Un pequeño retardo para dar tiempo a cerrar animaciones
        await new Promise((resolve) => setTimeout(resolve, 0));
      
        try {
          const userDoc = await getDoc(doc(database, "users", item.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userData.id = item.uid;
            const isPrivate = userData.isPrivate || false;
      
            let isFriend = false;
            if (item.uid === auth.currentUser.uid) {
              isFriend = true;
            } else {
              const friendsRef = collection(
                database,
                "users",
                auth.currentUser.uid,
                "friends"
              );
              const friendQuery = query(friendsRef, where("friendId", "==", item.uid));
              const friendSnapshot = await getDocs(friendQuery);
              isFriend = !friendSnapshot.empty;
            }
      
            // 3) En vez de navigate, usar replace para que se cierre por completo
            if (isPrivate && !isFriend) {
              navigation.replace("PrivateUserProfile", { selectedUser: userData });
            } else {
              navigation.replace("UserProfile", { selectedUser: userData });
            }
          } else {
            console.error("User not found");
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      }}
      
    >
      <Image
        key={item?.profileImage} // Forzar re-render cuando cambia la imagen
        source={{
          uri: item.lowQualityProfileImage || `${item.profileImage}?alt=media&w=30&h=30&q=1`,
          cache: "force-cache",
        }}
        style={styles.viewerImage}
        contentFit="cover"
        placeholder={{ blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj" }} // Placeholder borroso
        defaultSource={require("../../../assets/perfil.jpg")}
      />
      <Text style={styles.viewerName}>{`${item.firstName} ${item.lastName}`}</Text>

      {hasLiked && (
        <Ionicons name="heart" size={18} color="red" style={styles.likeIcon} />
      )}
      <TouchableOpacity
        style={styles.viewerEditButton}
        onPress={() =>
          handlePinViewer({
            viewer: item,
            auth,
            database,
            setPinnedViewers,
            t,
          })
        }
      >
        <AntDesign name={isPinned ? "pushpin" : "pushpino"} size={18} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dotsButton}
        onPress={() =>
          Alert.alert(
            t(isPinned ? "userProfile.showMyStories" : "userProfile.hideMyStories"),
            "",
            [
              { text: t("notes.cancel"), style: "cancel" },
              {
                text: t("notes.ok"),
                onPress: async () => {
                  await handleToggleHideMyStories();
                },
              },
            ],
            { cancelable: true }
          )
        }
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={{ fontSize: 15, color: "#000" }}>...</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default ViewerItem;

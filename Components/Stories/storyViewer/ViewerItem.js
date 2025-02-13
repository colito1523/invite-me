import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, Image, Alert } from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
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
  navigation, // Add navigation prop here
}) => {
  const hasLiked = currentStory?.likes?.some((like) => like.uid === item.uid);
  const isPinned = pinnedViewers.some((pv) => pv.uid === item.uid);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const checkHideStatus = async () => {
      const selectedUserRef = doc(database, "users", item.uid);
      const selectedUserDoc = await getDoc(selectedUserRef);
      const selectedUserData = selectedUserDoc.data();
      const currentHideStoriesFrom = selectedUserData.hideStoriesFrom || [];
      setIsHidden(currentHideStoriesFrom.includes(auth.currentUser.uid));
    };

    checkHideStatus();
  }, [item.uid, auth.currentUser.uid, database]);

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

      setIsHidden(!isHidden);
    } catch (error) {
      console.error("Error updating hide stories:", error);
      Alert.alert(t("userProfile.error"), t("userProfile.hideStoriesUpdateError"));
    }
  };

  return (
    <TouchableOpacity
    style={styles.viewerItem}
    onPress={async () => {
      setViewersModalVisible(false);
      setIsPaused(false);
      await new Promise((resolve) => setTimeout(resolve, 300));
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

          if (isPrivate && !isFriend) {
            navigation.navigate("PrivateUserProfile", { selectedUser: userData });
          } else {
            navigation.navigate("UserProfile", { selectedUser: userData });
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
        progressiveRenderingEnabled={true}
        source={{ uri: `${item.profileImage}?alt=media&w=30&h=30&q=1` }}
        style={styles.viewerImage}
        cachePolicy="memory-disk"
        resizeMode="cover"
        defaultSource={require("../../../assets/perfil.jpg")}
      />
      <Text style={styles.viewerName}>
        {`${item.firstName} ${item.lastName}`}
      </Text>
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
        <AntDesign
  name={isPinned ? "pushpin" : "pushpino"}
  size={18}
  color={isPinned ? "#000" : "#000"} 
/>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dotsButton}
        onPress={() =>
          Alert.alert(
            isHidden ? t("userProfile.showMyStories") : t("userProfile.hideMyStories"),
            "",
            [
              {
                text: t("notes.cancel"),
                style: "cancel",
              },
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
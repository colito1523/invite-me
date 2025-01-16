import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, Image, Alert } from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import styles from "./StoryViewStyles";
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import i18next from 'i18next';

const ViewerItem = ({
  item,
  currentStory,
  pinnedViewers,
  setPinnedViewers,
  handleUserPress,
  handlePinViewer,
  handleThreeDotsPress,
  setViewersModalVisible,
  setIsPaused,
  auth,
  database,
  t = i18next.t,
  setSelectedViewer,
  setIsHideStoryModalVisible,
  hideStories,
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

  const handleToggleHiddenStories = async () => {
    const userRef = doc(database, "users", auth.currentUser.uid);

    try {
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const currentHiddenStories = userData.hiddenStories || [];

      if (currentHiddenStories.includes(item.uid)) {
        await updateDoc(userRef, {
          hiddenStories: arrayRemove(item.uid),
        });
        Alert.alert(t("userProfile.success"), t("userProfile.willSeeStories"));
      } else {
        await updateDoc(userRef, {
          hiddenStories: arrayUnion(item.uid),
        });
        Alert.alert(t("userProfile.success"), t("userProfile.willNotSeeStories"));
      }

      setIsHidden(!isHidden);
    } catch (error) {
      console.error("Error updating hidden stories:", error);
      Alert.alert(t("userProfile.error"), t("userProfile.hiddenStoriesUpdateError"));
    }
  };

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
        navigation.navigate("UserProfile", {
          selectedUser: {
            id: item.uid,
            username: item.username,
            firstName: item.firstName,
            lastName: item.lastName,
            profileImage: item.profileImage,
            hasStories: item.hasStories || false,
            photoUrls: [item.profileImage],
          },
          database,
          navigation,
          t
        });
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
          name="pushpino"
          size={18}
          color={isPinned ? "#007AFF" : "#000"}
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
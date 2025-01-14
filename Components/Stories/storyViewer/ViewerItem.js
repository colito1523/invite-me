import React from "react";
import { TouchableOpacity, Text, Image } from "react-native";
import { Ionicons, AntDesign, Entypo } from "@expo/vector-icons";
import styles from "./StoryViewStyles";

const ViewerItem = ({
  item,
  currentStory,
  pinnedViewers,
  handleUserPress,
  handlePinViewer,
  handleThreeDotsPress,
  setViewersModalVisible,
  setIsPaused,
  auth,
  database,
  t,
  setSelectedViewer,
  setIsHideStoryModalVisible,
}) => {
  const hasLiked = currentStory?.likes?.some((like) => like.uid === item.uid);
  const isPinned = pinnedViewers.some((pv) => pv.uid === item.uid);

  return (
    <TouchableOpacity
      style={styles.viewerItem}
      onPress={async () => {
        setViewersModalVisible(false);
        setIsPaused(false);
        await new Promise((resolve) => setTimeout(resolve, 100));
        handleUserPress({
          selectedUser: {
            id: item.uid,
            username: item.username,
            firstName: item.firstName,
            lastName: item.lastName,
            profileImage: item.profileImage,
            hasStories: item.hasStories || false,
          },
          database,
          navigation,
          t,
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
        onPress={() =>
          handleThreeDotsPress({
            viewer: item,
            database,
            setSelectedViewer,
            setIsHideStoryModalVisible,
            user: auth.currentUser,
          })
        }
      >
        <Entypo name="dots-three-horizontal" size={18} color="#000" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default ViewerItem;

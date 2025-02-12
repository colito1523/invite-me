// StoryHeader.js
import React from "react";
import { View, TouchableOpacity, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "./StoryViewStyles";

const StoryHeader = ({
  currentStory,
  user,
  t,
  hoursAgo,
  onProfilePress,
  onOptionsPress,
}) => {
  return (
    <View style={styles.userInfo}>
      <TouchableOpacity
        style={styles.userDetails}
        onPress={onProfilePress}
      >
        <Image
          source={{
            uri: `${currentStory.profileImage}?alt=media&w=10&h=10&q=5`,
          }}
          style={styles.avatar}
          resizeMode="cover"
          defaultSource={require("../../../assets/perfil.jpg")}
        />
        <Text style={styles.username}>
          {`${currentStory.username} ${currentStory.lastName || ""}`}
        </Text>
      </TouchableOpacity>
      <View style={styles.rightInfo}>
        <Text style={styles.timeAgo}>
          {t("storyViewer.hoursAgo", { hours: hoursAgo })}
        </Text>
        <TouchableOpacity onPress={onOptionsPress}>
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StoryHeader;

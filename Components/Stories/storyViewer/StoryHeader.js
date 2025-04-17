// StoryHeader.js
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import styles from "./StoryViewStyles";

const StoryHeader = ({
  currentStory,
  user,
  t,
  hoursAgo,
  onProfilePress,
  onOptionsPress,
}) => {
  if (!currentStory) {
    return null;
  }

  const [imageUri, setImageUri] = useState(
    currentStory?.lowQualityProfileImage || 
    (currentStory?.profileImage ? `${currentStory.profileImage}?alt=media&w=10&h=10&q=5` : null)
  );

  useEffect(() => {
    if (currentStory?.profileImage) {
      setTimeout(() => {
        setImageUri(currentStory.profileImage);
      }, 0);
    }
  }, [currentStory?.profileImage]);

  // Función para formatear el tiempo adecuadamente
  const formatTimeAgo = (hours) => {
    const totalMinutes = Math.floor(hours * 60);
    if (totalMinutes < 60) {
      return t("storyViewer.minutesAgo", { minutes: totalMinutes });
    }
    return t("storyViewer.hoursAgo", { hours: Math.floor(hours) });
  };
  

  return (
    <View style={styles.userInfo}>
      <TouchableOpacity style={styles.userDetails} onPress={onProfilePress}>
        <Image
          source={{
            uri: imageUri,
            cache: "force-cache",
          }}
          style={styles.avatar}
          contentFit="cover"
          placeholder={{ blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj" }}
          defaultSource={require("../../../assets/perfil.jpg")}
        />
       <Text style={styles.username}>
  {currentStory.username?.trim()
    ? `${currentStory.username.trim()} ${currentStory.lastName || ""}`.trim()
    : `${currentStory.firstName || ""} ${currentStory.lastName || ""}`.trim()}
</Text>

      </TouchableOpacity>
      <View style={styles.rightInfo}>
        <Text style={styles.timeAgo}>
          {formatTimeAgo(hoursAgo)}
        </Text>
        <TouchableOpacity onPress={onOptionsPress}>
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StoryHeader;
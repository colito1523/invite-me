// StoryHeader.js
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image"; // Usando expo-image para mejor optimización
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

  // Luego cambiar a la imagen en alta calidad si existe
  useEffect(() => {
    if (currentStory?.profileImage) {
      setTimeout(() => {
        setImageUri(currentStory.profileImage);
      }, 0); // Retraso para mejorar la UX
    }
  }, [currentStory?.profileImage]);

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
          placeholder={{ blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj" }} // Placeholder borroso
          defaultSource={require("../../../assets/perfil.jpg")} // Imagen por defecto si no hay ninguna disponible
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
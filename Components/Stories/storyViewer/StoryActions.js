// StoryActions.js
import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "./StoryViewStyles";

const StoryActions = ({
  message,
  setMessage,
  onSendMessage,
  onLikePress,
  isLiked,
  setIsPaused,
  t,
}) => {
  return (
    <View style={styles.messageContainer}>
      <TextInput
        style={styles.messageInput}
        placeholder={t("storyViewer.typePlaceholder")}
        placeholderTextColor="#FFFFFF"
        value={message}
        onChangeText={setMessage}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      />
      {message.trim().length > 0 && (
        <TouchableOpacity style={styles.iconButton} onPress={onSendMessage}>
          <Ionicons name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.iconButton} onPress={onLikePress}>
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={24}
          color={isLiked ? "red" : "#FFFFFF"}
        />
      </TouchableOpacity>
    </View>
  );
};

export default StoryActions;

import React from "react";
import { View, Text, Image } from "react-native";

export const renderMessage = ({ item, isOwnMessage }) => {
  return (
    <View style={{ alignSelf: isOwnMessage ? "flex-end" : "flex-start" }}>
      <Text>{item.text}</Text>
      {item.mediaType === "image" && <Image source={{ uri: item.mediaUrl }} style={{ width: 100, height: 100 }} />}
    </View>
  );
};

// PhotoSelector.js
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import styles from "./styles";

export default function PhotoSelector({ photo, onSelect, photoNumber }) {
  return (
    <View style={styles.photoContainer}>
      <TouchableOpacity style={styles.photoPlaceholder} onPress={onSelect}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.photo}
            cachePolicy="memory-disk"
          />
        ) : (
          <MaterialIcons name="add-photo-alternate" size={70} color="gray" />
        )}
        <View style={styles.numberContainer}>
          <Text style={styles.numberText}>{photoNumber}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
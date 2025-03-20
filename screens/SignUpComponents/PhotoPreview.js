// PhotoPreview.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { AntDesign } from "@expo/vector-icons";
import styles from "./styles";

export default function PhotoPreview({
  photo,
  photoNumber,
  name,
  interests = [],
  showIcons = false,
  translateInterestKey,
  t,
}) {
  return (
    <View style={styles.photoContainer}>
      <View style={[styles.photoPlaceholder, styles.photoPreviewContainer]}>
        <Image
          source={{ uri: photo }}
          style={[styles.photo, styles.photoPreview]}
          cachePolicy="memory-disk"
        />
      </View>
      <Text style={styles.nameText}>{name}</Text>
      {photoNumber === 3 ? (
        <View style={styles.rectanglesContainer}>
          <View style={styles.topRectanglesContainer}>
            <View style={styles.rectangle}>
              <Text style={styles.rectangleText}>
                {translateInterestKey(interests[0], t)}
              </Text>
            </View>
            <View style={styles.rectangle}>
              <Text style={styles.rectangleText}>
                {translateInterestKey(interests[1], t)}
              </Text>
            </View>
          </View>
          <View style={styles.bottomRectangleContainer} />
          <View style={styles.bottomRectanglesContainer}>
            <View style={styles.rectangle}>
              <Text style={styles.rectangleText}>
                {translateInterestKey(interests[2], t)}
              </Text>
            </View>
            <View style={styles.rectangle}>
              <Text style={styles.rectangleText}>
                {translateInterestKey(interests[3], t)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.rectanglesContainer}>
          <View style={styles.topRectanglesContainer}>
            <View style={styles.rectangle} />
            <View style={styles.rectangle} />
          </View>
          <View style={styles.bottomRectangleContainer}>
            <View style={styles.rectangle} />
          </View>
        </View>
      )}
      {showIcons && (
        <View style={styles.iconsContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <AntDesign name="adduser" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <AntDesign name="hearto" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <AntDesign name="message1" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

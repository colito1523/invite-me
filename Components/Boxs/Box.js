import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";

const { width } = Dimensions.get('window');

const Box = memo(({ imageUrl, title, onPress, selectedDate, DaySpecial, date, isPrivateEvent }) => {
  const displayDate = isPrivateEvent ? DaySpecial : selectedDate;
  const defaultImageUrl = "https://example.com/default-image.jpg";

  return (
    <TouchableOpacity onPress={onPress} style={styles.touchable}>
      <View style={styles.box}>
        <Image
          source={isPrivateEvent 
                   ? { uri: imageUrl && imageUrl.trim() !== "" ? imageUrl : defaultImageUrl } 
                   : imageUrl}
          style={[StyleSheet.absoluteFillObject, styles.image]}
          cachePolicy="memory-disk"
        />
        {DaySpecial ? (
          <View style={styles.daySpecialContainer}>
            <Text style={styles.daySpecialText}>{DaySpecial}</Text>
          </View>
        ) : isPrivateEvent ? (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        ) : (
          displayDate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{displayDate}</Text>
            </View>
          )
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  touchable: {
    width: width - 10,
    marginHorizontal: 0,
    marginBottom: 7,
    borderRadius: 15,
    overflow: "hidden",
    alignSelf: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  box: {
    width: "100%",
    height: 210,
    justifyContent: "flex-end",
    borderRadius: 15,
  },
  image: {
    borderRadius: 15,
  },
  daySpecialContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: "rgba(192, 163, 104, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  daySpecialText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  dateContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  textContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

export default Box;
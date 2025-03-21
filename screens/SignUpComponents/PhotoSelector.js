import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import styles from "./styles";
import { GestureHandlerRootView, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

export default function PhotoSelector({ photo, onSelect, photoNumber }) {
  const scale = useSharedValue(1); // Zoom
  const translateX = useSharedValue(0); // Movimiento en X
  const translateY = useSharedValue(0); // Movimiento en Y

  // Gesto de Zoom (Pinch)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      scale.value = withSpring(Math.max(1, Math.min(scale.value, 3))); // Límite de zoom (1x - 3x)
    });

  // Gesto de Arrastre (Pan)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  // Combinamos los gestos
  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Aplicamos animaciones
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.photoContainer}>
      <TouchableOpacity style={styles.photoPlaceholder} onPress={onSelect}>
        {photo ? (
          <GestureDetector gesture={combinedGesture}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Image
                source={{ uri: photo }}
                style={styles.photo}
                cachePolicy="memory-disk"
              />
            </Animated.View>
          </GestureDetector>
        ) : (
          <MaterialIcons name="add-photo-alternate" size={70} color="gray" />
        )}
        <View style={styles.numberContainer}>
          <Text style={styles.numberText}>{photoNumber}</Text>
        </View>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
}

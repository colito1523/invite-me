import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import styles from "./styles";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

// clamp: fuerza un valor a estar dentro de [min, max].
const clamp = (value, min, max) => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

// FACTORES DE SENSIBILIDAD
const pinchFactor = 0.1; // reduce la sensibilidad del zoom
const panFactor = 0.07;   // reduce la sensibilidad del arrastre

export default function PhotoSelector({ photo, onSelect, photoNumber }) {
  // Zoom y desplazamiento
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Medidas del contenedor
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Gesto de Zoom (Pinch)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      // Calculamos el "delta" de zoom con factor
      const delta = (event.scale - 1) * pinchFactor; 
      let newScale = scale.value + delta;

      // Límite de zoom entre 1 y 4 (puedes ajustar)
      newScale = clamp(newScale, 1, 4);

      scale.value = newScale;
    })
    .onEnd(() => {
      // Efecto de resorte suave
      scale.value = withSpring(scale.value);
    });

  // Gesto de Arrastre (Pan)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const { width, height } = containerSize;
      // Dimensiones de la imagen escalada
      const scaledWidth = width * scale.value;
      const scaledHeight = height * scale.value;

      // Máximo desplazamiento para no ver fondo
      const maxX = (scaledWidth - width) / 2;
      const maxY = (scaledHeight - height) / 2;

      // Movimiento con factor
      let dx = event.translationX * panFactor;
      let dy = event.translationY * panFactor;

      let newX = translateX.value + dx;
      let newY = translateY.value + dy;

      // Evitamos que se salga del contenedor
      newX = clamp(newX, -maxX, maxX);
      newY = clamp(newY, -maxY, maxY);

      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      // Suavizamos el final
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  // Combinamos ambos gestos
  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Estilo animado
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Capturamos dimensiones del contenedor
  const onLayoutContainer = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  return (
    <GestureHandlerRootView style={styles.photoContainer} onLayout={onLayoutContainer}>
      <TouchableOpacity style={styles.photoPlaceholder} onPress={onSelect}>
        {photo ? (
          <GestureDetector gesture={combinedGesture}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Image
                source={{ uri: photo }}
                style={styles.photo}
                contentFit="cover"  // Rellena el contenedor para no dejar espacios
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

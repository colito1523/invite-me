import React, { useState, useRef } from "react";
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
  runOnJS,
} from "react-native-reanimated";

// Función para "clamp" (forzar valor dentro de un rango)
const clamp = (value, min, max) => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

export default function PhotoSelector({ photo, onSelect, photoNumber }) {
  // Escala (zoom) y desplazamientos (arrastre)
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Dimensiones del contenedor (para calcular bounding). 
  // Usamos un ref o estado para guardar alto y ancho reales.
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Gesto de Zoom (Pinch)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      // Calculamos nueva escala
      let newScale = scale.value * event.scale;
      // Forzamos que la escala sea >= 1 y <= 4 (por ejemplo).
      if (newScale < 1) newScale = 1;
      if (newScale > 4) newScale = 4;
      scale.value = newScale;
    })
    .onEnd(() => {
      // Ajuste suave (si quieres un efecto de resorte)
      scale.value = withSpring(scale.value);
    });

  // Gesto de Arrastre (Pan)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const width = containerSize.width;
      const height = containerSize.height;
      // Tamaño efectivo de la imagen tras el zoom
      const scaledWidth = width * scale.value;
      const scaledHeight = height * scale.value;

      // Si la imagen está "cubriendo" el contenedor: 
      // Calculamos el máximo desplazamiento permitido para que no se vea el fondo.
      const maxX = (scaledWidth - width) / 2;
      const maxY = (scaledHeight - height) / 2;

      let newX = translateX.value + event.translationX;
      let newY = translateY.value + event.translationY;

      // Ajustamos (clamp) para no salirnos de los bordes
      newX = clamp(newX, -maxX, maxX);
      newY = clamp(newY, -maxY, maxY);

      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      // Resorte suave
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  // Combinamos ambos gestos
  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Estilos animados: zoom y arrastre
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Callback para capturar el tamaño real del contenedor
  const onLayoutContainer = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  return (
    <GestureHandlerRootView
      style={styles.photoContainer}
      onLayout={onLayoutContainer} // Capturamos dimensiones del contenedor
    >
      <TouchableOpacity style={styles.photoPlaceholder} onPress={onSelect}>
        {photo ? (
          <GestureDetector gesture={combinedGesture}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Image
                source={{ uri: photo }}
                style={styles.photo}
                contentFit="cover"  // 💥 La clave para cubrir siempre
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

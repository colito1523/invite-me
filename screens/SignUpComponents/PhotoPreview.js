import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { AntDesign } from "@expo/vector-icons";
import { GestureDetector, GestureHandlerRootView, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import styles from "./styles";

// Función clamp para forzar valores dentro de un rango
const clamp = (value, min, max) => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

// Ajusta la sensibilidad y límites a tu gusto
const PINCH_FACTOR = 1.5; 
const PAN_FACTOR = 1.5;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

export default function PhotoPreview({
  photo,
  photoNumber,
  name,
  interests = [],
  showIcons = false,
  translateInterestKey,
  t,
}) {
  // Zoom y desplazamiento
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Almacenan la escala/posición al iniciar cada gesto
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Capturamos el tamaño real del contenedor para hacer bounding (evitar salir del contenedor)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Medir el contenedor (photoPlaceholder + photoPreviewContainer)
  const onLayoutContainer = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  // ----------------------------
  //       Gesto de Pinch (Zoom)
  // ----------------------------
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      // Guardamos escala inicial
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      // Calculamos delta con factor de sensibilidad
      const pinchDelta = (event.scale - 1) * PINCH_FACTOR;
      const newScale = startScale.value + pinchDelta;
      // No clamp en update para mayor fluidez
      scale.value = newScale;
    })
    .onEnd(() => {
      // Al terminar, aplicamos clamp y una animación de resorte
      scale.value = withSpring(clamp(scale.value, MIN_SCALE, MAX_SCALE));
    });

  // ----------------------------
  //       Gesto de Pan (Arrastre)
  // ----------------------------
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Guardamos posición inicial
      startX.value = translateX.value;
      startY.value = translateY.value;
      console.log("📍 Posición inicial:", startX.value, startY.value); 
    })
    .onUpdate((event) => {
      // Calcula la traslación con factor de sensibilidad
      const dx = event.translationX * PAN_FACTOR;
      const dy = event.translationY * PAN_FACTOR;
      // Sumamos a la posición inicial
      translateX.value = startX.value + dx;
      translateY.value = startY.value + dy;
      console.log("🔄 Posición actual:", translateX.value, translateY.value); // 👈 AÑADIR ACÁ
    })
    .onEnd(() => {
      const scaledWidth = containerSize.width * scale.value;
      const scaledHeight = containerSize.height * scale.value;
    
      const maxX = (scaledWidth - containerSize.width) / 2;
      const maxY = (scaledHeight - containerSize.height) / 2;
    
      // Clamp
      const clampedX = clamp(translateX.value, -maxX, maxX);
      const clampedY = clamp(translateY.value, -maxY, maxY);
    
      translateX.value = withSpring(clampedX);
      translateY.value = withSpring(clampedY);
    
      console.log("✅ Posición final (clamp):", clampedX, clampedY);
    
      // ---- Cálculo de recorte en la imagen original ----
    
      // Proporción de desplazamiento en la imagen original
      const offsetX = (scaledWidth - containerSize.width) / 2 - clampedX;
      const offsetY = (scaledHeight - containerSize.height) / 2 - clampedY;
    
      const visibleX = offsetX / scaledWidth;
      const visibleY = offsetY / scaledHeight;
    
      const visibleWidth = containerSize.width / scaledWidth;
      const visibleHeight = containerSize.height / scaledHeight;
    
      console.log("📸 Región visible relativa:");
      console.log("X:", visibleX.toFixed(3));
      console.log("Y:", visibleY.toFixed(3));
      console.log("Width:", visibleWidth.toFixed(3));
      console.log("Height:", visibleHeight.toFixed(3));
    })
    

  // Combinamos ambos gestos
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Estilo animado para aplicar zoom + arrastre
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureHandlerRootView style={styles.photoContainer}>
      {/* Contenedor del preview con onLayout para medir tamaño */}
      <View
        style={[styles.photoPlaceholder, styles.photoPreviewContainer]}
        onLayout={onLayoutContainer}
      >
        {/* Gestos combinados */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageContainer, animatedStyle]}>
            <Image
              source={{ uri: photo }}
              style={[styles.photo, styles.photoPreview]}
              // "cover" para llenar el contenedor
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Nombre y rectángulos, etc. */}
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

      {/* Íconos opcionales */}
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
    </GestureHandlerRootView>
  );
}

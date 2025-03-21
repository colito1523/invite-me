import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { GestureDetector, GestureHandlerRootView, Gesture } from "react-native-gesture-handler";
import { runOnJS, useDerivedValue } from "react-native-reanimated";
import { Image as ExpoImage } from "expo-image"; // para renderizar
import { Image as RNImage } from "react-native";  // para medir
import * as ImageManipulator from "expo-image-manipulator";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import styles from "./styles";

const clamp = (value, min, max) => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

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
  handleAnswer,
}) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const targetScale = useSharedValue(1);
  const shouldCrop = useSharedValue(false);

  const onLayoutContainer = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const cropVisibleRegion = async (scaleVal, translateXVal, translateYVal) => {
    try {
      const imageSize = await new Promise((resolve, reject) => {
        RNImage.getSize(photo, (width, height) => resolve({ width, height }), reject);
      });
      const { width: imageWidth, height: imageHeight } = imageSize;
  
      const containerRatio = containerSize.width / containerSize.height;
      const imageRatio = imageWidth / imageHeight;
  
      let fittedWidth, fittedHeight;
      if (imageRatio > containerRatio) {
        // Imagen más ancha que el contenedor → recorte horizontal
        fittedHeight = containerSize.height;
        fittedWidth = containerSize.height * imageRatio;
      } else {
        // Imagen más alta que el contenedor → recorte vertical
        fittedWidth = containerSize.width;
        fittedHeight = containerSize.width / imageRatio;
      }
  
      // Escala total aplicada (zoom + ajuste de cover)
      const totalScale = scaleVal;
      const scaledWidth = fittedWidth * totalScale;
      const scaledHeight = fittedHeight * totalScale;
  
      // Offset visual del centro desplazado
      const offsetX = (scaledWidth - containerSize.width) / 2 - translateXVal;
      const offsetY = (scaledHeight - containerSize.height) / 2 - translateYVal;
  
      // Proporciones relativas respecto a imagen renderizada
      const visibleXRatio = offsetX / scaledWidth;
      const visibleYRatio = offsetY / scaledHeight;
      const visibleWRatio = containerSize.width / scaledWidth;
      const visibleHRatio = containerSize.height / scaledHeight;
  
      // Convertimos a coordenadas reales sobre la imagen original
      const cropConfig = {
        originX: Math.max(visibleXRatio * imageWidth, 0),
        originY: Math.max(visibleYRatio * imageHeight, 0),
        width: visibleWRatio * imageWidth,
        height: visibleHRatio * imageHeight,
      };
  
      const result = await ImageManipulator.manipulateAsync(
        photo,
        [{ crop: cropConfig }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
  
      handleAnswer(`photo${photoNumber}`, result.uri);
      console.log("✅ Imagen recortada correctamente:", result.uri);
    } catch (err) {
      console.error("❌ Error al recortar imagen:", err);
    }
  };
  
  

  useDerivedValue(() => {
    if (shouldCrop.value) {
      runOnJS(cropVisibleRegion)(
        targetScale.value,
        translateX.value,
        translateY.value
      );
      shouldCrop.value = false;
    }
  });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      const pinchDelta = (event.scale - 1) * PINCH_FACTOR;
      const newScale = startScale.value + pinchDelta;
      scale.value = newScale;
    })
    .onEnd(() => {
      const clamped = clamp(scale.value, MIN_SCALE, MAX_SCALE);
      scale.value = withSpring(clamped);
      targetScale.value = clamped;
      shouldCrop.value = true;
    });

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const dx = event.translationX * PAN_FACTOR;
      const dy = event.translationY * PAN_FACTOR;
      translateX.value = startX.value + dx;
      translateY.value = startY.value + dy;
    })
    .onEnd(() => {
      const scaledWidth = containerSize.width * scale.value;
      const scaledHeight = containerSize.height * scale.value;
      const maxX = (scaledWidth - containerSize.width) / 2;
      const maxY = (scaledHeight - containerSize.height) / 2;

      const clampedX = clamp(translateX.value, -maxX, maxX);
      const clampedY = clamp(translateY.value, -maxY, maxY);

      translateX.value = withSpring(clampedX);
      translateY.value = withSpring(clampedY);

      targetScale.value = scale.value;
      shouldCrop.value = true;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

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
      <View
        style={[styles.photoPlaceholder, styles.photoPreviewContainer]}
        onLayout={onLayoutContainer}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageContainer, animatedStyle]}>
            <Image
              source={{ uri: photo }}
              style={[styles.photo, styles.photoPreview]}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </Animated.View>
        </GestureDetector>
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
    </GestureHandlerRootView>
  );
}
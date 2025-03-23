import React, { useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Image as RNImage } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useDerivedValue,
  runOnJS,
} from "react-native-reanimated";
import { GestureDetector, GestureHandlerRootView, Gesture } from "react-native-gesture-handler";
import * as ImageManipulator from "expo-image-manipulator";
const clamp = (value, min, max) => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const PINCH_FACTOR = 1.5;
const PAN_FACTOR = 1.5;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

export default function EditablePhoto({ uri, index, onSave }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const targetScale = useSharedValue(1);
  const shouldCrop = useSharedValue(false);


  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const onLayoutContainer = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const cropVisibleRegion = async (scaleVal, translateXVal, translateYVal) => {
    try {
      const imageSize = await new Promise((resolve, reject) => {
        RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
      });
      const { width: imageWidth, height: imageHeight } = imageSize;

      const containerRatio = containerSize.width / containerSize.height;
      const imageRatio = imageWidth / imageHeight;

      let fittedWidth = containerSize.width;
      let fittedHeight = containerSize.height;

      if (imageRatio > containerRatio) {
        fittedWidth = containerSize.height * imageRatio;
      } else {
        fittedHeight = containerSize.width / imageRatio;
      }

      const totalScale = scaleVal;
      const scaledWidth = fittedWidth * totalScale;
      const scaledHeight = fittedHeight * totalScale;

      const offsetX = (scaledWidth - containerSize.width) / 2 - translateXVal;
      const offsetY = (scaledHeight - containerSize.height) / 2 - translateYVal;

      const visibleXRatio = offsetX / scaledWidth;
      const visibleYRatio = offsetY / scaledHeight;
      const visibleWRatio = containerSize.width / scaledWidth;
      const visibleHRatio = containerSize.height / scaledHeight;

      const cropConfig = {
        originX: Math.max(visibleXRatio * imageWidth, 0),
        originY: Math.max(visibleYRatio * imageHeight, 0),
        width: visibleWRatio * imageWidth,
        height: visibleHRatio * imageHeight,
      };

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: cropConfig }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      onSave(result.uri);
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
    let newScale = startScale.value + (event.scale - 1) * PINCH_FACTOR;
    newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);
    scale.value = newScale;
  })
  .onEnd(() => {
    targetScale.value = scale.value;
    shouldCrop.value = true;  // <<--- ACTIVAR el recorte
  });

const panGesture = Gesture.Pan()
  .minPointers(2)
  .maxPointers(2)
  .onBegin(() => {
    startX.value = translateX.value;
    startY.value = translateY.value;
  })
  .onUpdate((event) => {
    const dx = event.translationX * PAN_FACTOR;
    const dy = event.translationY * PAN_FACTOR;
    let newX = startX.value + dx;
    let newY = startY.value + dy;
    const scaledWidth = containerSize.width * scale.value;
    const scaledHeight = containerSize.height * scale.value;
    const maxX = (scaledWidth - containerSize.width) / 2;
    const maxY = (scaledHeight - containerSize.height) / 2;
    newX = clamp(newX, -maxX, maxX);
    newY = clamp(newY, -maxY, maxY);
    translateX.value = newX;
    translateY.value = newY;
  })
  .onEnd(() => {
    targetScale.value = scale.value;
    shouldCrop.value = true;  // <<--- ACTIVAR el recorte
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
          <ExpoImage
  source={{ uri }}
  onLoad={() => {
    // Una vez que se cargue la nueva imagen recortada,
    // resetea inmediatamente los valores de transformación.
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
  }}
  style={[styles.photo, styles.photoPreview]}
  contentFit="cover"
  cachePolicy="memory-disk"
/>
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
    photoPreviewContainer: {
        width: screenWidth,
        height: screenHeight , // o el valor que uses normalmente
        overflow: "hidden",
        backgroundColor: "#000", // para ver el contorno
      },
      
      imageContainer: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      },
      
      photo: {
        width: "100%",
        height: "100%",
      },
      
      photoPreview: {
        resizeMode: "cover",
      },
      
});
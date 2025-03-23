import React, { useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Image as RNImage } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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
    .minPointers(2)  // Solo activar con 2 dedos
    .maxPointers(2)
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
            <ExpoImage
              source={{ uri }}
              style={[styles.photo, styles.photoPreview]}
              contentFit="contain" // Ajusta la imagen completa sin cortarla
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
// utils.ts
import { captureRef } from 'react-native-view-shot';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadStory } from '../Stories/storySlider/storySliderUtils';
import i18n from 'i18next';
import { MediaLibrary } from 'expo-media-library';

// --- Imports para Pinch & Pan:
import { Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

interface UploadStoryParams {
  photo: { 
    uri: string; 
    type: 'image' | 'video'; 
    exif?: any; 
    width?: number; 
    height?: number;
  };
  viewShotRef: any;
  navigation: any;
  setIsUploading: (value: boolean) => void;
  setUploadProgress: (value: number) => void;
  setStories: (stories: any[]) => void;
  setUnseenStories: (stories: Record<string, any>) => void;
}

export const handleUploadStoryUtil = async ({
  photo,
  viewShotRef,
  navigation,
  setIsUploading,
  setUploadProgress,
  setStories,
  setUnseenStories,
}: UploadStoryParams) => {
  setIsUploading(true);

  try {
    if (photo.type === 'image') {
      // 1) Capturamos la vista (con pinch/zoom aplicado)
      const uriFinal = await captureRef(viewShotRef, { format: 'png', quality: 0.9 });

      // 2) Manipulamos (resize/compress) la imagen
      const manipulatedResult = await ImageManipulator.manipulateAsync(
        uriFinal,
        [{ resize: { width: 1080 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 3) Subimos la imagen resultante
      await uploadStory(
        manipulatedResult.uri,
        () => {},
        setIsUploading,
        setUploadProgress,
        setStories,
        setUnseenStories
      );
    } else {
      // Si es video, usamos la URI original sin aplicar pinch/zoom:
      const manipulatedResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );

      await uploadStory(
        manipulatedResult.uri,
        () => {},
        setIsUploading,
        setUploadProgress,
        setStories,
        setUnseenStories
      );
    }

    // Pausa para que la animación de subida sea visible
    await new Promise(resolve => setTimeout(resolve, 500));

    // Determinamos la categoría según el idioma
    const selectedCategory = i18n.language === "en" ? "All" : "Todos";

    // Reiniciamos la navegación a la pantalla Home con los parámetros actualizados
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Home',
          params: { 
            selectedCategory,
            forceStoryUpdate: true,
            timestamp: Date.now(),
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error al subir la imagen/video:', error);
  }

  setIsUploading(false);
};




interface ChatParams {
  photo: { uri: string; type: 'image' | 'video'; [key: string]: any };
  viewShotRef: any;
  onCapture?: (photoData: any) => void;
  navigation: any;
  isViewOnce: boolean;
}

export const handleSendToChatUtil = async ({
  photo,
  viewShotRef,
  onCapture,
  navigation,
  isViewOnce,
}: ChatParams) => {
  if (!onCapture) return;

  if (photo.type === 'image') {
    const uriFinal = await captureRef(viewShotRef, { format: 'png', quality: 0.9 });
    onCapture({ ...photo, uri: uriFinal, isViewOnce });
  } else {
    onCapture({ ...photo, isViewOnce });
  }

  navigation.goBack();
};


interface PhotoData {
  uri: string;
  width?: number;
  height?: number;
  exif?: any;
  type?: string;
}

// utils.ts (fragmento final con el hook)
export const usePinchPanGestures = (photo: PhotoData) => {
  // a) Shared values
  const scale = useSharedValue(1);
  const initialScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  // Para rotación:
  const rotation = useSharedValue(0);
  const initialRotation = useSharedValue(0);

  // b) Pinch Gesture
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      initialScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = initialScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 0.8) {
        scale.value = withSpring(0.8);
      }
    });

  // c) Pan Gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = offsetX.value + event.translationX;
      translateY.value = offsetY.value + event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  // d) Rotation Gesture
  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      initialRotation.value = rotation.value;
    })
    .onUpdate((event) => {
      rotation.value = initialRotation.value + event.rotation;
    })
    .onEnd(() => {
      // Si quisieras animación, algo como:
      // rotation.value = withSpring(rotation.value);
    });

  // e) Combinamos los tres gestos
  const combinedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    rotationGesture
  );

  // f) Estilo animado
  const animatedImageStyle = useAnimatedStyle(() => {
    let exifRotation = 0;
    if (photo.width && photo.height && photo.width > photo.height) {
      exifRotation = photo.exif?.Orientation === 3 ? 270 : 90;
    }

    const rotationInDegrees = (rotation.value * 180) / Math.PI;

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${exifRotation + rotationInDegrees}deg` },
      ],
    };
  });

  return {
    combinedGesture,
    animatedImageStyle,
  };
};







// PhotoPreviewSection.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import { useState, useEffect, useRef } from "react";
import { ActivityIndicator } from "react-native";
import { styles } from "./styles";
import React from "react";
import { 
  TouchableOpacity, 
  View, 
  Text, 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from "react-i18next";
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';  // Importamos el reproductor de video
import { handleDownloadMediaUtil, handleSendToChatUtil, handleUploadStoryUtil } from './utils';

// ---- Imports para Pinch & Pan + captura de pantalla ----
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';

interface Props {
  photo: CameraCapturedPicture & { type?: 'image' | 'video' }; // propiedad 'type' para diferenciar imágenes y videos
  handleRetakePhoto: () => void;
  onCapture?: (photoData: CameraCapturedPicture) => void; // opcional si venimos del chat
}

const PhotoPreviewSection = ({
  photo,
  handleRetakePhoto,
  onCapture,
}: Props) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stories, setStories] = useState([]);       // (originales)
  const [unseenStories, setUnseenStories] = useState({}); // (originales)
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'default' | 'loading' | 'success'>('default');

  // Opción "isViewOnce" en modo chat
  const [isViewOnce, setIsViewOnce] = useState(false);

  // Referencia si es video
  const videoRef = React.useRef<Video | null>(null);

  // Referencia para "capturar" la vista en caso de ser imagen
  // (para que al subir/descargar se respete el pinch/zoom)
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(status === 'granted');
    })();
  }, []);

  // ---------------- Pinch & Pan solo para imágenes ---------------- //
  // (Si es un video, mantenemos la reproducción normal sin pinch/zoom)
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      // Volver suave si se achicó mucho
      if (scale.value < 0.8) {
        scale.value = withSpring(0.8);
      }
    });

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      // Suavizado con spring
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  // Combinamos los dos gestos simultáneamente
  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Estilo animado para la imagen
  const animatedImageStyle = useAnimatedStyle(() => {
    // Ajustamos posible rotación si la foto es horizontal (lógica original)
    let rotation = 0;
    if (photo.width > photo.height) {
      // Ajuste según exif
      rotation = photo.exif?.Orientation === 3 ? 270 : 90;
    }

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  // -----------------------------------------------------------------
  // Funciones de BOTONES principales
  // -----------------------------------------------------------------

  const handleUploadStory = async () => {
    await handleUploadStoryUtil({
      photo,
      viewShotRef,
      navigation,
      setIsUploading,
      setUploadProgress,
      setStories,
      setUnseenStories,
    });
  };

  const handleSendToChat = async () => {
    await handleSendToChatUtil({
      photo,
      viewShotRef,
      onCapture,
      navigation,
      isViewOnce,
    });
  };

  const handleDownloadMedia = async () => {
    if (!hasMediaLibraryPermission) return;
    setDownloadStatus('loading');
    const result = await handleDownloadMediaUtil({
      photo,
      hasMediaLibraryPermission,
      viewShotRef,
    });
    setDownloadStatus(result);
    if (result === 'success') {
      setTimeout(() => setDownloadStatus('default'), 2000);
    }
  };

  // --- Botón principal: subir o enviar ---
  const isChatMode = !!onCapture;
  const mainButtonLabel = isChatMode ? t("storySlider.send") : t("storySlider.addStory");
  const mainButtonAction = isChatMode ? handleSendToChat : handleUploadStory;

  return (
    <View style={styles.container}>

      {photo.type === 'video' ? (
        // Video sin pinch/zoom
        <Video
          ref={videoRef}
          source={{ uri: photo.uri }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          isLooping
          shouldPlay
        />
      ) : (
        // Imagen con pinch/zoom
        // 1) Envolvemos en ViewShot para capturar
        <ViewShot ref={viewShotRef} style={styles.viewShotContainer}>
          <GestureDetector gesture={combinedGesture}>
            <Animated.Image
              source={{ uri: photo.uri }}
              style={[styles.previewImage, animatedImageStyle]}
              resizeMode="cover"
            />
          </GestureDetector>
        </ViewShot>
      )}

      {/* Botón "Cerrar" o "Retomar foto/video" */}
      <TouchableOpacity style={styles.closeButton} onPress={handleRetakePhoto}>
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>

      {/* Botón de descarga */}
      <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadMedia}>
        {downloadStatus === 'loading' ? (
          <ActivityIndicator size="small" color="white" />
        ) : downloadStatus === 'success' ? (
          <Ionicons name="checkmark" size={30} color="white" />
        ) : (
          <Ionicons name="download" size={30} color="white" />
        )}
      </TouchableOpacity>

      {/* Botón principal (enviar al chat o subir historia) */}
      {mainButtonAction && (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={mainButtonAction}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="black" />
          ) : (
            <>
              <Text style={styles.uploadButtonText}>{mainButtonLabel}</Text>
              <Ionicons name="arrow-forward" size={24} color="rgba(0, 0, 0, 0.6)" />
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Si es modo chat y es imagen, se muestra la opción para isViewOnce */}
      {isChatMode && photo.type !== 'video' && (
        <TouchableOpacity
          style={styles.viewOnceToggle}
          onPress={() => setIsViewOnce(prev => !prev)}
        >
          <Ionicons
            name={isViewOnce ? "eye-off-outline" : "eye-outline"}
            size={30}
            color="white"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PhotoPreviewSection;


// PhotoPreviewSection.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import { useState, useEffect, useRef } from "react";
import { ActivityIndicator } from "react-native";
import { styles } from "./styles";
import { Audio } from 'expo-av';
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
import { handleSendToChatUtil, handleUploadStoryUtil, usePinchPanGestures  } from './utils';

// ---- Imports para Pinch & Pan + captura de pantalla ----
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
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
  useEffect(() => {
  }, [photo]);
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
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true, // 🔈 Esto es CLAVE en iOS
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error configurando el audio:', error);
      }
    })();
  }, []);
  


  const { combinedGesture, animatedImageStyle } = usePinchPanGestures(photo);
 
  // -----------------------------------------------------------------
  // Funciones de BOTONES principales
  // -----------------------------------------------------------------

  const handleDownloadPhoto = async () => {
    if (!hasMediaLibraryPermission) return;
    setDownloadStatus('loading');

    try {
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        const albumName = "Historias Guardadas";
        let album = await MediaLibrary.getAlbumAsync(albumName);
        
        if (!album) {
            album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
        
        setDownloadStatus('success');
        setTimeout(() => setDownloadStatus('default'), 2000);
    } catch (error) {
        console.error('Error al descargar la imagen:', error);
        setDownloadStatus('default');
    }
};

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
              resizeMode="contain"
            />
          </GestureDetector>
        </ViewShot>
      )}

      {/* Botón "Cerrar" o "Retomar foto/video" */}
      <TouchableOpacity style={styles.closeButton} onPress={handleRetakePhoto}>
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>

      {/* Botón de descarga */}
      <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPhoto}>
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
              <Ionicons name="arrow-forward" size={20} color="black" />
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Si es modo chat y es imagen, se muestra la opción para isViewOnce */}
      {isChatMode && photo.type !== 'video' && (
  <TouchableOpacity
    style={styles.viewOnceButton}
    onPress={() => setIsViewOnce(prev => !prev)}
  >
    <Text style={styles.viewOnceText}>
    {isViewOnce ? t("chatUsers.viewOnce") : t("chatUsers.keepInChat")}
    </Text>
  </TouchableOpacity>
)}

    </View>
  );
};

export default PhotoPreviewSection;


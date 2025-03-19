// PhotoPreviewSection.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import { useState, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import React from "react";
import i18n from 'i18next';
import { TouchableOpacity, View, Image, StyleSheet, Text, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from "react-i18next";
import { uploadStory } from '../Stories/storySlider/storySliderUtils'; 
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';  // Importamos el reproductor de video

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Props {
  photo: CameraCapturedPicture & { type?: 'image' | 'video' }; // Agregamos la propiedad 'type' para diferenciar imágenes y videos
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
  const [stories, setStories] = useState([]);
  const [unseenStories, setUnseenStories] = useState({});
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'default' | 'loading' | 'success'>('default');

  // Estado para la opción "isViewOnce" en modo chat
  const [isViewOnce, setIsViewOnce] = useState(false);
  const videoRef = React.useRef<Video | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(status === 'granted');
    })();
  }, []);

  // --- Botón "Subir historia" (si NO hay onCapture) ---
  const handleUploadStory = async () => {
    setIsUploading(true);
    try {
      const manipulatedResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.50, format: ImageManipulator.SaveFormat.JPEG }
      );

      await uploadStory(
        manipulatedResult.uri,
        () => {},
        setIsUploading,
        setUploadProgress,
        setStories,
        setUnseenStories
      );

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const selectedCategory = i18n.language === "en" ? "All" : "Todos";

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
      console.error('Error al comprimir la imagen:', error);
    }
    setIsUploading(false);
  };

  // --- Botón "Enviar al chat" (si SÍ hay onCapture) ---
  const handleSendToChat = () => {
    if (onCapture) {
      // Se añade la propiedad isViewOnce a la foto antes de enviarla
      onCapture({ ...photo, isViewOnce });
      navigation.goBack();
    }
  };

  // Ajuste de rotación si la foto salió en horizontal
  let rotation = 0;
  if (photo.width > photo.height) {
    rotation = photo.exif?.Orientation === 3 ? 270 : 90;
  } else {
    rotation = 0;
  }

  const handleDownloadMedia = async () => {
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
      console.error('Error al descargar el archivo:', error);
      setDownloadStatus('default');
    }
  };

  // Etiqueta y acción del botón principal:
  const isChatMode = !!onCapture;
  const mainButtonLabel = isChatMode ? t("storySlider.send") : t("storySlider.addStory");
  const mainButtonAction = isChatMode ? handleSendToChat : handleUploadStory;

  return (
    <View style={styles.container}>
      {photo.type === 'video' ? (
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
        <Image
          style={styles.previewImage}
          source={{ uri: photo.uri }}
          resizeMode="cover"
        />
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

      {/* Si es modo chat, se muestra la opción para isViewOnce */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: screenWidth,
    height: screenHeight,
    alignSelf: 'center',
    position: 'absolute',
  },
  video: {
    width: screenWidth,
    height: screenHeight,
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  downloadButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  uploadButton: {
    position: "absolute",
    bottom: 40,
    right: 10,
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "rgba(0, 0, 0, 0.6)",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 15,
  },
  viewOnceToggle: {
    position: "absolute",
    bottom: 50,
    left: 30,
  },
});

export default PhotoPreviewSection;

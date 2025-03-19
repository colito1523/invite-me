import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator 
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import { useTranslation } from "react-i18next";
import { useNavigation } from '@react-navigation/native';

import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

import ViewShot, { captureRef } from "react-native-view-shot";
import * as MediaLibrary from 'expo-media-library';
import { uploadStory } from '../Stories/storySlider/storySliderUtils';

import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryPhoto extends CameraCapturedPicture {
  type?: 'image' | 'video';
  isViewOnce?: boolean;
}

interface Props {
  photo: StoryPhoto;
  handleRetakePhoto: () => void;
  onCapture?: (photoData: StoryPhoto) => void;
}

const PhotoPreviewSection = ({ photo, handleRetakePhoto, onCapture }: Props) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [isUploading, setIsUploading] = useState(false);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'default' | 'loading' | 'success'>('default');

  const [isViewOnce, setIsViewOnce] = useState(false);

  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(status === 'granted');
    })();
  }, []);

  // ---------------- GESTOS CON GESTURE HANDLER ---------------- //
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Gestos combinados en un solo `GestureDetector`
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      scale.value = withSpring(Math.max(scale.value, 0.8)); // Limita el mínimo a 0.8
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  // Combinamos los gestos sin anidar
  const combinedGestures = Gesture.Simultaneous(pinchGesture, panGesture);

  // Estilo animado para aplicar a la imagen
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ---------------- FUNCIONES DE BOTONES ---------------- //
  const handleDownloadMedia = async () => {
    if (!hasMediaLibraryPermission) return;
    setDownloadStatus('loading');

    try {
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 0.8 });

      const asset = await MediaLibrary.createAssetAsync(uri);
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

  const isChatMode = !!onCapture; 
  const mainButtonLabel = isChatMode ? t("storySlider.send") : t("storySlider.addStory");

  const handleUploadStory = async () => {
    setIsUploading(true);
    try {
      const finalUri = await captureRef(viewShotRef, { format: 'png', quality: 0.8 });

      const manipulatedResult = await ImageManipulator.manipulateAsync(
        finalUri,
        [{ resize: { width: 1080 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );

      await uploadStory(manipulatedResult.uri, () => {}, setIsUploading, () => {}, () => {});

      navigation.reset({ index: 0, routes: [{ name: 'Home', params: { forceStoryUpdate: true, timestamp: Date.now() } }] });
    } catch (error) {
      console.error('Error al comprimir la imagen:', error);
    }
    setIsUploading(false);
  };

  const handleSendToChat = async () => {
    if (!onCapture) return;

    const finalUri = await captureRef(viewShotRef, { format: 'png', quality: 0.8 });

    onCapture({ ...photo, uri: finalUri, isViewOnce });
    navigation.goBack();
  };

  const mainButtonAction = isChatMode ? handleSendToChat : handleUploadStory;

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} style={{ flex: 1 }}>
        <GestureDetector gesture={combinedGestures}>
          <Animated.Image source={{ uri: photo.uri }} style={[styles.previewImage, animatedImageStyle]} resizeMode="contain" />
        </GestureDetector>
      </ViewShot>

      <TouchableOpacity style={styles.closeButton} onPress={handleRetakePhoto}>
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadMedia}>
        {downloadStatus === 'loading' ? <ActivityIndicator size="small" color="white" /> :
        downloadStatus === 'success' ? <Ionicons name="checkmark" size={30} color="white" /> :
        <Ionicons name="download" size={30} color="white" />}
      </TouchableOpacity>

      {mainButtonAction && (
        <TouchableOpacity style={styles.uploadButton} onPress={mainButtonAction} disabled={isUploading}>
          {isUploading ? <ActivityIndicator size="small" color="black" /> :
          <><Text style={styles.uploadButtonText}>{mainButtonLabel}</Text><Ionicons name="arrow-forward" size={24} color="black" /></>}
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
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignSelf: 'center',
    position: 'absolute', },
  previewImage: { 
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignSelf: 'center',},
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

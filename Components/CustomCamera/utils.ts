// utils.ts
import { captureRef } from 'react-native-view-shot';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadStory } from '../Stories/storySlider/storySliderUtils';
import i18n from 'i18next';

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


interface DownloadParams {
  photo: { uri: string; type: 'image' | 'video' };
  hasMediaLibraryPermission: boolean;
  viewShotRef: any;
}

export const handleDownloadMediaUtil = async ({
  photo,
  hasMediaLibraryPermission,
  viewShotRef,
}: DownloadParams): Promise<'default' | 'loading' | 'success'> => {
  if (!hasMediaLibraryPermission) return 'default';

  try {
    if (photo.type === 'image') {
      const uriFinal = await captureRef(viewShotRef, { format: 'png', quality: 0.9 });
      const asset = await MediaLibrary.createAssetAsync(uriFinal);

      const albumName = 'Historias Guardadas';
      let album = await MediaLibrary.getAlbumAsync(albumName);

      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } else {
      // Para videos, usamos la URI original
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      const albumName = 'Historias Guardadas';
      let album = await MediaLibrary.getAlbumAsync(albumName);

      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    }

    return 'success';
  } catch (error) {
    console.error('Error al descargar el archivo:', error);
    return 'default';
  }
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






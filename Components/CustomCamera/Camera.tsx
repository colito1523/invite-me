// camera.tsx
import PhotoPreviewSection from './PhotoPreviewSection';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, PanResponder } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { debounce } from 'lodash';

export default function Camera({ header = null, onCapture }) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation();

  const handleOpenGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission is required to access the gallery');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setPhoto({
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        });
      }
    } catch (error) {
      console.error('Error al abrir la galería:', error);
      alert('There was an error opening the gallery. Please try again.');
    }
  };

  const handleOpenGalleryDebounced = debounce(handleOpenGallery, 300);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < -50 && Math.abs(gestureState.dx) < 50) {
          handleOpenGalleryDebounced();
        }
      },
    })
  ).current;

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function toggleFlash() {
    setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = {
        quality: 1,
        base64: true,
        exif: true,
        mirror: facing === 'front',
        flashMode: flashMode,
      };
      const takenPhoto = await cameraRef.current.takePictureAsync(options);
      console.log("Captured Photo EXIF Data:", takenPhoto.exif);
      if (onCapture) {
        // Si se proporciona onCapture, la foto se usa para el chat.
        onCapture(takenPhoto);
        navigation.goBack();
      } else {
        // Sino, se usa la lógica de historias (preview de foto)
        setPhoto(takenPhoto);
      }
    }
  };

  const handleRetakePhoto = () => setPhoto(null);

  if (photo) return <PhotoPreviewSection photo={photo} handleRetakePhoto={handleRetakePhoto} />;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>
      {header}
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} flash={flashMode}>
        <View style={styles.buttonContainer}>
          {/* Botón para abrir la galería (lado izquierdo) */}
          <TouchableOpacity style={styles.galleryButton} onPress={handleOpenGallery}>
            <Ionicons name="images-outline" size={30} color="white" />
          </TouchableOpacity>

          {/* Botón de captura en el centro */}
          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <View style={styles.innerCircle} />
          </TouchableOpacity>

          {/* Botón para cambiar cámara (lado derecho) */}
          <TouchableOpacity style={styles.toggleButton} onPress={toggleCameraFacing}>
            <AntDesign name="retweet" size={30} color="white" />
          </TouchableOpacity>
        </View>

        {/* Botón para activar/desactivar flash */}
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <Ionicons
            name={flashMode === 'off' ? 'flash-off' : 'flash'}
            size={30}
            color="white"
          />
        </TouchableOpacity>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  flashButton: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  galleryButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});

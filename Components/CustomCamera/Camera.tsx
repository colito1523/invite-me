import PhotoPreviewSection from './PhotoPreviewSection';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, PanResponder } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { debounce } from 'lodash';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [zoom, setZoom] = useState(0);

  const cameraRef = useRef<CameraView | null>(null);

  const navigation = useNavigation();
  const route = useRoute();

  const { header = null, onCapture } = route.params || {};

  const handleOpenGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission is required to access the gallery');
        return;
      }
  
      // Verificar si el modo es "chat", permitiendo imágenes y videos. De lo contrario, solo imágenes.
      const mediaTypes = route.params?.mode === "chat" 
        ? ImagePicker.MediaTypeOptions.All  // Permite imágenes y videos
        : ImagePicker.MediaTypeOptions.Images; // Solo imágenes
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes,
        quality: 1,
        base64: true,
      });
  
      if (!result.canceled && result.assets?.[0]) {
        const selectedAsset = result.assets[0];
  
        if (selectedAsset.type === "video" && route.params?.mode !== "chat") {
          alert("Solo se pueden seleccionar imágenes en este modo.");
          return;
        }
  
        setPhoto({
          uri: selectedAsset.uri,
          base64: selectedAsset.base64,
          type: selectedAsset.type,
        });
      }
    } catch (error) {
      console.error("Error al abrir la galería:", error);
      alert("Hubo un error al abrir la galería. Por favor, intenta nuevamente.");
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

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(curr => (curr === 'back' ? 'front' : 'back'));
  };
  const toggleFlash = () => {
    setFlashMode(curr => (curr === 'off' ? 'on' : 'off'));
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    const options = {
      quality: 1,
      base64: true,
      exif: true,
      mirror: facing === 'front',
      flashMode: flashMode,
    };
    const takenPhoto = await cameraRef.current.takePictureAsync(options);
    console.log("Captured Photo EXIF Data:", takenPhoto.exif);
    setPhoto(takenPhoto);
  };

  const handleRetakePhoto = () => setPhoto(null);

  const handlePinchGesture = (event) => {
    const scale = event.nativeEvent.scale;
    // Ajusta la sensibilidad del zoom
    const sensitivity = 0.01;
    // Reduce el rango máximo del zoom
    const maxZoom = 0.3;
    let newZoom = Math.min(Math.max(zoom + (scale - 1) * sensitivity, 0), maxZoom);
    setZoom(newZoom);
  };
  
  

  if (photo) {
    return (
      <PhotoPreviewSection
        photo={photo}
        handleRetakePhoto={handleRetakePhoto}
        onCapture={onCapture}
      />
    );
  }

  return (
    <PinchGestureHandler onGestureEvent={handlePinchGesture}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="close" size={30} color="white" />
          </TouchableOpacity>
        </View>

        {header}

        <CameraView style={styles.camera} facing={facing} ref={cameraRef} flash={flashMode} zoom={zoom}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.galleryButton} onPress={handleOpenGallery}>
              <Ionicons name="images-outline" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
              <View style={styles.innerCircle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleButton} onPress={toggleCameraFacing}>
              <AntDesign name="retweet" size={30} color="white" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Ionicons
              name={flashMode === 'off' ? 'flash-off' : 'flash'}
              size={30}
              color="white"
            />
          </TouchableOpacity>
        </CameraView>
      </View>
    </PinchGestureHandler>
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

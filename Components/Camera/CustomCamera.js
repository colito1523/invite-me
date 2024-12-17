import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Camera from 'expo-camera';

export default function CustomCamera({ onCapture }) {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);

  // Pedir permisos al cargar
  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1, // Calidad máxima
        skipProcessing: true, // Evita el procesamiento adicional del sistema
      });
      onCapture(photo.uri); // Devuelve la URI directamente
    }
  };

  if (hasPermission === null) {
    return <Text>Solicitando acceso a la cámara...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No se otorgaron permisos para la cámara</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef} />
      <View style={styles.controls}>
        <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
          <Text style={styles.buttonText}>Tomar Foto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 50,
  },
  buttonText: { fontSize: 16, color: '#000' },
});

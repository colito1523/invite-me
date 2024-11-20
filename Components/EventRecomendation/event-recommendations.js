import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';

export default function EventRecommendationForm() {
  const [title, setTitle] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState(null);
  const [isNightMode, setIsNightMode] = useState(false);

  // Verificar la hora para cambiar el tema
  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Verificar cada minuto
    return () => clearInterval(interval);
  }, []);

  const theme = isNightMode ? darkTheme : lightTheme;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !placeName || !address || !image) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    try {
      // Subir imagen a Firebase Storage
      const response = await fetch(image);
      const blob = await response.blob();
      const storageRef = ref(storage, `recommendations/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);

      // Obtener la URL de descarga de la imagen
      const imageUrl = await getDownloadURL(storageRef);

      // Guardar los datos en Firestore
      await addDoc(collection(database, 'eventRecommendations'), {
        title,
        placeName,
        address,
        imageUrl,
        createdAt: new Date(),
      });

      Alert.alert('Éxito', 'Recomendación enviada correctamente.');
      setTitle('');
      setPlaceName('');
      setAddress('');
      setImage(null);
    } catch (error) {
      console.error('Error al enviar la recomendación:', error);
      Alert.alert('Error', 'No se pudo enviar la recomendación.');
    }
  };

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.container}
    >
      <Text style={[styles.title, { color: theme.text }]}>Sugerir un Espacio</Text>

      <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { backgroundColor: theme.inputBackground }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.selectedImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={{ color: theme.placeholder }}>Seleccionar Imagen</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor={theme.placeholder}
      />
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
        placeholder="Nombre del Lugar"
        value={placeName}
        onChangeText={setPlaceName}
        placeholderTextColor={theme.placeholder}
      />
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
        placeholder="Dirección"
        value={address}
        onChangeText={setAddress}
        placeholderTextColor={theme.placeholder}
      />

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.buttonBackground }]}
        onPress={handleSubmit}
      >
        <Text style={{ color: theme.text }}>Enviar Recomendación</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePicker: {
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 50,
    borderRadius: 30,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  submitButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
});

const lightTheme = {
  gradient: ['#fff', '#f0f0f0'],
  text: '#000',
  inputBackground: '#fff',
  placeholder: '#999',
  buttonBackground: '#4CAF50',
};

const darkTheme = {
  gradient: ['#1a1a1a', '#000'],
  text: '#fff',
  inputBackground: '#333',
  placeholder: '#666',
  buttonBackground: '#444',
};

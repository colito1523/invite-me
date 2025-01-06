import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons"; // Asegúrate de importar Ionicons
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export default function EventRecommendationForm() {
  const [title, setTitle] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  const { t } = useTranslation();

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
      Alert.alert(t('eventRecommendation.error'), t('eventRecommendation.completeAllFields'));
      return;
    }

    setIsLoading(true);

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

      Alert.alert(t('eventRecommendation.success'), t('eventRecommendation.recommendationSent'));
      setTitle('');
      setPlaceName('');
      setAddress('');
      setImage(null);

      // Redirigir al usuario al home
      navigation.navigate('Home');
    } catch (error) {
      console.error(t('eventRecommendation.submissionError'), error);
      Alert.alert(t('eventRecommendation.error'), t('eventRecommendation.submissionError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
       
        {/* Header */}
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 90,
            left: 20,
            zIndex: 1,
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={theme.gradient} style={styles.container}>
          <Text style={[styles.title, { color: theme.text }]}>
           
          </Text>

          <TouchableOpacity
            onPress={pickImage}
            style={[
              styles.imagePicker,
              { backgroundColor: theme.inputBackground },
            ]}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.selectedImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={{ color: theme.placeholder }}>
                  {t('eventRecommendation.selectImage')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.inputBackground, color: theme.text },
            ]}
            placeholder={t('eventRecommendation.titlePlaceholder')}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={theme.placeholder}
          />
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.inputBackground, color: theme.text },
            ]}
            placeholder={t('eventRecommendation.placeNamePlaceholder')}
            value={placeName}
            onChangeText={setPlaceName}
            placeholderTextColor={theme.placeholder}
          />
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.inputBackground, color: theme.text },
            ]}
            placeholder={t('eventRecommendation.addressPlaceholder')}
            value={address}
            onChangeText={setAddress}
            placeholderTextColor={theme.placeholder}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: '#fff' },
            ]}
            onPress={isLoading ? null : handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={isNightMode ? theme.text : '#000'} />
            ) : (
              <Text
                style={{
                  color: '#000',
                  fontWeight: 'bold',
                }}
              >
                {t('eventRecommendation.submitButton')}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 30,
    marginTop: 65,
    textAlign: 'center',
  },
  imagePicker: {
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
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
    marginBottom: 30,
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
  buttonBackground: '#444',
};

const darkTheme = {
  gradient: ['#1a1a1a', '#000'],
  text: '#fff',
  inputBackground: '#333',
  placeholder: '#666',
  buttonBackground: '#444',
};

import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, database } from '../../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import validator from 'validator'; // Importar la biblioteca validator
import { LanguageContext } from "../../src/contexts/LanguageContext"; // Ensure correct import of LanguageContext

import es from '../../locales/es.json';
import en from '../../locales/en.json';
import pt from '../../locales/pt.json';
import { styles, lightTheme, darkTheme } from './styles';

const storeSessionToken = async (token) => {
  try {
    await SecureStore.setItemAsync('session_token', token);
  } catch (error) {
    console.error('Error al almacenar el token:', error);
  }
};
// Función para recuperar el token de sesión
const getSessionToken = async () => {
  try {
    const token = await SecureStore.getItemAsync('session_token');
    return token;
  } catch (error) {
    console.error('Error al recuperar el token:', error);
    return null;
  }
};


const LANGUAGE_KEY = 'app_language'; 

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
    },
    lng: 'es',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

const { width, height } = Dimensions.get('window');

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLanguageOptionsVisible, setIsLanguageOptionsVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const { selectedLanguage, changeLanguage } = useContext(LanguageContext); // Use LanguageContext

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await getSessionToken(); // Recupera el token del almacenamiento seguro
        if (token) {
          navigation.navigate('Home'); // Redirige al usuario si el token es válido
        }
      } catch (error) {
        console.error('Error al verificar el token de sesión:', error);
      }
    };

    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkSession(); // Verifica el token al montar el componente
    checkTime();

    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval); // Limpia el intervalo cuando se desmonta
  }, []);

  useEffect(() => {
    i18n.changeLanguage(selectedLanguage);
  }, [selectedLanguage]);

  const onHandleLogin = async () => {
    if (email.trim() === '' || password === '') {
      Alert.alert(t('errorTitle'), t('enterBothFields'));
      return;
    }

    const emailToLower = email.trim().toLowerCase();

    // Sanitización y validación con validator.js
    const emailSanitized = email.trim();
    const passwordSanitized = validator.escape(password); // Escapa caracteres peligrosos

    // Validación con RegEx y validator.js
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // RegEx para validar email
    if (!emailRegex.test(emailSanitized) || !validator.isEmail(emailSanitized)) {
      Alert.alert(t('errorTitle'), t('invalidCredentials')); // Mensaje genérico
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailSanitized, passwordSanitized);

      // Obtén el token de sesión desde Firebase
      const token = await userCredential.user.getIdToken();

      // Almacena el token de sesión de manera segura
      await storeSessionToken(token);

      // Guarda el idioma seleccionado en el perfil del usuario
      const userRef = doc(database, "users", userCredential.user.uid);
      await updateDoc(userRef, {
        preferredLanguage: i18n.language
      });

      // Elimina la contraseña de la memoria después de autenticación exitosa
      setPassword(null);

      setIsLoading(false);
      // La navegación será manejada automáticamente por el RootNavigator
    } catch (error) {
      setIsLoading(false);
      setPassword(null);

      Alert.alert(t('errorTitle'), t('invalidCredentials')); // Mensaje genérico
    }
  };

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsLanguageOptionsVisible(false);
  };

  const handleOutsideClick = () => {
    if (isLanguageOptionsVisible) {
      setIsLanguageOptionsVisible(false);
    }
  };

  const theme = isNightMode ? darkTheme : lightTheme;

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' }
  ];

  return (
    <TouchableWithoutFeedback onPress={handleOutsideClick}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#fff' }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollView}>
            <LinearGradient
              colors={['#fff', '#fff']}
              style={styles.container}
            >
              <View style={styles.languageContainer}>
                <TouchableOpacity
                  style={styles.languageSelector}
                  onPress={() => setIsLanguageOptionsVisible(!isLanguageOptionsVisible)}
                >
                  <Ionicons name="globe-outline" size={22} color="#000" />
                  <Text style={styles.selectedLanguage}>
                    {languages.find(lang => lang.code === selectedLanguage)?.name}
                  </Text>
                  <Ionicons name="chevron-down" size={24} color="#000" />
                </TouchableOpacity>
                {isLanguageOptionsVisible && (
                  <View style={styles.languageOptions}>
                    {languages.map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        style={styles.languageOption}
                        onPress={() => handleLanguageChange(lang.code)}
                      >
                        <Text style={[
                          styles.languageOptionText,
                          selectedLanguage === lang.code && styles.selectedLanguageText
                        ]}>
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/Logo_Invite_Me.png')}
                  style={styles.logo}
                  contentFit="cover"
                  cachePolicy="memory-disk" 
                />
              </View>

              <Text style={[styles.title, { color: "black" }]}>
                {t('accessPrivately')}
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('email')}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('password')}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={true}
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: theme.buttonBackground }]}
                onPress={onHandleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size={20} color="#333" />
                ) : (
                  <Text style={styles.loginButtonText}>{t('logIn')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={[styles.forgotPasswordText, { color: theme.link }]}>
                  {t('forgotPassword')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={() => navigation.navigate('Signup')}
              >
                <View style={styles.createAccountTextContainer}>
                  <Text style={[styles.createAccountTextSmall, { color: theme.link }]}>
                    {t('createNewAccount')}
                  </Text>
                  <Text style={[styles.createAccountTextLarge, { color: theme.link }]}>
                    {' Sign Up'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
              style={styles.previewIcon}
              onPress={() => navigation.navigate('PreviewHome')}
            >
             <Text>
                    {t('previewHome')}
                  </Text>
            </TouchableOpacity>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
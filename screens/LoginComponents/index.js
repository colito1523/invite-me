import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from '../../locales/es.json';
import en from '../../locales/en.json';
import pt from '../../locales/pt.json';
import { styles, lightTheme, darkTheme } from './styles';

const LANGUAGE_KEY = '@app_language';

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

export default function ElegantLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLanguageOptionsVisible, setIsLanguageOptionsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);

    loadSavedLanguage();

    return () => clearInterval(interval);
  }, []);
  

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage);
        setSelectedLanguage(savedLanguage);  // Actualiza el selector de idioma
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    }
  };

  const changeLanguage = async (lang) => {
    await i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
    setIsLanguageOptionsVisible(false);
  };

  const onHandleLogin = () => {
    if (email.trim() === '' || password === '') {
      Alert.alert(t('errorTitle'), t('enterBothFields'));
      return;
    }
  
    const emailToLower = email.trim().toLowerCase();
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToLower)) {
      Alert.alert(t('errorTitle'), t('enterValidEmail'));
      return;
    }
  
    setIsLoading(true);
  
    signInWithEmailAndPassword(auth, emailToLower, password)
      .then(() => {
        setIsLoading(false);
        navigation.navigate('Home');
      })
      .catch((err) => {
        setIsLoading(false);
        Alert.alert(
          t('loginError'),
          err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
            ? t('incorrectCredentials')
            : t('genericError')
        );
      });
  };

  const theme = isNightMode ? darkTheme : lightTheme;

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' }
  ];

  return (
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
                <Ionicons name="globe-outline" size={24} color="#000" />
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
                      onPress={() => changeLanguage(lang.code)}
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
            
            <Text style={[styles.title, { color: theme.text }]}>
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
                <ActivityIndicator size={50} color="#333" />
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
                  {' Sign In'}
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
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
import { auth } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from '../locales/es.json';
import en from '../locales/en.json';
import pt from '../locales/pt.json';

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
                source={require('../assets/Logo_Invite_Me.png')}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 30,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loginButton: {
    width: '50%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loginButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginBottom: 15,
  },
  forgotPasswordText: {
    fontSize: 12,
  },
  createAccountButton: {
    marginTop: 10,
  },
  createAccountTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createAccountTextSmall: {
    fontSize: 12,
    fontWeight: '400',
  },
  createAccountTextLarge: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  selectedLanguage: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  languageOptions: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 150,
  },
  languageOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#000',
  },
});

const lightTheme = {
  background: '#fff',
  text: '#333',
  inputBackground: '#f5f5f5',
  placeholder: '#999',
  icon: 'black',
  buttonBackground: '#f5f5f5',
  link: 'black',
};

const darkTheme = {
  background: '#000',
  text: '#fff',
  inputBackground: '#1a1a1a',
  placeholder: '#666',
  icon: 'black',
  buttonBackground: '#f5f5f5',
  link: 'black',
};
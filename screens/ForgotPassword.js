import React, { useState, useEffect, useContext } from 'react';
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
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { database } from '../config/firebase';

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

import { LanguageContext } from "../src/contexts/LanguageContext"; // Ensure correct import of LanguageContext

export default function ElegantForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLanguageOptionsVisible, setIsLanguageOptionsVisible] = useState(false);
  const { t } = useTranslation();
  const { selectedLanguage, changeLanguage } = useContext(LanguageContext); // Use LanguageContext

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    i18n.changeLanguage(selectedLanguage);
  }, [selectedLanguage]);

  const onResetPassword = () => {
    if (email.trim() === '') {
      Alert.alert(t('errorTitle'), t('enterEmail'));
      return;
    }

    const emailToLower = email.trim().toLowerCase();

    const emailRegex = /^(?!.*(.)\1{3,})(?!^\d+@)(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@(?:(?!^\d+\.)[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailToLower)) {
      Alert.alert(t('errorTitle'), t('enterValidEmail'));
      return;
    }

    setIsLoading(true);

    sendPasswordResetEmail(auth, emailToLower)
      .then(() => {
        setIsLoading(false);
        Alert.alert(
          t('resetPasswordEmailSent'),
          t('checkEmailForInstructions')
        );
        navigation.navigate('Login');
      })
      .catch((error) => {
        setIsLoading(false);
        Alert.alert(t('resetPasswordError'), t('genericError'));
      });
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
              
              <Text style={[styles.title, { color: theme.text }]}>
                {t('forgotPassword')}
              </Text>
              
              <Text style={[styles.subtitle, { color: theme.text }]}>
                {t('enterEmailToReset')}
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
              </View>

              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: theme.buttonBackground }]}
                onPress={onResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size={50} color="#333" />
                ) : (
                  <Text style={styles.resetButtonText}>{t('resetPassword')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={[styles.backButtonText, { color: theme.link }]}>
                  {t('backToLogin')}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: "rgba(239, 232, 228, 0.7)",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  resetButton: {
    width: '50%',
    height: 50,
    backgroundColor: "rgba(239, 232, 228, 0.7)",
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
  resetButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 10,
  },
  backButtonText: {
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
    backgroundColor: 'transparent',
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
  inputBackground: "rgba(239, 232, 228, 0.7)",
  placeholder: '#999',
  buttonBackground: "rgba(239, 232, 228, 0.7)",
  link: 'black',
};

const darkTheme = {
  background: '#000',
  text: '#fff',
  inputBackground: "rgba(239, 232, 228, 0.7)",
  placeholder: '#666',
  buttonBackground: "rgba(239, 232, 228, 0.7)",
  link: 'black',
};
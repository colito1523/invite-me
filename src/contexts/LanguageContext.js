import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { auth, database } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const LANGUAGE_KEY = '@app_language';
export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          i18n.changeLanguage(savedLanguage);
          setSelectedLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };
    loadSavedLanguage();
  }, []);

  const changeLanguage = async (lang) => {
    await i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      if (auth.currentUser) {
        const userRef = doc(database, "users", auth.currentUser.uid);
        await updateDoc(userRef, { preferredLanguage: lang });
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ selectedLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
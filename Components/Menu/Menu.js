import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, FlatList, Linking, Alert } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import i18n from 'i18next';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, database } from '../../config/firebase'; // Ajusta el path según tu configuración


export default function Menu({
  isVisible,
  onClose,
  onCategorySelect,
  onSignOut,
  searchQuery,
  setSearchQuery,
  onCitySelect,
  country
}) {
  const [isNightMode, setIsNightMode] = useState(false);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selectedCity, setSelectedCity] = useState(country === 'Portugal' ? 'Lisboa' : 'Madrid');
  const [filteredCities, setFilteredCities] = useState([]);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  useEffect(() => {
    const updateNightMode = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    updateNightMode();
    const interval = setInterval(updateNightMode, 60000);

    return () => clearInterval(interval);
  }, []);

  const currentStyles = useMemo(() => isNightMode ? nightStyles : dayStyles, [isNightMode]);

  const categories = [
    t('categories.all'),
    t('Restaurants & Rooftops'),
    t('Bars & Clubs'),
    t('categories.events'),
    t('categories.createOwnEvent'),
    t('categories.suggestSpace'),
    t('categories.support'),
    t('categories.changeLanguage'), // Nueva categoría para cambiar el idioma
  ];

  const cities = ['Lisboa', 'Madrid'];

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (text.length > 0) {
      const matches = cities.filter(city => city.toLowerCase().startsWith(text.toLowerCase()));
      setFilteredCities(matches);
    } else {
      setFilteredCities([]);
    }
  }, [cities]);

  const handleCitySelect = useCallback((city) => {
    setSelectedCity(city);
    onCitySelect(city);
    setSearchQuery(city);
    setFilteredCities([]);
  }, [onCitySelect]);

  const handleCategorySelect = useCallback((category) => {
    if (category === t('categories.createOwnEvent')) {
      onClose();
      navigation.navigate('CreateEvent');
    } else if (category === t('categories.suggestSpace')) {
      onClose();
      navigation.navigate('EventRecommendations');
    } else if (category === t('categories.support')) {
      onClose();
      handleSupportPress();
    } else if (category === t('categories.changeLanguage')) {
      setShowLanguageSelector(true);
    } else {
      onCategorySelect(category);
    }
  }, [onClose, navigation, onCategorySelect]);

  const handleSupportPress = useCallback(async () => {
    const email = "info@invitemembers.com";
    const subject = "User support";
    const body = "Hi, I need help with...";
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
    const supported = await Linking.canOpenURL(emailUrl);
    if (supported) {
      await Linking.openURL(emailUrl);
    } else {
      Alert.alert("Error", "No se pudo abrir el cliente de correo.");
    }
  }, []);

  const handleLanguageChange = async (language) => {
    i18n.changeLanguage(language);
    setShowLanguageSelector(false);
    try {
      const user = auth.currentUser; // Obtén el usuario autenticado
      if (user) {
        const userRef = doc(database, "users", user.uid);
        await updateDoc(userRef, { preferredLanguage: language });
        console.log("Idioma preferido actualizado en Firebase:", language);
      }
    } catch (error) {
      console.error("Error al actualizar el idioma en Firebase:", error);
    }
  };
  

  const LanguageSelector = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showLanguageSelector}
      onRequestClose={() => setShowLanguageSelector(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowLanguageSelector(false)}>
        <View style={currentStyles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={currentStyles.modalContent}>
              {['en', 'es', 'pt'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={currentStyles.menuItemContainer}
                  onPress={() => handleLanguageChange(lang)}
                >
                  <Text style={currentStyles.menuItemText}>
                    {lang === 'en' ? 'English' : lang === 'es' ? 'Español' : 'Português'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={currentStyles.modalOverlay}>
          <View style={currentStyles.modalContent}>
            <View style={currentStyles.searchInputContainer}>
              <Ionicons name="search" size={23} color={isNightMode ? "white" : "black"} style={currentStyles.searchIcon} />
              <TextInput
                style={currentStyles.searchInput}
                placeholder={t('searchPlaceholder')}
                placeholderTextColor={isNightMode ? "#888" : "#666"}
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
            </View>

            {filteredCities.length > 0 && (
              <FlatList
                data={filteredCities}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={currentStyles.autocompleteItem}
                    onPress={() => handleCitySelect(item)}
                  >
                    <Text style={currentStyles.menuItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                style={currentStyles.autocompleteList}
              />
            )}

            <View style={currentStyles.separator} />
            {categories.map((category, index) => (
              <TouchableOpacity
                key={category}
                style={currentStyles.menuItemContainer}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={currentStyles.menuItemText}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={currentStyles.separator} />
            <TouchableOpacity onPress={onSignOut}>
              <Text style={currentStyles.menuItem}>{t('signOut')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
      <LanguageSelector />
    </Modal>
  );
}

const commonInputStyles = {
  flex: 1,
  padding: 10,
  fontSize: 16,
  height: 40,
  textAlignVertical: 'center',
};

const dayStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    width: '95%',
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  menuItemContainer: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 5,
    backgroundColor: "white",
  },
  menuItemText: {
    fontSize: 15,
    color: "black",
    textAlign: "center",
    paddingVertical: 7,
  },
  menuItem: {
    fontSize: 15,
    color: "black",
    fontFamily: "Lato-Black",
    textAlign: "center",
    paddingVertical: 7,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 10,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    ...commonInputStyles,
    color: 'black',
  },
  autocompleteList: {
    maxHeight: 100,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: '#fff',
  },
  autocompleteItem: {
    padding: 10,
    fontSize: 16,
    color: 'black',
  },
});

const nightStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 15,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    width: '95%',
    backgroundColor: '#444',
    marginVertical: 10,
  },
  menuItemContainer: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 5,
    backgroundColor: "#222",
  },
  menuItemText: {
    fontSize: 15,
    color: "white",
    textAlign: "center",
    paddingVertical: 7,
  },
  menuItem: {
    fontSize: 15,
    color: "white",
    fontFamily: "Lato-Black",
    textAlign: "center",
    paddingVertical: 7,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#333',
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 10,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    ...commonInputStyles,
    color: 'white',
  },
  autocompleteList: {
    maxHeight: 100,
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: '#333',
  },
  autocompleteItem: {
    padding: 10,
    fontSize: 16,
    color: 'white',
  },
});


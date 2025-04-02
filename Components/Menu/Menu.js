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

  const cities = ['Lisboa', 'Madrid', 'Londres'];

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
    let mappedCategory = category;

    // Mapeo de "categories.events" a "Festivities"
    if (category === t('categories.events')) {
        mappedCategory = "Festivities";
    }

    if (mappedCategory === t('categories.createOwnEvent')) {
        onClose();
        navigation.navigate('CreateEvent');
    } else if (mappedCategory === t('categories.suggestSpace')) {
        onClose();
        navigation.navigate('EventRecommendations');
    } else if (mappedCategory === t('categories.support')) {
        onClose();
        handleSupportPress();
    } else if (mappedCategory === t('categories.changeLanguage')) {
        setShowLanguageSelector(true);
    } else {
        onCategorySelect(mappedCategory);
    }
}, [onClose, navigation, onCategorySelect, t]);


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
    // Cambia el idioma en i18n
    i18n.changeLanguage(language);
    // Cierra solo el selector de idiomas
    setShowLanguageSelector(false);
  
    try {
      const user = auth.currentUser; // Obtén el usuario autenticado
      if (user) {
        const userRef = doc(database, "users", user.uid);
        await updateDoc(userRef, { preferredLanguage: language });
      }
    } catch (error) {
      console.error("Error al actualizar el idioma en Firebase:", error);
    }
  
    // Dependiendo del idioma, definir la categoría a mostrar en Home
    const selectedCategory = language === "en" ? "All" : "Todos";
    
    // Navega a Home con el parámetro adecuado sin cerrar el menú
    navigation.navigate('Home', { selectedCategory });
  };

  useEffect(() => {
    if (searchQuery.length > 0) {
      const matches = cities.filter(city =>
        city.toLowerCase().startsWith(searchQuery.toLowerCase())
      );
      setFilteredCities(matches);
    } else {
      setFilteredCities([]);
    }
  }, [isVisible, searchQuery]);
  
  
  
  

  const LanguageSelector = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showLanguageSelector}
      onRequestClose={() => setShowLanguageSelector(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowLanguageSelector(false)}>
        <View style={currentStyles.modalOverlay2}>
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
            <View style={currentStyles.searchContainer}>
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
                <View style={currentStyles.autocompleteContainer}>
                  <FlatList
                    data={filteredCities}
                    keyExtractor={(item) => item}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        style={[
                          currentStyles.autocompleteItem,
                          index === filteredCities.length - 1 && currentStyles.lastAutocompleteItem
                        ]}
                        onPress={() => handleCitySelect(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name="location-outline" 
                          size={18} 
                          color={isNightMode ? "#ebddd5" : "#666"} 
                          style={currentStyles.cityIcon} 
                        />
                        <Text style={currentStyles.cityText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={currentStyles.cityDivider} />}
                    style={currentStyles.autocompleteList}
                    bounces={false}
                  />
                </View>
              )}
            </View>

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
  modalOverlay2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
    fontSize: 17,
    color: "black",
    textAlign: "center",
    paddingVertical: 7,
  },
  menuItem: {
    fontSize: 17,
    color: "black",
    textAlign: "center",
    paddingVertical: 7,
  },
  searchContainer: {
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
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
  autocompleteContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  autocompleteList: {
    maxHeight: 150,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  autocompleteItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastAutocompleteItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cityIcon: {
    marginRight: 10,
  },
  cityText: {
    fontSize: 16,
    color: '#333',
  },
  cityDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
});

const nightStyles = StyleSheet.create({
  modalOverlay2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: "black",
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
    backgroundColor: "black",
  },
  menuItemText: {
    fontSize: 17,
    color: "white",
    textAlign: "center",
    paddingVertical: 7,
  },
  menuItem: {
    fontSize: 17,
    color: "white",
    textAlign: "center",
    paddingVertical: 7,
  },
  searchContainer: {
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    backgroundColor: "black",
    borderColor: "white",
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
  autocompleteContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  autocompleteList: {
    maxHeight: 150,
    width: '100%',
    backgroundColor: 'black',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#444',
  },
  autocompleteItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastAutocompleteItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cityIcon: {
    marginRight: 10,
  },
  cityText: {
    fontSize: 16,
    color: '#eee',
  },
  cityDivider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
});
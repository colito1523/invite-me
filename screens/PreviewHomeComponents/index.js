import React, {
    useState,
    useCallback,
    useMemo,
    useContext
  } from "react";
  import {
    View,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Alert,
    TouchableWithoutFeedback,
  } from "react-native";
  import { Ionicons } from "@expo/vector-icons";
  import Box from "../../Components/Boxs/Box";
  import { useNavigation } from "@react-navigation/native";
  import dayjs from "dayjs";
  import { dayStyles, nightStyles, styles } from "./styles";
  import Menu from "../../Components/Menu/Menu";
  import boxInfo from "../../src/data/boxInfo"; // Import boxInfo data
  import { useTranslation } from 'react-i18next';
import { LanguageContext } from "../../src/contexts/LanguageContext";


  const exampleBoxData = [
    // Ordenamos primero los eventos con prioridad
    ...boxInfo
      .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
      .map((event, index) => ({
        id: (index + 3).toString(),
        imageUrl: event.path,
        title: event.title,
        category: "EventoGeneral",
        hours: event.hours,
        number: event.number,
        coordinates: event.coordinates,
        country: event.country,
        city: event.city,
        date: dayjs().format("D MMM"),
        attendeesCount: 2,
        isPrivateEvent: false,
        priority: event.priority || false,
      })),
  ];
  

  const Header = ({ isNightMode, toggleMenu }) => {
    const currentStyles = isNightMode ? nightStyles : dayStyles;
  
    return (
      <View style={currentStyles.headerContainer}>
        <TouchableOpacity style={{ marginLeft: 20, marginTop:20 }} onPress={toggleMenu}>
          <Ionicons
            name="menu"
            size={24}
            color={isNightMode ? "white" : "black"}
          />
        </TouchableOpacity>
      </View>
    );
  };
  
  const PreviewHome = () => {
    const [isNightMode, setIsNightMode] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs().format("D MMM"));
    const [searchQuery, setSearchQuery] = useState("");
    const navigation = useNavigation();
    const { t } = useTranslation();
const { selectedLanguage } = useContext(LanguageContext);

  
    const currentStyles = useMemo(
      () => (isNightMode ? nightStyles : dayStyles),
      [isNightMode],
    );
  
    const showLoginAlert = useCallback(() => {
        Alert.alert(
          t('accessRequiredTitle'), // Título traducido
          t('accessRequiredMessage'), // Mensaje traducido
          [
            { text: t('cancel'), style: "cancel" },
            { text: t('login'), onPress: () => navigation.navigate("Login") },
          ]
        );
      }, [navigation, t]);
      
  
    const toggleMenu = useCallback(() => {
        showLoginAlert();
      }, [showLoginAlert]);
      
  
    const handleCategorySelect = useCallback((category) => {
      setSelectedCategory(category);
      setMenuVisible(false);
    }, []);
  
    const handleCitySelect = useCallback((city) => {
      setSelectedCity(city);
      setMenuVisible(false);
    }, []);
  
    const handleDateChange = useCallback((date) => {
      setSelectedDate(date);
    }, []);
  
    const onRefresh = useCallback(() => {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 1000);
    }, []);
  
    const handleBoxPress = useCallback((box) => {
      showLoginAlert();
    }, [showLoginAlert]);
  
    const renderItem = useCallback(
      ({ item }) => (
        <View style={styles.boxContainer}>
          <Box
            imageUrl={item.imageUrl}
            title={item.title}
            onPress={() => handleBoxPress(item)}
            selectedDate={selectedDate}
            date={item.date}
            isPrivateEvent={false}
            priority={item.priority}
          />
        </View>
      ),
      [handleBoxPress, selectedDate],
    );
  
    const keyExtractor = useCallback((item) => item.id, []);
  
    const filteredBoxData = useMemo(() => {
      return [
        {
          title: "Eventos Generales",
          data: exampleBoxData,
        },
      ];
    }, []);
  
    return (
      <TouchableWithoutFeedback onPress={showLoginAlert}>
        <View style={currentStyles.container}>
        <Header isNightMode={isNightMode} toggleMenu={toggleMenu} />

          <Menu
            isVisible={menuVisible}
            onClose={toggleMenu}
            onCategorySelect={handleCategorySelect}
            onCitySelect={handleCitySelect}
            isNightMode={isNightMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <FlatList
            data={filteredBoxData.flatMap((group) => group.data)}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.container}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          <View style={currentStyles.tabBar}>
            <TouchableOpacity onPress={showLoginAlert}>
              <Ionicons
                name="home"
                size={24}
                color={isNightMode ? "white" : "black"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={showLoginAlert}>
              <Ionicons
                name="search"
                size={24}
                color={isNightMode ? "white" : "black"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={showLoginAlert}>
              <Ionicons
                name="person-circle"
                size={24}
                color={isNightMode ? "white" : "black"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={showLoginAlert}>
              <Ionicons
                name="notifications"
                size={24}
                color={isNightMode ? "white" : "black"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={showLoginAlert}>
              <Ionicons
                name="mail"
                size={24}
                color={isNightMode ? "white" : "black"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };
  
  export default PreviewHome;
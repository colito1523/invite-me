import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity, // Necesario para el TabBar
  Image
} from "react-native";
import {
  auth,
  storage,
  database,
} from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import Box from "../../Components/Boxs/Box";
import DotIndicator from "../../Components/Dots/DotIndicator";
import { useNavigation, useRoute } from "@react-navigation/native";
import dayjs from "dayjs";
import { useLocationAndTime } from "../../src/hooks/useLocationAndTime";
import boxInfo from "../../src/data/boxInfo";
import Menu from "../../Components/Menu/Menu";
import Header from "./Header"; // Importamos el nuevo componente
import { useTranslation } from 'react-i18next';
import { dayStyles, nightStyles, styles } from "./styles";
import { useUnreadMessages } from '../../src/hooks/UnreadMessagesContext';
import {fetchUnreadNotifications, fetchData, fetchProfileImage, onSignOut, subscribeToUserProfile, fetchBoxData, fetchPrivateEvents, getFilteredBoxData   } from "./utils";

const Home = React.memo(() => {
  const { locationGranted, country, isNightMode } = useLocationAndTime();
  const navigation = useNavigation();
  const route = useRoute();
  const [errorMessage, setErrorMessage] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [boxData, setBoxData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [profileImage, setProfileImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const selectedDateRef = useRef(dayjs().format("D MMM"));
  const [selectedDate, setSelectedDate] = useState(selectedDateRef.current);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [privateEvents, setPrivateEvents] = useState([]);
  const { t } = useTranslation();
  const [unreadMessages, setUnreadMessages] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const currentStyles = useMemo(() => isNightMode ? nightStyles : dayStyles, [isNightMode]);
  const { hasUnreadMessages } = useUnreadMessages();
  const navigateToProfile = useCallback(() => {
    navigation.navigate("Profile");
  }, [navigation]);

 useEffect(() => {
    fetchUnreadNotifications();
  }, [navigation]);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      fetchData({
        setLoading,
        fetchBoxData,
        fetchPrivateEvents,
        database,
        storage,
        boxInfo,
        user,
        setBoxData,
        selectedDate: selectedDateRef.current,
        setPrivateEvents,
      });
    }
  }, [auth.currentUser, database, storage, boxInfo, setBoxData, selectedDateRef, fetchPrivateEvents]);
  

  useEffect(() => {
    if (route.params?.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory]);

  useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    fetchProfileImage({setProfileImage}); // Asegúrate de definir esta función para obtener la imagen
  });
  return unsubscribe;
}, [navigation]);

  useEffect(() => {
    if (country) {
      setSelectedCity(country === 'Portugal' ? 'Lisboa' : 'Madrid');
    }
  }, [country]);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isNightMode ? "black" : "white",
      },
      headerTintColor: isNightMode ? "white" : "black",
      headerTitle: () => (
        <Header
          isNightMode={isNightMode}
          toggleMenu={toggleMenu}
          handleDateChange={handleDateChange}
          setLoading={setLoading}
        />
      ),
    });
  }, [navigation, isNightMode]);

  const handleDateChange = useCallback(async (date) => {
    selectedDateRef.current = date;
    setSelectedDate(date);
    setLoading(true);
  
    const user = auth.currentUser;
    if (user) {
      await fetchBoxData({
        database,
        storage,
        boxInfo,
        user,
        setBoxData,
        selectedDate: selectedDateRef.current,
      });
    }
  
    setLoading(false);
  }, [auth.currentUser, database, storage, boxInfo, setBoxData, selectedDateRef]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true); // Mostrar el indicador de recarga
  
    const user = auth.currentUser;
    if (user) {
      try {
        // Cargar datos del usuario
        await fetchData({
          setLoading,
          fetchBoxData,
          fetchPrivateEvents,
          database,
          storage,
          boxInfo,
          user,
          setBoxData,
          selectedDate: selectedDateRef.current,
          setPrivateEvents,
        });
  
        // Actualizar la imagen de perfil
        await fetchProfileImage({ setProfileImage });
  
        // (Opcional) Si necesitas más tareas programáticas, inclúyelas aquí
      } catch (error) {
        console.error("Error al recargar datos:", error);
      }
    }
  
    setRefreshing(false); // Ocultar el indicador de recarga
  }, [auth.currentUser, database, storage, boxInfo, setBoxData, selectedDateRef]);
  

  const toggleMenu = useCallback(() => {
    setMenuVisible((prev) => !prev);
  }, []);

  const handleCategorySelect = useCallback(
    (category) => {
      setSelectedCategory(category);
      setMenuVisible(false);
      if (category === "Cria o meu propio evento") {
        setTimeout(() => {
          navigation.navigate("CreateEvent");
        }, 300);
      }
    },
    [navigation]
  );

  const handleCitySelect = useCallback((city) => {
    setSelectedCity(city);
    setMenuVisible(false);
  }, []);

  const handleSignOut = useCallback(() => {
    onSignOut(navigation, auth);
  }, [navigation, auth]);

  useEffect(() => {
    const user = auth.currentUser;
  
    if (user) {
      fetchBoxData({
        database,
        storage,
        boxInfo,
        user,
        setBoxData,
        selectedDate: selectedDateRef.current,
      });
    }
  }, [selectedCategory, auth.currentUser, database, storage, boxInfo, selectedDateRef, setBoxData]);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      fetchData({
        setLoading,
        fetchBoxData,
        fetchPrivateEvents,
        database,
        storage,
        boxInfo,
        user,
        setBoxData,
        selectedDate: selectedDateRef.current,
        setPrivateEvents, // Este valor debe pasar correctamente
      });
    }
  }, [auth.currentUser, database, storage, boxInfo, setBoxData, selectedDateRef, fetchPrivateEvents]);
   
  // para modulizar inicio

  const filteredBoxData = useMemo(() => {
    return getFilteredBoxData(boxData, selectedCity, selectedCategory, t);
  }, [boxData, selectedCity, selectedCategory, t]);


  // para modulizar final
  
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      fetchBoxData({
        database,
        storage,
        boxInfo,
        user,
        setBoxData,
        selectedDate: selectedDateRef.current,
      });
    }
  
    fetchPrivateEvents();
  }, [selectedDate, auth.currentUser, database, storage, boxInfo, setBoxData, selectedDateRef, fetchPrivateEvents]);
  

  useEffect(() => {
    const user = auth.currentUser;
  
    // Llama a la función modularizada.
    const unsubscribe = subscribeToUserProfile(database, user, setProfileImage);
  
    // Devuelve la función de limpieza.
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [auth.currentUser]); // Dependencia del usuario autenticado.
  
  // Función para manejar el evento de clic en el box
  const handleBoxPress = useCallback((box) => {
    const boxWithAdmin = {
      ...box,
      Admin: box.Admin || box.uid || undefined  // Usar el Admin existente o el uid del evento
    };
    navigation.navigate("BoxDetails", { box: boxWithAdmin, selectedDate, attendees: box.attendees || [] });
  }, [navigation, selectedDate]);

  const renderItem = useCallback(({ item }) => (
    <View style={styles.boxContainer}>
      <Box
  imageUrl={item.imageUrl}
  title={item.title}
  onPress={() => handleBoxPress(item)}
  selectedDate={selectedDate}
  date={item.date}
  isPrivateEvent={item.category === "EventoParaAmigos"}
/>
      {item.attendees && item.attendees.length > 0 && (
        <DotIndicator
          profileImages={item.attendees.map(
            (attendee) => attendee.profileImage
          )}
          attendeesList={item.attendees}
        />
      )}
    </View>
  ), [handleBoxPress, selectedDate]);

  const keyExtractor = useCallback((item) => item.id || item.title, []);

  const memoizedMenu = useMemo(() => (
    <Menu
      isVisible={menuVisible}
      onClose={toggleMenu}
      onCategorySelect={handleCategorySelect}
      onCitySelect={handleCitySelect}
      onSignOut={handleSignOut} // Aquí pasamos la función
      isNightMode={isNightMode}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    />
  ), [menuVisible, toggleMenu, handleCategorySelect, handleCitySelect, handleSignOut, isNightMode, searchQuery, setSearchQuery]);

  useEffect(() => {
    const unsubscribe = fetchUnreadNotifications({ setUnreadNotifications });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigation]);

  if (!locationGranted) {
    return (
      <View style={currentStyles.centeredView}>
        <ActivityIndicator size={50} color={Colors.primary} />
        <Text style={currentStyles.loadingText}>
          Solicitando permisos de ubicación...
        </Text>
        {errorMessage && (
          <Text style={currentStyles.errorText}>{errorMessage}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={currentStyles.container}>
      {memoizedMenu}
      <FlatList
        data={filteredBoxData.flatMap(group => group.data)}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.container}
        initialNumToRender={5}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.sectionContainer}>
            {privateEvents.map((event, index) => (
              <View style={styles.boxContainer} key={index}>
                <Box
                  imageUrl={event.image || event.imageUrl}
                  title={event.title}
                  onPress={() => handleBoxPress(event)}
                  selectedDate={event.date}
                  date={event.date}
                  isPrivateEvent={true}
                />
                {event.attendees && event.attendees.length > 0 && (
                  <DotIndicator
                    profileImages={event.attendees.map(
                      (attendee) => attendee.profileImage
                    )}
                    attendeesList={event.attendees}
                  />
                )}
              </View>
            ))}
          </View>
        }
      />

{loading && (
  <View
    style={[
      styles.loadingOverlay,
      { backgroundColor: isNightMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.5)" },
    ]}
  >
    <ActivityIndicator size="large" color={isNightMode ? "white" : "black"} />
  </View>
)}

<View style={currentStyles.tabBar}>
  <TouchableOpacity onPress={() => navigation.navigate("Home")}>
    <Ionicons
      name="home"
      size={24}
      color={isNightMode ? "white" : "black"}
    />
  </TouchableOpacity>
  <TouchableOpacity onPress={() => navigation.navigate("Search")}>
    <Ionicons
      name="search"
      size={24}
      color={isNightMode ? "white" : "black"}
    />
  </TouchableOpacity>
  <TouchableOpacity onPress={navigateToProfile}>
    {profileImage ? (
      <Image
        source={{ uri: profileImage }}
        style={styles.profileImage}
      />
    ) : (
      <Ionicons
        name="person-circle"
        size={24}
        color={isNightMode ? "white" : "black"}
      />
    )}
  </TouchableOpacity>
  <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
    <Ionicons
      name="notifications"
      size={24}
      color={isNightMode ? "white" : "black"}
    />
    {unreadNotifications && (
      <View style={[
        styles.unreadIndicator,
        { backgroundColor: isNightMode ? "white" : "black" }
      ]} />
    )}
  </TouchableOpacity>
  <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
    <Ionicons name="mail" size={25} color={isNightMode ? "white" : "black"} />
    {hasUnreadMessages && (
      <View style={[
        styles.unreadIndicator,
        { backgroundColor: isNightMode ? "white" : "black" }
      ]} />
    )}
  </TouchableOpacity>
</View>

    </View>
  );
});

export default Home;
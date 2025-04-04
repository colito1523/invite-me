import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity, // Necesario para el TabBar
  Image,
} from "react-native";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { auth, storage, database } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import Box from "../../Components/Boxs/Box";
import DotIndicator from "../../Components/Dots/DotIndicator";
import { useNavigation, useRoute } from "@react-navigation/native";
import dayjs from "dayjs";
import { useLocationAndTime } from "../../src/hooks/useLocationAndTime";
import StorySlider from "../../Components/Stories/storySlider/StorySlider";
import boxInfo from "../../src/data/boxInfo";
import Menu from "../../Components/Menu/Menu";
import CalendarPicker from "../CalendarPicker";
import { useTranslation } from "react-i18next";
import { dayStyles, nightStyles, styles } from "./styles";
import { useUnreadMessages } from "../../src/hooks/UnreadMessagesContext";
import { registerPushToken } from "../../src/hooks/useNotifications";
import useNotifications from "../../src/hooks/useNotifications";
import {
  fetchUnreadNotifications,
  fetchData,
  fetchProfileImage,
  onSignOut,
  subscribeToUserProfile,
  fetchBoxData,
  fetchPrivateEvents,
  getFilteredBoxData,
} from "./utils";
import { useDate } from "../../src/hooks/DateContext"; 

const Header = ({ isNightMode, toggleMenu, handleDateChange, setLoading }) => {
  const currentStyles = isNightMode ? nightStyles : dayStyles;

  return (
    <View style={currentStyles.headerContainer}>
      <TouchableOpacity style={{ marginLeft: 10 }} onPress={toggleMenu}>
        <Ionicons
          name="menu"
          size={24}
          color={isNightMode ? "white" : "black"}
        />
      </TouchableOpacity>

      <CalendarPicker
        onDateChange={handleDateChange}
        style={currentStyles.calendarPicker}
        setLoading={setLoading}
      />
    </View>
  );
};

const Home = React.memo(() => {
  const { selectedDate, setSelectedDate } = useDate(); // Usar el contexto
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const { locationGranted, country, city, isNightMode } = useLocationAndTime();
  const navigation = useNavigation();
  const route = useRoute();
  const [errorMessage, setErrorMessage] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [boxData, setBoxData] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [profileImage, setProfileImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const selectedDateRef = useRef(dayjs().format("D MMM"));
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [privateEvents, setPrivateEvents] = useState([]);
  const { hasUnreadMessages, setHasUnreadMessages } = useUnreadMessages();
  const expoPushToken = useNotifications(navigation);
  const { t } = useTranslation();
  const storySliderRef = useRef();
  const currentStyles = useMemo(
    () => (isNightMode ? nightStyles : dayStyles),
    [isNightMode],
  );
  const navigateToProfile = useCallback(() => {
    navigation.navigate("Profile");
  }, [navigation]);

  useEffect(() => {
    fetchUnreadNotifications({ setUnreadNotifications });
}, [navigation]);

useEffect(() => {
  setUnreadMessages(hasUnreadMessages); // Añade esta línea
}, [hasUnreadMessages]); // Añade esta línea

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
  }, [
    auth.currentUser,
    database,
    storage,
    boxInfo,
    setBoxData,
    selectedDateRef,
    fetchPrivateEvents,
  ]);

  useEffect(() => {
    if (route.params?.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
      // Llamar a fetchData con todos los parámetros para recargar TODOS los boxs
      fetchData({
        setLoading,
        fetchBoxData,
        fetchPrivateEvents,
        database,
        storage,
        boxInfo,
        user: auth.currentUser,
        setBoxData,
        selectedDate: selectedDateRef.current,
        setPrivateEvents,
      });
    }
  }, [route.params?.selectedCategory]);
  
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setSelectedDate(selectedDateRef.current); // Actualizar el contexto
    });
    return unsubscribe;
  }, [navigation, setSelectedDate]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchProfileImage({ setProfileImage }); // Asegúrate de definir esta función para obtener la imagen
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (city) {
      setSelectedCity(city);
    } else if (country === "Portugal") {
      setSelectedCity("Lisboa");
    } else if (country === "España") {
      setSelectedCity("Madrid");
    } else if (country === "Inglaterra") {
      setSelectedCity("Londres");
    } else {
      setSelectedCity("All Cities");
    }
  
    console.log("📌 País:", country, "| Ciudad seleccionada:", city);
  }, [country, city]);
  

  useEffect(() => {
    const updateHeader = () => {
      if (navigation.isFocused()) {
        navigation.setOptions({
          headerStyle: {
            backgroundColor: isNightMode ? "black" : "white",
            shadowColor: 'transparent',
            borderBottomWidth: 0,
            elevation: 0,
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
      }
    };

    updateHeader();
    
    const focusUnsubscribe = navigation.addListener("focus", updateHeader);
    const blurUnsubscribe = navigation.addListener("blur", () => {
      navigation.setOptions({
        headerTitle: null
      });
    });

    return () => {
      focusUnsubscribe();
      blurUnsubscribe();
    };
  }, [navigation, isNightMode, toggleMenu, handleDateChange, setLoading]);

  useEffect(() => {
    setSelectedDate(selectedDateRef.current);
  }, []);

  const handleDateChange = useCallback(
    async (date) => {
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
    },
    [auth.currentUser, database, storage, boxInfo, setBoxData, selectedDateRef, setSelectedDate],
  );

  const renderStorySlider = useCallback(() => (
    <StorySlider
      ref={storySliderRef}
      eventTitle={t("exampleEvent")}
      selectedDate={selectedDate}
    />
  ), [t, selectedDate]);
  
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.forceStoryUpdate) {
        storySliderRef.current?.loadExistingStories();
        // Limpiar el parámetro para que no se vuelva a llamar en el siguiente focus
        navigation.setParams({ forceStoryUpdate: undefined });
      }
    });
    return unsubscribe;
  }, [navigation, route.params?.forceStoryUpdate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const user = auth.currentUser;
    if (user) {
      await registerPushToken();
      try {
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
        await fetchProfileImage({ setProfileImage });
        // Refrescar el StorySlider
        storySliderRef.current?.loadExistingStories();
      } catch (error) {
        console.error("Error al recargar datos:", error);
      }
    }
    setRefreshing(false);
  }, [
    auth.currentUser,
    database,
    storage,
    boxInfo,
    setBoxData,
    selectedDateRef,
  ]);
  

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
    [navigation],
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
  }, [
    selectedCategory,
    auth.currentUser,
    database,
    storage,
    boxInfo,
    selectedDateRef,
    setBoxData,
  ]);

  // Agregamos este useEffect justo después para que la fecha cambie a las 06:00 AM
  useEffect(() => {
    const calculateTimeUntilNextUpdate = () => {
      const now = dayjs();
      let nextUpdateTime;
  
      // Si es antes de las 6:00 AM, la próxima actualización es a las 6:00 AM
      if (now.hour() < 6) {
        nextUpdateTime = now.set('hour', 6).set('minute', 0).set('second', 0);
      }
      // Si es después de las 6:00 AM, la próxima actualización es a las 00:00 del día siguiente
      else {
        nextUpdateTime = now.add(1, 'day').set('hour', 0).set('minute', 0).set('second', 0);
      }
  
      // Calcula la diferencia en milisegundos hasta la próxima actualización
      return nextUpdateTime.diff(now);
    };
  
    const updateDateIfNeeded = () => {
      const now = dayjs();
      let newDate;
  
      // Si es entre las 00:00 y las 06:00, usar la fecha del día anterior
      if (now.hour() >= 0 && now.hour() < 6) {
        newDate = now.subtract(1, 'day').format("D MMM");
      }
      // Si es después de las 06:00, usar la fecha actual
      else {
        newDate = now.format("D MMM");
      }
  
      // Actualizar la fecha si es necesario
      if (newDate !== selectedDateRef.current) {
        handleDateChange(newDate);
      }
    };
  
    // Ejecutar la actualización inmediatamente
    updateDateIfNeeded();
  
    // Calcular el tiempo hasta la próxima actualización
    const timeUntilNextUpdate = calculateTimeUntilNextUpdate();
  
    // Configurar un timeout para la próxima actualización
    const timeoutId = setTimeout(() => {
      updateDateIfNeeded();
      // Configurar un intervalo para que se actualice cada 24 horas después de la primera actualización
      const intervalId = setInterval(updateDateIfNeeded, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, timeUntilNextUpdate);
  
    // Limpiar el timeout cuando el componente se desmonte
    return () => clearTimeout(timeoutId);
  }, [handleDateChange]);

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
  }, [
    auth.currentUser,
    database,
    storage,
    boxInfo,
    setBoxData,
    selectedDateRef,
    fetchPrivateEvents,
  ]);

  // para modulizar inicio

  const filteredBoxData = useMemo(() => {
    return getFilteredBoxData(boxData, selectedCity, selectedCategory, t, selectedDate);
  }, [boxData, selectedCity, selectedCategory, t, selectedDate]);

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
  }, [
    selectedDate,
    auth.currentUser,
    database,
    storage,
    boxInfo,
    setBoxData,
    selectedDateRef,
    fetchPrivateEvents,
  ]);


  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const chatsRef = collection(database, "chats");
    const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        let hasUnread = false;
        for (const docSnapshot of querySnapshot.docs) {
            const messagesRef = collection(database, "chats", docSnapshot.id, "messages");
            const unreadQuery = query(messagesRef, where("seen", "==", false), where("senderId", "!=", user.uid));
            const unreadMessagesSnapshot = await getDocs(unreadQuery);

            if (unreadMessagesSnapshot.size > 0) {
                hasUnread = true;
                break;
            }
        }

        setUnreadMessages(hasUnread);
        setHasUnreadMessages(hasUnread); // Actualiza en el contexto global
    });

    return () => unsubscribe();
}, [navigation]); // Se actualiza cuando el usuario navega



  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Llama a la función modularizada.
      const unsubscribe = subscribeToUserProfile(database, user, setProfileImage);

      // Devuelve la función de limpieza.
      return () => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      };
    }
  }, [auth.currentUser]); // Dependencia del usuario autenticado.

  // Función para manejar el evento de clic en el box
  const handleBoxPress = useCallback(
    (box) => {
      const boxWithAdmin = {
        ...box,
        Admin: box.Admin || box.uid || undefined, // Usar el Admin existente o el uid del evento
        details: box.details || "",
      };
      navigation.navigate("BoxDetails", {
        box: boxWithAdmin,
        selectedDate,
        attendees: box.attendees || [],
      });
    },
    [navigation, selectedDate],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.boxContainer}>
        <Box
          imageUrl={item.imageUrl}
          title={item.title}
          onPress={() => handleBoxPress(item)}
          selectedDate={selectedDate}
          date={item.date}
          isPrivateEvent={item.category === "EventoParaAmigos"}
          priority={item.priority} // Ensure the priority property is passed to the Box component
          membersClub={item.membersClub}
        />
        {item.attendees && item.attendees.length > 0 && (
          <DotIndicator
            profileImages={item.attendees.map(
              (attendee) => attendee.profileImage,
            )}
            attendeesList={item.attendees}
          />
        )}
      </View>
    ),
    [handleBoxPress, selectedDate],
  );

  const keyExtractor = useCallback((item) => item.id || item.title, []);

  const memoizedMenu = useMemo(
    () => (
      <Menu
        isVisible={menuVisible}
        onClose={toggleMenu}
        onCategorySelect={handleCategorySelect}
        onCitySelect={handleCitySelect}
        onSignOut={handleSignOut} // Aquí pasamos la función
        isNightMode={isNightMode}
        searchQuery={searchQuery}
        expoPushToken={expoPushToken} // 💥 Agregá esto
        setSearchQuery={setSearchQuery}
      />
    ),
    [
      menuVisible,
      toggleMenu,
      handleCategorySelect,
      handleCitySelect,
      handleSignOut,
      isNightMode,
      searchQuery,
      expoPushToken,
      setSearchQuery,
    ],
  );

  useEffect(() => {
    const unsubscribe = fetchUnreadNotifications({ setUnreadNotifications });
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [navigation]);

  if (!locationGranted) {
    return (
      <View style={currentStyles.centeredView}>
        <ActivityIndicator size={50} color={Colors.primary} />
        <Text style={currentStyles.loadingText}>
          {t('HomeIndex.requestingLocationPermissions')}
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
  
      {/* StorySlider solo se renderiza una vez */}
  
      <FlatList
  data={filteredBoxData.flatMap((group) => group.data)}
  renderItem={renderItem}
  initialNumToRender={42}
  keyExtractor={keyExtractor}
  contentContainerStyle={{ paddingBottom: 20 }} // Espacio extra para mejor desplazamiento
  removeClippedSubviews={true}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
  ListHeaderComponent={renderStorySlider}
/>
      {loading && (
        <View
          style={[
            styles.loadingOverlay,
            {
              backgroundColor: isNightMode
                ? "rgba(0, 0, 0, 0.8)"
                : "rgba(255, 255, 255, 0.5)",
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={isNightMode ? "white" : "black"}
          />
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
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
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
            color={isNightMode ? "#ebddd5" : "black"}
          />
          {unreadNotifications && (
            <View
              style={[
                styles.unreadIndicator,
                { backgroundColor: isNightMode ? "white" : "black" },
              ]}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
          <Ionicons name="mail" size={25} color={isNightMode ? "white" : "black"} />
          {unreadMessages && (
            <View style={[styles.unreadIndicator, { backgroundColor: isNightMode ? "#ebddd5" : "black" }]} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  
});

export default Home;
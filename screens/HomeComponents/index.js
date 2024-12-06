import React, { useState, useEffect, useCallback, useMemo, lazy, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { signOut } from "firebase/auth";
import {
  auth,
  storage,
  ref,
  getDownloadURL,
  database,
} from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import Colors from "../../constants/Colors";
import Box from "../../Components/Boxs/Box";
import CalendarPicker from "../CalendarPicker";
import DotIndicator from "../../Components/Dots/DotIndicator";
import { useNavigation, useRoute } from "@react-navigation/native";
import dayjs from "dayjs";
import * as SecureStore from 'expo-secure-store';
import { useLocationAndTime } from "../../src/hooks/useLocationAndTime";

import boxInfo from "../../src/data/boxInfo";
import Menu from "../../Components/Menu/Menu";
import TabBar from "./TabBar";
import Header from "./Header"; // Importamos el nuevo componente
import { useTranslation } from 'react-i18next';
import { dayStyles, nightStyles, styles } from "./styles";
import {fetchUnreadNotifications, fetchData, fetchProfileImage, fetchUnreadMessages} from "./utils";

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
  const LazyBoxDetails = lazy(() => import('../../screens/BoxDetails')); // Aaca tendremos que ver si esta siendo llanado correctamente
  const [unreadMessages, setUnreadMessages] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const currentStyles = useMemo(() => isNightMode ? nightStyles : dayStyles, [isNightMode]);

 useEffect(() => {
    fetchUnreadNotifications();
  }, [navigation]);

  useEffect(() => {
    fetchData({setLoading, fetchBoxData, fetchPrivateEvents});
  }, []);

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
    await fetchBoxData();
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBoxData(); // Usa selectedDateRef.current dentro de fetchBoxData
    await fetchPrivateEvents();
    setRefreshing(false);
  }, []);

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

  const onSignOut = useCallback(async () => {
    try {
      await signOut(auth); // Cierra la sesión de Firebase
      await SecureStore.deleteItemAsync('session_token'); // Elimina el token de sesión
      console.log("Sign-out successful and session token cleared.");
      navigation.navigate("Login");
    } catch (error) {
      console.log("Sign-out error:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión correctamente.");
    }
  }, [navigation]);

  const navigateToProfile = useCallback(() => {
    navigation.navigate("Profile");
  }, [navigation]);

  const fetchBoxData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      let blockedUsers = [];
    if (user) {
      const userDoc = await getDoc(doc(database, "users", user.uid));
      if (userDoc.exists()) {
        blockedUsers = userDoc.data()?.blockedUsers || [];
      }
    }
      const data = await Promise.all(
        boxInfo.map(
          async ({
            path,
            title,
            category,
            hours,
            number,
            coordinates,
            country,
            city,
          }) => {
            let url = path;
  
            if (typeof path === "string") {
              const storageRef = ref(storage, path);
              url = await getDownloadURL(storageRef);
            }
  
            const boxRef = doc(database, "GoBoxs", title);
            const boxDoc = await getDoc(boxRef);
            let attendees = [];
  
            if (boxDoc.exists()) {
              attendees = Array.isArray(boxDoc.data()[selectedDateRef.current])
                ? boxDoc.data()[selectedDateRef.current]
                : [];
            }

             // Filtrar asistentes bloqueados
          const filteredAttendees = attendees.filter(
            (attendee) => !blockedUsers.includes(attendee.uid)
          );
            
            return {
              imageUrl: url,
              title,
              category,
              hours,
              number,
              coordinates,
              country,
              city,
              attendees: filteredAttendees,
              attendeesCount: filteredAttendees.length || 0,
            };
          }
        )
      );
  
      const userEvents = [];
      if (user) {
        const privateEventsRef = collection(database, "EventsPriv");
        const adminEventsQuery = query(
          privateEventsRef,
          where("Admin", "==", user.uid)
        );
        const querySnapshot = await getDocs(adminEventsQuery);
  
        querySnapshot.forEach((doc) => {
          const eventData = doc.data();
          const filteredAttendees = (eventData.attendees || []).filter(
            (attendee) => !blockedUsers.includes(attendee.uid)
          );
          userEvents.push({
            id: doc.id,
            imageUrl: eventData.image,
            title: eventData.title,
            category: "EventoParaAmigos",
            hours: { [eventData.day]: eventData.hour },
            number: eventData.phoneNumber,
            coordinates: { latitude: 0, longitude: 0 },
            country: eventData.country || "Portugal",
            city: eventData.city || "Lisboa",
            date: eventData.date,
            attendees: filteredAttendees,
            attendeesCount: filteredAttendees.length,
            isPrivateEvent: true,
          });
        });
      }
  
      const allEvents = [...userEvents, ...data].sort(
        (a, b) => b.attendeesCount - a.attendeesCount
      );
  
      setBoxData(allEvents);
    } catch (error) {
     
    }
  }, [selectedDate]);

  // Coloca aquí el nuevo useEffect para actualizar los datos cuando cambie selectedCategory
useEffect(() => {
  fetchBoxData();
}, [selectedCategory]);

const fetchPrivateEvents = useCallback(async () => {
  const user = auth.currentUser;
  if (!user) return;

  let blockedUsers = [];
  const userDoc = await getDoc(doc(database, "users", user.uid));
  if (userDoc.exists()) {
    blockedUsers = userDoc.data()?.blockedUsers || [];
  }

  const eventsRef = collection(database, 'users', user.uid, 'events');
  const eventsSnapshot = await getDocs(eventsRef);
  const events = [];

 

  for (const docSnapshot of eventsSnapshot.docs) {
    const eventData = docSnapshot.data();
    
    // Verificar si el evento es aceptado y que no es del usuario actual
    if (eventData.status === 'accepted' && eventData.uid !== user.uid) {
      const eventPrivRef = doc(database, 'EventsPriv', eventData.eventId);
      const eventPrivDoc = await getDoc(eventPrivRef);
      if (eventPrivDoc.exists()) {
        const fullEventData = eventPrivDoc.data();

        events.push({
          id: docSnapshot.id,
          ...fullEventData,
          ...eventData,
          attendees: fullEventData.attendees || [],
        });
       
      }
    }
  }


  setPrivateEvents(events);
}, []);


  const filteredBoxData = useMemo(() => {
    if (!boxData || !Array.isArray(boxData)) {
      return [];
    }
  
    // Filtrado inicial según ciudad
    let filteredData = boxData;
    if (selectedCity && selectedCity !== "All Cities") {
      filteredData = filteredData.filter((box) => box.city === selectedCity);
    }
  
    // Filtrado adicional según categoría, ignorando la opción "Todos"
    if (selectedCategory && selectedCategory !== t("categories.all")) {
      filteredData = filteredData.filter((box) => box.category === selectedCategory);
    }
  
    // Separación de eventos en categorías de amigos y generales
    const privateEvents = [];
    const generalEvents = [];
  
    filteredData.forEach((box) => {
      if (box.category === "EventoParaAmigos") {
        privateEvents.push(box);
      } else {
        generalEvents.push(box);
      }
    });
  
    return [
      { title: "Eventos Privados", data: privateEvents },
      { title: "Eventos Generales", data: generalEvents },
    ];
  }, [boxData, selectedCity, selectedCategory, t]);
  
  useEffect(() => {
    fetchBoxData();
    fetchPrivateEvents();
  }, [selectedDate, fetchBoxData, fetchPrivateEvents]);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Escucha en tiempo real los cambios del documento de usuario
      const unsubscribe = onSnapshot(doc(database, "users", user.uid), (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.photoUrls && data.photoUrls.length > 0) {
            setProfileImage(data.photoUrls[0]); // Actualiza la imagen del perfil al recibir cambios
          }
        }
      });
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, []);
  
  // Función para manejar el evento de clic en el box
  const handleBoxPress = useCallback(
    (box) => {
      navigation.navigate("BoxDetails", {
        box,
        selectedDate,
        attendees: box.attendees || [],
      });
    },
    [navigation, selectedDate]
  );

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

  useEffect(() => {
    const unsubscribe = fetchUnreadMessages({ setUnreadMessages, user: auth.currentUser });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigation, auth.currentUser]);

  const memoizedMenu = useMemo(() => (
    <Menu
      isVisible={menuVisible}
      onClose={toggleMenu}
      onCategorySelect={handleCategorySelect}
      onCitySelect={handleCitySelect}
      onSignOut={onSignOut}
      isNightMode={isNightMode}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    />
  ), [menuVisible, toggleMenu, handleCategorySelect, handleCitySelect, onSignOut, isNightMode, searchQuery, setSearchQuery]);

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
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size={50} color="black" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      )}

<TabBar
      isNightMode={isNightMode}
      profileImage={profileImage}
      unreadNotifications={unreadNotifications}
      unreadMessages={unreadMessages}
    />
    </View>
  );
});

export default Home;
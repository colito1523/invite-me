import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { signOut } from "firebase/auth";
import { Entypo, FontAwesome, FontAwesome6, Ionicons  } from "@expo/vector-icons";
import {
  auth,
  storage,
  ref,
  getDownloadURL,
  database,
} from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import Colors from "../constants/Colors";
import Box from "../Components/Boxs/Box";
import CalendarPicker from "./CalendarPicker";
import DotIndicator from "../Components/Dots/DotIndicator";
import { useNavigation, useRoute } from "@react-navigation/native";
import dayjs from "dayjs";
import * as Location from "expo-location";
import { Image } from "expo-image";

import boxInfo from "../src/data/boxInfo";
import Menu from "../Components/Menu/Menu";
import { useTranslation } from 'react-i18next';


const { width } = Dimensions.get("window");

const Home = React.memo(() => {
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
  const [locationGranted, setLocationGranted] = useState(false);
  const [country, setCountry] = useState(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [privateEvents, setPrivateEvents] = useState([]);
  const { t } = useTranslation();
  const LazyBoxDetails = lazy(() => import('./BoxDetails'));
  const [unreadMessages, setUnreadMessages] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchBoxData(), fetchPrivateEvents()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    if (route.params?.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory]);


  const fetchProfileImage = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(database, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.photoUrls && data.photoUrls.length > 0) {
          setProfileImage(data.photoUrls[0]);
        }
      }
    }
  };

  useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    fetchProfileImage(); // Asegúrate de definir esta función para obtener la imagen
  });
  return unsubscribe;
}, [navigation]);




  const currentStyles = useMemo(() => isNightMode ? nightStyles : dayStyles, [isNightMode]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Se necesita acceso a la ubicación para usar la aplicación.");
        return;
      }
      setLocationGranted(true);
      let location = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
  
      if (geocode.length > 0) {
        const userCountry = geocode[0].country;
        console.log("País detectado:", userCountry);
        setCountry(userCountry);
        setSelectedCity(userCountry === 'Portugal' ? 'Lisboa' : 'Madrid'); // Selección automática de ciudad
      }
    })();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isNightMode ? "black" : "white",
      },
      headerTintColor: isNightMode ? "white" : "black",
      headerTitle: () => (
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
            style={styles.calendarPicker}
            setLoading={setLoading}
          />
        </View>
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

  const onSignOut = useCallback(() => {
    signOut(auth)
      .then(() => {
        console.log("Sign-out successful.");
        navigation.navigate("Login");
      })
      .catch((error) => console.log("Sign-out error:", error));
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
              attendees,
              attendeesCount: attendees.length || 0,
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
            attendees: eventData.attendees || [],
            attendeesCount: eventData.attendees ? eventData.attendees.length : 0,
            isPrivateEvent: true,
          });
        });
      }
  
      const allEvents = [...userEvents, ...data].sort(
        (a, b) => b.attendeesCount - a.attendeesCount
      );
  
      setBoxData(allEvents);
    } catch (error) {
      console.log("Error fetching box data:", error);
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
      if (eventData.status === 'accepted') {
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
      return () => unsubscribe(); // Limpia la suscripción cuando se desmonta el componente
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
    const fetchUnreadMessages = async () => {
      if (!auth.currentUser) return;
      const user = auth.currentUser;
      const chatsRef = collection(database, "chats");
      const q = query(chatsRef, where("participants", "array-contains", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let hasUnreadMessages = false;
        querySnapshot.forEach((docSnapshot) => {
          const chatData = docSnapshot.data();
          const messagesRef = collection(database, "chats", docSnapshot.id, "messages");
          const unseenMessagesQuery = query(
            messagesRef,
            where("seen", "==", false),
            where("senderId", "!=", user.uid)
          );
          onSnapshot(unseenMessagesQuery, (unseenMessagesSnapshot) => {
            if (!unseenMessagesSnapshot.empty) {
              hasUnreadMessages = true;
              setUnreadMessages(true);
            } else {
              setUnreadMessages(false);
            }
          });
        });
      });
      return () => unsubscribe();
    };
  
    fetchUnreadMessages();
  }, [navigation]);

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
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
          <Ionicons
            name="mail"
            size={25}
            color={isNightMode ? "white" : "black"}
          />
          {unreadMessages && (
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

const dayStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  headerContainer: {
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    color: "black",
    textAlign: "center",
  },

 tabBar: {
  flexDirection: "row",
  justifyContent: "space-around",
  paddingBottom: Platform.OS === 'ios' ? 40 : 10,
  paddingTop: Platform.OS === 'ios' ? 15 : 10,
  backgroundColor:"#f5f5f5",
  borderTopWidth: 1,
  borderTopColor: "#e0e0e0",
  width: "100%", // Asegura que ocupe todo el ancho de la pantalla
  alignItems: "center", // Centra verticalmente los íconos si es necesario
},
  emptyText: {
    textAlign: "center",
    color: "black",
    fontSize: 16,
    marginTop: 10,
  },
});

const nightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  headerContainer: {
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",

    
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    color: "white",
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === 'ios' ? 40 : 10,
    paddingTop: Platform.OS === 'ios' ? 15 : 10,
    backgroundColor:"black",
    borderTopWidth: 1,
    borderTopColor: "black",
    width: "100%", // Asegura que ocupe todo el ancho de la pantalla
    alignItems: "center", // Centra verticalmente los íconos si es necesario
  },
  emptyText: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    marginTop: 10,
  },
});

const styles = StyleSheet.create({
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "red",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  calendarPicker: {
    flex: 1,
  },
  sectionContainer: {
    width: "100%",
    marginTop: 30
  },
  boxContainer: {
    marginBottom: 15,
    width: "100%",
    position: "relative",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "black",
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
 },
 unreadIndicator: {
  position: "absolute",
  top: -5,
  right: -5,
  width: 10,
  height: 10,
  borderRadius: 5,
},
});

export default Home;
import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
  } from "react";
  import {
    TouchableOpacity,
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Text,
    ActivityIndicator,
    Dimensions,
  } from "react-native";
  import { signOut } from "firebase/auth";
  import { Entypo, FontAwesome, FontAwesome6 } from "@expo/vector-icons";
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
  } from "firebase/firestore";
  import Colors from "../constants/Colors";
  import Box from "../Components/Boxs/Box";
  import CalendarPicker from "./CalendarPicker";
  import DotIndicator from "../Components/Dots/DotIndicator";
  import { useNavigation } from "@react-navigation/native";
  import dayjs from "dayjs";
  import * as Location from "expo-location";
  import { Image } from "expo-image";
  
  import boxInfo from "../src/data/boxInfo";
  import Menu from "../Components/Menu/Menu";
  
  const { width } = Dimensions.get("window");
  
  export default function Home() {
    const navigation = useNavigation();
  
    const [errorMessage, setErrorMessage] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [boxData, setBoxData] = useState([]);
    const [selectedBox, setSelectedBox] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isEventSaved, setIsEventSaved] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs().format("D MMM"));
    const [locationGranted, setLocationGranted] = useState(false);
    const [country, setCountry] = useState(null);
    const [userCity, setUserCity] = useState(null);
    const [isNightMode, setIsNightMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [privateEvents, setPrivateEvents] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null); // Nuevo estado para la ciudad seleccionada
  
    const handleCitySelection = (city) => {
      setSelectedCity(city);
    };
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          await fetchBoxData();
          await fetchPrivateEvents();
        } catch (error) {
          console.error("Error fetching data:", error);
          setErrorMessage(
            "Error al cargar los datos. Por favor, intente de nuevo."
          );
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
  
    const currentStyles = isNightMode ? nightStyles : dayStyles;
  
    useEffect(() => {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMessage(
            "Se necesita acceso a la ubicación para usar la aplicación."
          );
          return;
        }
        setLocationGranted(true);
        let location = await Location.getCurrentPositionAsync({});
        let geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
  
        if (geocode.length > 0) {
          const locationDetails = geocode[0];
          const userCountry = locationDetails.country || "País no disponible";
          let userCity =
            locationDetails.city ||
            locationDetails.region ||
            "Ciudad no disponible";
  
          // Ajusta para Lisboa y Madrid si es necesario
          if (userCountry === "Portugal" && locationDetails.region === "Lisboa") {
            userCity = "Lisboa";
          }
          if (userCountry === "España" && locationDetails.region === "Madrid") {
            userCity = "Madrid";
          }
  
          console.log("País detectado:", userCountry);
          console.log("Ciudad detectada:", userCity);
  
          setCountry(userCountry);
          setUserCity(userCity); // Actualiza el estado de la ciudad
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
              <Entypo
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
  
    const handleDateChange = async (date) => {
      setSelectedDate(date);
      setLoading(true);
      await fetchBoxData();
      setLoading(false);
    };
  
    const onRefresh = async () => {
      setRefreshing(true);
      await fetchBoxData();
      await fetchPrivateEvents();
      setRefreshing(false);
    };
  
    const toggleMenu = useCallback(() => {
      setMenuVisible(!menuVisible);
    }, [menuVisible]);
  
    const handleCategorySelect = useCallback(
      (category) => {
        setSelectedCategory(category);
        setMenuVisible(false);
        if (category === "createOwnEvent") {
          setTimeout(() => {
            navigation.navigate("CreateEvent");
          }, 300);
        }
      },
      [navigation]
    );
  
    const onSignOut = () => {
      signOut(auth)
        .then(() => {
          console.log("Sign-out successful.");
          navigation.navigate("Login");
        })
        .catch((error) => console.log("Sign-out error:", error));
    };
  
    const navigateToProfile = () => {
      navigation.navigate("Profile");
    };
  
    const fetchBoxData = async () => {
      try {
        const user = auth.currentUser;
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
            }) => {
              const storageRef = ref(storage, path);
              const url = await getDownloadURL(storageRef);
              const boxRef = doc(database, "GoBoxs", title);
              const boxDoc = await getDoc(boxRef);
    
              let attendees = [];
              if (boxDoc.exists()) {
                attendees = Array.isArray(boxDoc.data()[selectedDate])
                  ? boxDoc.data()[selectedDate]
                  : [];
              }
    
              return {
                imageUrl: url,
                title,
                category,
                hours,
                number,
                coordinates,
                country,
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
            userEvents.push({
              id: doc.id,
              imageUrl: eventData.image,
              title: eventData.title,
              category: "EventoParaAmigos",
              hours: { [eventData.day]: eventData.hour },
              number: eventData.phoneNumber,
              coordinates: { latitude: 0, longitude: 0 },
              country: eventData.country || "Portugal",
              date: eventData.date,
              attendees: eventData.attendees || [],
              attendeesCount: eventData.attendees
                ? eventData.attendees.length
                : 0,
              isPrivateEvent: true,
            });
          });
    
          const eventsRef = collection(database, "users", user.uid, "events");
          const eventsSnapshot = await getDocs(eventsRef);
    
          eventsSnapshot.forEach((doc) => {
            const eventData = doc.data();
            userEvents.push({
              id: doc.id,
              imageUrl: eventData.imageUrl,
              title: eventData.title,
              category: eventData.category || "EventoParaAmigos",
              date: eventData.date,
              isPrivateEvent: eventData.isPrivate || false,
              attendees: [],
              attendeesCount: 0,
            });
          });
        }
    
        const allEvents = [...userEvents, ...data].sort(
          (a, b) => b.attendeesCount - a.attendeesCount
        );
    
        console.log("Datos obtenidos de eventos:", allEvents); // Agrega esto para ver si los datos se obtienen correctamente
    
        setBoxData(allEvents);
      } catch (error) {
        console.log("Error fetching box data:", error);
      }
    };
    
  
    const fetchPrivateEvents = async () => {
      const user = auth.currentUser;
      if (!user) return;
  
      const eventsRef = collection(database, "users", user.uid, "events");
      const eventsSnapshot = await getDocs(eventsRef);
  
      const events = [];
      for (const docSnapshot of eventsSnapshot.docs) {
        const eventData = docSnapshot.data();
        if (eventData.status === "accepted") {
          const eventPrivRef = doc(database, "EventsPriv", eventData.eventId);
          const eventPrivDoc = await getDoc(eventPrivRef);
          if (eventPrivDoc.exists()) {
            const fullEventData = eventPrivDoc.data();
            events.push({
              id: docSnapshot.id,
              ...fullEventData,
              ...eventData,
            });
          }
        }
      }
  
      setPrivateEvents(events);
    };
  
    const cityCountryMap = {
      Lisboa: "Portugal",
      Madrid: "España"
      // Agrega más ciudades y países según sea necesario
  };
  
  const filteredBoxData = useMemo(() => {
    if (!boxData || !Array.isArray(boxData)) {
      return [];
    }
  
    let privateEvents = [];
    let generalEvents = [];
    let invitedEvents = [];
  
    // Separa los eventos privados, generales, e invitados
    boxData.forEach((box) => {
      if (box.category === "EventoParaAmigos" && box.isPrivateEvent) {
        privateEvents.push(box);
      } else if (box.isInvitedEvent) {
        invitedEvents.push(box);
      } else {
        generalEvents.push(box);
      }
    });
  
    // Retorna las secciones de eventos: privados primero, luego generales e invitados
    return [
      { title: "Eventos Privados", data: privateEvents },
      { title: "Eventos Generales", data: generalEvents },
      { title: "Eventos Invitados", data: invitedEvents },
    ];
  }, [boxData]);
  
    useEffect(() => {
      fetchBoxData();
      fetchPrivateEvents();
    }, [selectedDate]);
  
    useEffect(() => {
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
  
      fetchProfileImage();
    }, []);
  
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
  
    const checkEventStatus = async () => {
      const user = auth.currentUser;
      if (user && selectedBox) {
        const eventsRef = collection(database, "users", user.uid, "events");
        const q = query(eventsRef, where("title", "==", selectedBox.title));
        const querySnapshot = await getDocs(q);
        setIsEventSaved(!querySnapshot.empty);
      }
    };
  
    useEffect(() => {
      checkEventStatus();
    }, [selectedBox]);
  
    return (
      <View style={currentStyles.container}>
        {!locationGranted ? (
          <View style={currentStyles.centeredView}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={currentStyles.loadingText}>
              Solicitando permisos de ubicación...
            </Text>
            {errorMessage && (
              <Text style={currentStyles.errorText}>{errorMessage}</Text>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Menu
              isVisible={menuVisible}
              onClose={toggleMenu}
              onCategorySelect={handleCategorySelect}
              onSignOut={onSignOut}
              isNightMode={isNightMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onCitySelect={handleCitySelection} // Pasa `onCitySelect` aquí
            />
            <ScrollView
              contentContainerStyle={styles.container}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
             {filteredBoxData.map((group, index) =>
    Array.isArray(group.data) && group.data.length > 0 ? (
      <View key={index} style={styles.sectionContainer}>
        <Text style={currentStyles.sectionTitle}>
          {group.title}
        </Text>
        {group.data.map((box, boxIndex) => (
          <View style={styles.boxContainer} key={boxIndex}>
            <Box
              imageUrl={box.imageUrl}
              title={box.title}
              onPress={() => handleBoxPress(box)}
              selectedDate={selectedDate}
              date={box.date}
              isPrivateEvent={box.category === "EventoParaAmigos"}
            />
            {box.attendees && box.attendees.length > 0 && (
              <DotIndicator
                profileImages={box.attendees.map(
                  (attendee) => attendee.profileImage
                )}
                attendeesList={box.attendees}
              />
            )}
          </View>
        ))}
      </View>
    ) : (
      <Text key={index} style={currentStyles.emptyText}>
        No hay eventos disponibles en esta sección.
      </Text>
    )
  )}
  
            </ScrollView>
  
            {loading && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#C0A368" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              </View>
            )}
  
            <View style={currentStyles.tabBar}>
              <TouchableOpacity onPress={() => navigation.navigate("Home")}>
                <FontAwesome6
                  name="house"
                  size={24}
                  color={isNightMode ? "white" : "black"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Search")}>
                <FontAwesome
                  name="search"
                  size={24}
                  color={isNightMode ? "white" : "black"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateToProfile()}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <FontAwesome
                    name="user-circle"
                    size={24}
                    color={isNightMode ? "white" : "black"}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Notifications")}
              >
                <FontAwesome
                  name="bell"
                  size={24}
                  color={isNightMode ? "white" : "black"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
                <FontAwesome
                  name="envelope"
                  size={24}
                  color={isNightMode ? "white" : "black"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }
  
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
      padding: 10,
      backgroundColor: "#f5f5f5",
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: "black",
    },
    errorText: {
      marginTop: 10,
      fontSize: 16,
      color: "red",
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
      padding: 10,
      backgroundColor: "black",
      borderTopWidth: 1,
      borderTopColor: "black",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: "white",
    },
    errorText: {
      marginTop: 10,
      fontSize: 16,
      color: "red",
    },
  });
  
  const styles = StyleSheet.create({
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
      width: 30,
      height: 30,
      borderRadius: 15,
    },
  });
  
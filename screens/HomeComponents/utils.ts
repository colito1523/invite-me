import { collection, doc, getDoc, onSnapshot, query, where, getDocs  } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { auth, database, } from "../../config/firebase";
import { signOut } from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from '@react-native-async-storage/async-storage';



export const onSignOut = async (navigation, auth) => {
  try {
    // Cleanup all listeners before sign out
    const unsubscribes = navigation.getState()?.unsubscribes || [];
    for (const unsubscribe of unsubscribes) {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.log('Error unsubscribing:', error);
        }
      }
    }

    // Clear all listeners
    navigation.getState().unsubscribes = [];

    // Clear all AsyncStorage data
    await AsyncStorage.clear();

    // Clear SecureStore data
    await SecureStore.deleteItemAsync("session_token");
    await SecureStore.deleteItemAsync("user_preferences");
    await SecureStore.deleteItemAsync("language_settings");

    // Sign out from Firebase
    await signOut(auth);

  } catch (error) {
    console.error('Error during sign out:', error);
    Alert.alert("Error", "No se pudo cerrar la sesión correctamente.");
  }
};

export const subscribeToUserProfile = (database, user, setProfileImage) => {
  if (!user) return null; // Retorna null si no hay usuario.

  const unsubscribe = onSnapshot(doc(database, "users", user.uid), (userDoc) => {
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.photoUrls && data.photoUrls.length > 0) {
        setProfileImage(data.photoUrls[0]); // Actualiza la imagen de perfil.
      }
    }
  });

  return unsubscribe;
};

export const configureHeader = ({
  navigation,
  headerTitleComponent,
  isNightMode,
}) => {
  navigation.setOptions({
    headerStyle: {
      backgroundColor: isNightMode ? "black" : "white",
    },
    headerTintColor: isNightMode ? "white" : "black",
    headerTitle: headerTitleComponent,
  });
};

export const requestLocationPermission = async (
  setErrorMessage: (message: string | null) => void,
  setLocationGranted: (granted: boolean) => void,
  setCountry: (country: string | null) => void,
  setSelectedCity: (city: string) => void
) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Se necesita acceso a la ubicación para usar la aplicación.");
      return;
    }
    setLocationGranted(true);

    const location = await Location.getCurrentPositionAsync({});
    const geocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (geocode.length > 0) {
      const userCountry = geocode[0].country || null;
      console.log("País detectado:", userCountry);
      setCountry(userCountry);
      setSelectedCity(userCountry === "Portugal" ? "Lisboa" : "Madrid");
    }
  } catch (error) {
    console.error("Error al solicitar permisos de ubicación:", error);
    setErrorMessage("Ocurrió un error al obtener la ubicación.");
  }
};

// utils.ts
export const checkTime = (setIsNightMode: (value: boolean) => void) => {
  const currentHour = new Date().getHours();
  setIsNightMode(currentHour >= 19 || currentHour < 6);
};

export const fetchUnreadNotifications = ({ setUnreadNotifications }) => {
  if (auth.currentUser) {
    const user = auth.currentUser;
    let hasUnreadNotifs = false;
    let hasUnreadRequests = false;

    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const q = query(notificationsRef, where("seen", "==", false));

    const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
      hasUnreadNotifs = !snapshot.empty;
      setUnreadNotifications(hasUnreadNotifs || hasUnreadRequests);
    });

    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
    const friendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));

    const unsubscribeFriendRequests = onSnapshot(friendRequestsQuery, (snapshot) => {
      hasUnreadRequests = !snapshot.empty;
      setUnreadNotifications(hasUnreadNotifs || hasUnreadRequests);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeFriendRequests();
    };
  }

  console.warn("Usuario no autenticado");
  return () => {};
};

export const fetchData = async ({ 
  setLoading,
  fetchBoxData,
  fetchPrivateEvents,
  database,
  storage,
  boxInfo,
  user,
  setBoxData,
  selectedDate,
  setPrivateEvents, // Este debe ser pasado correctamente
  selectedCity, 
}) => {
  const t0 = Date.now();
  console.log("⏱ [fetchData] inicio");
  try {
    setLoading(true);

    await Promise.all([
      fetchBoxData({
        database,
        storage,
        boxInfo,
        user,
        setBoxData,
        selectedDate,
        selectedCity,
      }),
      fetchPrivateEvents({
        database,
        user,
        setPrivateEvents, // Asegúrate de pasar esta función si la necesitas
      }),
    ]);
  } catch (error) {
    console.error("❌ [fetchData] error:", error);
  } finally {
    const dt = Date.now() - t0;
    console.log(`⏱ [fetchData] fin → ${dt} ms`);
    setLoading(false);
  }
};


export const fetchProfileImage = async ({setProfileImage}) => {
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



export const checkNotificationsSeenStatus = async (setNotificationIconState) => {
if (auth.currentUser) {
  const user = auth.currentUser;
  const notificationsRef = collection(database, "users", user.uid, "notifications");
  const q = query(notificationsRef, where("seen", "==", false));
  const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
  const friendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));

  const notificationsSnapshot = await getDocs(q);
  const friendRequestsSnapshot = await getDocs(friendRequestsQuery);

  if (!notificationsSnapshot.empty || !friendRequestsSnapshot.empty) {
    setNotificationIconState(true);
  } else {
    setNotificationIconState(false);
  }
}
};


// Escucha cambios en notificaciones y solicitudes de amistad no vistas
export const listenForNotificationChanges = (setNotificationIconState) => {
  if (auth.currentUser) {
    const user = auth.currentUser;
    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const q = query(notificationsRef, where("seen", "==", false));

    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
    const friendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));

    const unsubscribeNotifications = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setNotificationIconState(true);
      } else {
        setNotificationIconState(false);
      }
    });

    const unsubscribeFriendRequests = onSnapshot(friendRequestsQuery, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setNotificationIconState(true);
      } else {
        setNotificationIconState(false);
      }
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeFriendRequests();
    };
  }
};


export const fetchBoxData = async ({
  database,
  storage,
  boxInfo,
  user,
  setBoxData,
  selectedDate,
  selectedCity,
}) => {
  const t0 = Date.now();
  let storageCalls = 0;
  let firestoreDocs = 0;
  console.log("⏱ [fetchBoxData] inicio");

  try {
    let blockedUsers = [];
    let userNearestCity = "";

    // Obtener datos del usuario si existe
    if (user) {
      const userDoc = await getDoc(doc(database, "users", user.uid));
      firestoreDocs++;
      
      if (userDoc.exists()) {
        blockedUsers = userDoc.data()?.blockedUsers || [];
        userNearestCity = userDoc.data()?.nearestCity || "";
      }
    }

    // 1. Filtrado inicial de eventos no válidos (como en la segunda versión)
    const validEvents = boxInfo.filter((event) => {
      // 1) fecha
      if (event.availableDates && !event.availableDates.includes(selectedDate))
          return false;
    
      // 2) ciudad elegida
      if (
        selectedCity &&
        selectedCity !== "All Cities" &&
        event.city &&
        event.city !== selectedCity
      )
          return false;
    
      return true;
    });
    

    // 2. Procesamiento de eventos con manejo granular de errores (segunda versión mejorada)
    const boxEvents = await Promise.all(
      validEvents.map(async (box) => {
        const {
          path,
          title,
          category,
          hours,
          number,
          coordinates,
          country,
          city,
          priority,
          details,
          membersClub,
        } = box;

        let url = path;
        
        // Manejo de imágenes con try-catch específico
        if (typeof path === "string") {
          try {
            const storageRef = ref(storage, path);
            url = await getDownloadURL(storageRef);
            storageCalls++;
          } catch (error) {
            console.warn(`⚠️ No se pudo cargar la imagen de ${title}:`, error);
            url = null; // O podrías usar una imagen por defecto
          }
        }

        // Obtener asistentes con manejo de errores
        let attendees = [];
        try {
          const boxRef = doc(database, "GoBoxs", title);
          const boxDoc = await getDoc(boxRef);
          firestoreDocs++;
          
          if (boxDoc.exists()) {
            const rawAttendees = boxDoc.data()[selectedDate];
            attendees = Array.isArray(rawAttendees) ? rawAttendees : [];
          }
        } catch (err) {
          console.warn(`⚠️ No se pudo obtener GoBox ${title}:`, err);
        }

        // Filtrar usuarios bloqueados
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
          details,
          attendees: filteredAttendees,
          attendeesCount: filteredAttendees.length,
          priority: priority || false,
          membersClub: membersClub || false,
          selectedCity, 
        };
      })
    );

    // 3. Procesamiento de eventos privados (de la primera versión, mejorado)
    const userEvents = [];
    if (user) {
      try {
        const privateEventsRef = collection(database, "EventsPriv");
        const eventsQuery = query(privateEventsRef);
        const querySnapshot = await getDocs(eventsQuery);
        firestoreDocs++;

        const processedEventIds = new Set();

        querySnapshot.forEach((doc) => {
          const eventData = doc.data();
          const eventId = doc.id;

          // Verificar si el usuario tiene acceso al evento
          const isAdmin = eventData.Admin === user.uid;
          const isAttendee = eventData.attendees?.some(attendee => attendee.uid === user.uid);
          const isSameCity = !eventData.city || eventData.city === selectedCity;

          if ((isAdmin || isAttendee) && isSameCity && !processedEventIds.has(eventId)) {
            processedEventIds.add(eventId);

            const filteredAttendees = (eventData.attendees || []).filter(
              (attendee) => !blockedUsers.includes(attendee.uid)
            );

            userEvents.push({
              id: eventId,
              imageUrl: eventData.image,
              title: eventData.title,
              category: "EventoParaAmigos",
              hours: { [eventData.day]: eventData.hour },
              number: eventData.phoneNumber,
              coordinates: eventData.coordinates || { latitude: 0, longitude: 0 },
              country: eventData.nearestCountry || "España",
              city: userNearestCity,
              date: eventData.date,
              attendees: filteredAttendees,
              attendeesCount: filteredAttendees.length,
              isPrivateEvent: true,
              Admin: eventData.Admin
            });
          }
        });
      } catch (err) {
        console.error("❌ Error al obtener eventos privados:", err);
      }
    }

    // 4. Combinar y ordenar resultados (de la primera versión, mejorado)
    const allEvents = [...userEvents, ...boxEvents.filter(Boolean)].sort((a, b) => {
      // Priorizar eventos privados
      if (a.isPrivateEvent && !b.isPrivateEvent) return -1;
      if (!a.isPrivateEvent && b.isPrivateEvent) return 1;
      
      // Priorizar eventos con flag priority
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      
      // Ordenar por número de asistentes (descendente)
      return b.attendeesCount - a.attendeesCount;
    });

    setBoxData(allEvents);
  } catch (err) {
    console.error("❌ [fetchBoxData] error general:", err);
  } finally {
    const dt = Date.now() - t0;
    console.log(
      `⏱ [fetchBoxData] fin → ${dt} ms · storage=${storageCalls} · docs=${firestoreDocs}`
    );
  }
};

export const fetchPrivateEvents = async ({ database, user, setPrivateEvents }) => {
  const t0 = Date.now();
  let firestoreDocs = 0;
  console.log("⏱ [fetchPrivateEvents] inicio");
  if (!user) return;

  try {
    let blockedUsers = [];
    const userDoc = await getDoc(doc(database, "users", user.uid));
    if (userDoc.exists()) {
      blockedUsers = userDoc.data()?.blockedUsers || [];
    }

    const eventsRef = collection(database, "users", user.uid, "events");
    const eventsSnapshot = await getDocs(eventsRef);
    const events = [];

    for (const docSnapshot of eventsSnapshot.docs) {
      const eventData = docSnapshot.data();

      if (eventData.status === "accepted" && eventData.uid !== user.uid) {
        const eventPrivRef = doc(database, "EventsPriv", eventData.eventId);
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

    if (typeof setPrivateEvents === "function") {
      setPrivateEvents(events);
    } else {
      console.error("setPrivateEvents is not a function");
    }
  } catch (error) {
    console.error("Error fetching private events:", error);
  }
};

export const getFilteredBoxData = (boxData, selectedCity, selectedCategory, t, selectedDate) => {
  if (!boxData || !Array.isArray(boxData)) {
    return [];
  }

  // Filtrado inicial según ciudad
  let filteredData = boxData;
  if (selectedCity && selectedCity !== "All Cities") {
    filteredData = filteredData.filter((box) => box.city === selectedCity);
  }

  // Filtrar eventos especiales según la fecha seleccionada
  filteredData = filteredData.filter(box => {
    if (box.category === "Events") {
      return box.availableDates && box.availableDates.includes(selectedDate);
    }
    return true;
  });

  // Filtrado adicional según categoría, ignorando la opción "Todos"
  if (selectedCategory && selectedCategory !== t("categories.all")) {
    if (selectedCategory === "Festivities") {
      // Si se selecciona "Festivities", se muestran también los eventos para amigos
      filteredData = filteredData.filter((box) =>
        box.category === "Festivities" || box.category === "EventoParaAmigos"
      );
    } else {
      filteredData = filteredData.filter((box) => {
        if (Array.isArray(box.category)) {
          return box.category.includes(selectedCategory);
        }
        return box.category === selectedCategory;
      });
      
    }
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
};

import { collection, doc, getDoc, onSnapshot, query, where, getDocs  } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { auth, database, } from "../../config/firebase";
import { signOut } from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import * as Location from "expo-location";

export const onSignOut = async (navigation, auth) => {
  try {
    await signOut(auth); // Cierra la sesión de Firebase
    await SecureStore.deleteItemAsync("session_token"); // Elimina el token de sesión
    console.log("Sign-out successful and session token cleared.");
    navigation.navigate("Login");
  } catch (error) {
    console.log("Sign-out error:", error);
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

export const fetchUnreadNotifications = async ({ setUnreadNotifications }) => {
  if (auth.currentUser) {
    const user = auth.currentUser;
    console.log("Usuario autenticado:", user.uid); // Log del usuario autenticado
    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const q = query(notificationsRef, where("seen", "==", false));
    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
    const friendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));

    const unsubscribeNotifications = onSnapshot(q, (querySnapshot) => {
      console.log("fetchUnreadNotifications - Notificaciones no vistas:", !querySnapshot.empty);
      if (!querySnapshot.empty) {
        setUnreadNotifications(true);
      } else {
        setUnreadNotifications(false);
      }
    });

    const unsubscribeFriendRequests = onSnapshot(friendRequestsQuery, (querySnapshot) => {
      console.log("fetchUnreadNotifications - Solicitudes de amistad no vistas:", !querySnapshot.empty);
      if (!querySnapshot.empty) {
        setUnreadNotifications(true);
      } else {
        setUnreadNotifications(false);
      }
    });

    return () => {
      console.log("Limpiando suscripciones a onSnapshot");
      unsubscribeNotifications();
      unsubscribeFriendRequests();
    };
  }

  console.warn("fetchUnreadNotifications - Usuario no autenticado");
  return () => {}; // Return a no-op function if auth.currentUser is not set
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
}) => {
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
      }),
      fetchPrivateEvents({
        database,
        user,
        setPrivateEvents, // Asegúrate de pasar esta función si la necesitas
      }),
    ]);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
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

export const fetchUnreadMessages = ({ setUnreadMessages }) => {
  const user = auth.currentUser;
  if (!user) return;

  const userDocRef = doc(database, "users", user.uid);

  // Escucha los cambios en el documento del usuario
  const unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
    if (!userDoc.exists()) {
      console.error("El documento del usuario no existe.");
      setUnreadMessages(false);
      return;
    }

    const userData = userDoc.data();
    const mutedChats = userData.mutedChats || [];

    const chatsRef = collection(database, "chats");
    const chatsQuery = query(chatsRef, where("participants", "array-contains", user.uid));

    // Recupera todos los chats y verifica mensajes no leídos
    const unsubscribeChats = onSnapshot(chatsQuery, async (querySnapshot) => {
      const chats = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      // Filtra los chats no muteados
      const activeChats = chats.filter((chat) => 
        !mutedChats.some((mutedChat) => mutedChat.chatId === chat.id)
      );

      // Comprueba si hay mensajes no leídos en los chats activos
      let hasUnreadMessages = false;

      for (const chat of activeChats) {
        const messagesRef = collection(database, "chats", chat.id, "messages");
        const unseenMessagesQuery = query(
          messagesRef,
          where("seen", "==", false),
          where("senderId", "!=", user.uid)
        );

        const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);
        if (!unseenMessagesSnapshot.empty) {
          hasUnreadMessages = true;
          break;
        }
      }

      setUnreadMessages(hasUnreadMessages);
    });

    return () => {
      unsubscribeChats();
    };
  });

  return () => {
    unsubscribeUser();
  };
};



// Verifica si hay notificaciones o solicitudes de amistad no vistas
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


export const fetchBoxData = async ({ database, storage, boxInfo, user, setBoxData, selectedDate }) => {
  try {
    let blockedUsers = [];
    if (user) {
      const userDoc = await getDoc(doc(database, "users", user.uid));
      if (userDoc.exists()) {
        blockedUsers = userDoc.data()?.blockedUsers || [];
      }
    }

    const data = await Promise.all(
      boxInfo.map(
        async ({ path, title, category, hours, number, coordinates, country, city }) => {
          let url = path;

          if (typeof path === "string") {
            const storageRef = ref(storage, path);
            url = await getDownloadURL(storageRef);
          }

          const boxRef = doc(database, "GoBoxs", title);
          const boxDoc = await getDoc(boxRef);
          let attendees = [];

          if (boxDoc.exists()) {
            attendees = Array.isArray(boxDoc.data()[selectedDate])
              ? boxDoc.data()[selectedDate]
              : [];
          }

          // Filter out blocked attendees
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
      const adminEventsQuery = query(privateEventsRef, where("Admin", "==", user.uid));
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
    console.error("Error fetching box data:", error);
  }
};

export const fetchPrivateEvents = async ({ database, user, setPrivateEvents }) => {
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

export const getFilteredBoxData = (boxData, selectedCity, selectedCategory, t) => {
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
};




































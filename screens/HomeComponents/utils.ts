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
    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const q = query(notificationsRef, where("seen", "==", false));
    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
    const friendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));

    const unsubscribeNotifications = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setUnreadNotifications(true);
      } else {
        setUnreadNotifications(false);
      }
    });

    const unsubscribeFriendRequests = onSnapshot(friendRequestsQuery, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setUnreadNotifications(true);
      } else {
        setUnreadNotifications(false);
      }
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeFriendRequests();
    };
  }
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
  setPrivateEvents,
  selectedDate 
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
  const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
    if (!userDoc.exists()) {
      console.error("El documento del usuario no existe.");
      setUnreadMessages(false);
      return;
    }

    const userData = userDoc.data();
    const mutedChats = userData.mutedChats || [];

    const chatsRef = collection(database, "chats");
    const chatsQuery = query(chatsRef, where("participants", "array-contains", user.uid));
    const unsubscribeChats = onSnapshot(chatsQuery, (querySnapshot) => {
      let hasUnreadMessages = false;

      querySnapshot.forEach((chatDoc) => {
        const chatId = chatDoc.id;

        const isMuted = mutedChats.some((mutedChat) => mutedChat.chatId === chatId);
        if (isMuted) return;

        const messagesRef = collection(database, "chats", chatId, "messages");
        const unseenMessagesQuery = query(
          messagesRef,
          where("seen", "==", false),
          where("senderId", "!=", user.uid)
        );

        onSnapshot(unseenMessagesQuery, (unseenMessagesSnapshot) => {
          if (!unseenMessagesSnapshot.empty) {
            hasUnreadMessages = true;
            setUnreadMessages(true);
          } else if (!hasUnreadMessages) {
            setUnreadMessages(false);
          }
        });
      });

      if (!hasUnreadMessages) {
        setUnreadMessages(false);
      }
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


































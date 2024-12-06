import { collection, doc, getDoc, onSnapshot, query, where, getDocs, } from "firebase/firestore";
import { auth, database } from "../../config/firebase";
import { View, TouchableOpacity } from "react-native";
import { storage } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";
import CalendarPicker from "../../screens/CalendarPicker";

import * as Location from "expo-location";


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

export const fetchBoxData = async ({
  selectedDate,
  setBoxData,
  boxInfo,
  blockedUsers = [],
}: {
  selectedDate: string;
  setBoxData: (data: any[]) => void;
  boxInfo: any[];
  blockedUsers?: string[];
}) => {
  try {
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
            attendees = Array.isArray(boxDoc.data()[selectedDate])
              ? boxDoc.data()[selectedDate]
              : [];
          }

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

    setBoxData(data.sort((a, b) => b.attendeesCount - a.attendeesCount));
  } catch (error) {
    console.error("Error fetching box data:", error);
  }
};

export const fetchPrivateEvents = async ({
  userId,
  setPrivateEvents,
  blockedUsers = [],
}: {
  userId: string;
  setPrivateEvents: (events: any[]) => void;
  blockedUsers?: string[];
}) => {
  try {
    const eventsRef = collection(database, "users", userId, "events");
    const eventsSnapshot = await getDocs(eventsRef);
    const events = [];

    for (const docSnapshot of eventsSnapshot.docs) {
      const eventData = docSnapshot.data();

      if (eventData.status === "accepted" && eventData.uid !== userId) {
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

    setPrivateEvents(events);
  } catch (error) {
    console.error("Error fetching private events:", error);
  }
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

export const fetchData = async ({setLoading, fetchBoxData, fetchPrivateEvents }) => {
    try {
      setLoading(true);
      await Promise.all([fetchBoxData(), fetchPrivateEvents()]);
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
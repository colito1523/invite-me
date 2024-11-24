import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Button,
} from "react-native";
import { Image } from "expo-image";
import { database, auth } from "../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
  setDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { format, isToday, isYesterday } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import boxInfo from "../src/data/boxInfo";

export default function NotificationsComponent() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingEventId, setLoadingEventId] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: isNightMode ? "#1a1a1a" : "#fff",
        },
        headerTintColor: isNightMode ? "#fff" : "#000",
        headerTitleStyle: {
          color: isNightMode ? "#fff" : "#000",
          fontSize: 19,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginLeft: 15 }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={isNightMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        ),
      });
    }, [isNightMode, navigation])
  );

  const fetchNotifications = useCallback(async () => {
    if (user) {
      const userRef = doc(database, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const hiddenNotifications = userDoc.data()?.hiddenNotifications || [];
      const blockedUsers = userDoc.data()?.blockedUsers || [];

      const notificationsRef = collection(
        database,
        "users",
        user.uid,
        "notifications"
      );
      const friendRequestsRef = collection(
        database,
        "users",
        user.uid,
        "friendRequests"
      );

      const notificationsQuery = query(notificationsRef);
      const friendRequestsQuery = query(
        friendRequestsRef,
        where("status", "==", "pending")
      );

      const unsubscribeNotifications = onSnapshot(
        notificationsQuery,
        (querySnapshot) => {
          const notifList = querySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              type: doc.data().type || "notification",
            }))
            .filter(
              (notif) =>
                !hiddenNotifications.includes(notif.id) &&
                !blockedUsers.includes(notif.fromId) // Excluir notificaciones de usuarios bloqueados
            );
          updateNotifications(notifList);
        }
      );

      const unsubscribeFriendRequests = onSnapshot(
        friendRequestsQuery,
        (querySnapshot) => {
          const requestList = querySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              type: "friendRequest",
            }))
            .filter(
              (notif) =>
                !hiddenNotifications.includes(notif.id) &&
                !blockedUsers.includes(notif.fromId) // Excluir solicitudes de usuarios bloqueados
            );
          updateNotifications(requestList);
        }
      );

      setIsLoading(false);

      return () => {
        unsubscribeNotifications();
        unsubscribeFriendRequests();
      };
    }
  }, [user]);

  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que deseas ocultar esta notificación?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Ocultar",
          style: "destructive",
          onPress: async () => {
            try {
              const userRef = doc(database, "users", auth.currentUser.uid);
              await updateDoc(userRef, {
                hiddenNotifications: arrayUnion(notificationId),
              });
              setNotifications((prevNotifications) =>
                prevNotifications.filter((notif) => notif.id !== notificationId)
              );
              Alert.alert(
                "Notificación oculta",
                "La notificación ha sido oculta."
              );
            } catch (error) {
              console.error("Error al ocultar la notificación:", error);
              Alert.alert(
                "Error",
                "No se pudo ocultar la notificación. Inténtalo de nuevo."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    const unsubscribe = fetchNotifications();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const updateNotifications = (newNotifications) => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = [...prevNotifications];
      newNotifications.forEach((newNotif) => {
        const index = updatedNotifications.findIndex(
          (n) => n.id === newNotif.id
        );
        if (index !== -1) {
          updatedNotifications[index] = {
            ...updatedNotifications[index],
            ...newNotif,
          };
        } else {
          updatedNotifications.push(newNotif);
        }
      });
      return updatedNotifications.sort((a, b) => b.timestamp - a.timestamp);
    });
  };

  const handleUserPress = async (uid) => {
    try {
      const userDoc = await getDoc(
        doc(database, "users", auth.currentUser.uid)
      );
      const blockedUsers = userDoc.data()?.blockedUsers || [];

      if (blockedUsers.includes(uid)) {
        Alert.alert("Error", "No puedes interactuar con este usuario.");
        return;
      }

      const selectedUserDoc = await getDoc(doc(database, "users", uid));
      if (selectedUserDoc.exists()) {
        const selectedUserData = selectedUserDoc.data();
        selectedUserData.id = uid;
        selectedUserData.profileImage =
          selectedUserData.photoUrls && selectedUserData.photoUrls.length > 0
            ? selectedUserData.photoUrls[0]
            : "https://via.placeholder.com/150";
        navigation.navigate("UserProfile", { selectedUser: selectedUserData });
      } else {
        Alert.alert(
          t("notifications.error"),
          t("notifications.userDetailsNotFound")
        );
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert(
        t("notifications.error"),
        t("notifications.userDetailsFetchError")
      );
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      const user = auth.currentUser;
      const userFriendsRef = collection(database, "users", user.uid, "friends");
      const senderFriendsRef = collection(
        database,
        "users",
        request.fromId,
        "friends"
      );

      const friendImage =
        request.fromImage || "https://via.placeholder.com/150";

      await addDoc(userFriendsRef, {
        friendId: request.fromId,
        friendName: request.fromName,
        friendImage: friendImage,
      });

      const userDoc = await getDoc(doc(database, "users", user.uid));
      const userData = userDoc.data();
      const profileImage =
        userData.photoUrls && userData.photoUrls.length > 0
          ? userData.photoUrls[0]
          : "https://via.placeholder.com/150";

      await addDoc(senderFriendsRef, {
        friendId: user.uid,
        friendName: userData.firstName,
        friendImage: profileImage,
      });

      const requestRef = doc(
        database,
        "users",
        user.uid,
        "friendRequests",
        request.id
      );
      await updateDoc(requestRef, { status: "accepted" });

      const senderNotificationsRef = collection(
        database,
        "users",
        request.fromId,
        "notifications"
      );

      await addDoc(senderNotificationsRef, {
        type: "friendRequestResponse",
        response: "accepted",
        fromId: user.uid,
        fromName: userData.firstName,
        fromImage: profileImage,
        message: t("notifications.friendRequestAccepted", {
          name: userData.firstName,
        }),
        timestamp: new Date(),
      });

      const userNotificationsRef = doc(
        database,
        "users",
        user.uid,
        "notifications",
        request.id
      );
      await setDoc(userNotificationsRef, {
        type: "friendRequestResponse",
        response: "accepted",
        fromId: request.fromId,
        fromName: request.fromName,
        fromImage: request.fromImage,
        message: t("notifications.youAreNowFriends", {
          name: request.fromName,
        }),
        timestamp: new Date(),
      });

      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === request.id
            ? {
                ...notif,
                status: "accepted",
                type: "friendRequestResponse",
                response: "accepted",
              }
            : notif
        )
      );

      setTimeout(() => {
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notif) => notif.id !== request.id)
        );
      }, 5000);
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert(
        t("notifications.error"),
        t("notifications.acceptRequestError")
      );
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      const user = auth.currentUser;
      const requestRef = doc(
        database,
        "users",
        user.uid,
        "friendRequests",
        request.id
      );
      await deleteDoc(requestRef);

      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === request.id
            ? {
                ...notif,
                status: "rejected",
                type: "friendRequestResponse",
                response: "rejected",
              }
            : notif
        )
      );

      setTimeout(() => {
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notif) => notif.id !== request.id)
        );
      }, 5000);
    } catch (error) {
      console.error("Error rejecting request:", error);
      Alert.alert(
        t("notifications.error"),
        t("notifications.rejectRequestError")
      );
    }
  };

  const handleAcceptEventInvitation = async (notif) => {
    const userDoc = await getDoc(doc(database, "users", auth.currentUser.uid));
    const blockedUsers = userDoc.data()?.blockedUsers || [];

    if (blockedUsers.includes(notif.fromId)) {
      Alert.alert("Error", "No puedes aceptar invitaciones de este usuario.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert(t("notifications.error"), t("notifications.userAuthError"));
      return;
    }

    const notifRef = doc(
      database,
      "users",
      user.uid,
      "notifications",
      notif.id
    );
    const eventsRef = collection(database, "users", user.uid, "events");
    const eventRef = doc(database, "EventsPriv", notif.eventId);

    try {
      // 1. Get event data from `EventsPriv`
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) {
        console.error("Event not found in EventsPriv");
        Alert.alert(t("notifications.error"), t("notifications.eventNotFound"));
        return;
      }

      const eventData = eventDoc.data();

      // 2. Add the event to the user's `events` collection
      await addDoc(eventsRef, {
        title: eventData.title,
        imageUrl: eventData.image,
        date: eventData.date,
        status: "accepted",
        isPrivate: true,
        eventId: notif.eventId,
        category: eventData.category,
      });

      // 3. Get updated user data
      const userDoc = await getDoc(doc(database, "users", user.uid));
      const userData = userDoc.data();

      // 4. Add the user to the `attendees` list in `EventsPriv`
      await updateDoc(eventRef, {
        attendees: arrayUnion({
          uid: user.uid,
          username: userData.username || user.displayName,
          profileImage:
            userData.photoUrls && userData.photoUrls.length > 0
              ? userData.photoUrls[0]
              : "https://via.placeholder.com/150",
        }),
      });

      // 5. Update the notification status
      await updateDoc(notifRef, {
        status: "accepted",
        message: t("notifications.acceptedInvitation", {
          name: notif.fromName,
        }),
      });

      // Update local notification state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notif.id
            ? {
                ...n,
                status: "accepted",
                message: t("notifications.acceptedInvitation", {
                  name: notif.fromName,
                }),
              }
            : n
        )
      );

      Alert.alert(
        t("notifications.invitationAccepted"),
        t("notifications.eventAddedToProfile")
      );
    } catch (error) {
      console.error("Error accepting invitation:", error);
      Alert.alert(
        t("notifications.error"),
        t("notifications.acceptInvitationError")
      );
    }
  };

  const handleRejectEventInvitation = async (notif) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(t("notifications.error"), t("notifications.userAuthError"));
        return;
      }
  
      // Verificar si el remitente de la invitación está bloqueado
      const userDoc = await getDoc(doc(database, "users", user.uid));
      const blockedUsers = userDoc.data()?.blockedUsers || [];
  
      if (blockedUsers.includes(notif.fromId)) {
        Alert.alert(
          "Error",
          "No puedes rechazar invitaciones de este usuario bloqueado."
        );
        return;
      }
  
      // Referencia a la notificación
      const notifRef = doc(
        database,
        "users",
        user.uid,
        "notifications",
        notif.id
      );
  
      // Remover el UID del usuario de invitedFriends en EventsPriv
      if (notif.eventId) {
        const eventRef = doc(database, "EventsPriv", notif.eventId);
        const eventDoc = await getDoc(eventRef);
  
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          const updatedInvitedFriends = (eventData.invitedFriends || []).filter(
            (uid) => uid !== user.uid
          );
  
          await updateDoc(eventRef, { invitedFriends: updatedInvitedFriends });
        }
      }
  
      // Remover la invitación de GoBoxs
      if (notif.eventTitle) {
        const goBoxRef = doc(database, "GoBoxs", notif.eventTitle);
        const goBoxDoc = await getDoc(goBoxRef);
  
        if (goBoxDoc.exists()) {
          const goBoxData = goBoxDoc.data();
          const updatedInvitations = (goBoxData[notif.eventDate] || []).map((entry) => {
            if (entry.uid === notif.fromId) {
              return {
                ...entry,
                invitations: (entry.invitations || []).filter(
                  (inv) => inv.invitedTo !== user.uid
                ),
              };
            }
            return entry;
          });
  
          await updateDoc(goBoxRef, {
            [notif.eventDate]: updatedInvitations,
          });
        }
      }
  
      // Eliminar la notificación de Firestore
      await deleteDoc(notifRef);
  
      // Remover la notificación del estado local
      setNotifications((prevNotifications) =>
        prevNotifications.filter((n) => n.id !== notif.id)
      );
  
      Alert.alert(
        t("notifications.invitationRejected"),
        t("notifications.eventInvitationRejected")
      );
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      Alert.alert(
        t("notifications.error"),
        t("notifications.rejectInvitationError")
      );
    }
  };

  const handleGeneralEventInvite = async (friendId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Referencia al evento general
      const eventRef = doc(database, "GoBoxs", box.title);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        Alert.alert("Error", "El evento no existe.");
        return;
      }

      // Datos del evento
      const eventData = eventDoc.data();
      const eventImage =
        box.imageUrl || eventData.image || "https://via.placeholder.com/150";
      const eventDate = selectedDate || eventData.date || "Fecha no disponible";
      const eventTitle = box.title || "Evento General";

      // Enviar notificación al amigo invitado
      const notificationRef = collection(
        database,
        "users",
        friendId,
        "notifications"
      );
      await addDoc(notificationRef, {
        fromId: user.uid,
        fromName: user.displayName || "Usuario Desconocido",
        eventTitle: eventTitle,
        eventImage: eventImage, // Asegurarse de que sea un enlace válido
        eventDate: eventDate,
        type: "generalEventInvitation",
        status: "pendiente",
        timestamp: new Date(),
      });

      Alert.alert(
        "Invitación enviada",
        `Has invitado a un amigo al evento ${eventTitle}.`
      );
    } catch (error) {
      console.error("Error al invitar al evento general:", error);
      Alert.alert("Error", "No se pudo enviar la invitación.");
    }
  };

  const handleAcceptPrivateEvent = async (item) => {
    try {
      setLoadingEventId(item.id);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(t("notifications.error"), t("notifications.userAuthError"));
        setLoadingEventId(null);
        return;
      }
  
      // Get user data
      const userDoc = await getDoc(doc(database, "users", user.uid));
      const userData = userDoc.data();
  
      // Check if user is already an attendee
      const eventRef = doc(database, "EventsPriv", item.eventId);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const attendees = eventData.attendees || [];
        const isAlreadyAttendee = attendees.some(
          (attendee) => attendee.uid === user.uid
        );
  
        if (isAlreadyAttendee) {
          Alert.alert(
            t("notifications.alreadyParticipant"),
            t("notifications.alreadyInEvent")
          );
          setLoadingEventId(null);
          return;
        }
  
        // Add user to attendees
        await updateDoc(eventRef, {
          attendees: arrayUnion({
            uid: user.uid,
            username: userData.username || user.displayName,
            profileImage: userData.photoUrls && userData.photoUrls.length > 0
              ? userData.photoUrls[0]
              : "https://via.placeholder.com/150",
          }),
        });
  
        // Add event data to user's database
        const userEventsRef = collection(database, "users", user.uid, "events");
        await addDoc(userEventsRef, {
          title: eventData.title,
          imageUrl: eventData.image,
          date: eventData.date,
          address: eventData.address,
          category: eventData.category,
          day: eventData.day,
          description: eventData.description,
          eventId: eventData.eventId,
          expirationDate: eventData.expirationDate,
          hour: eventData.hour,
          status: "accepted",
        });
      }
  
      // Delete the notification from the database
      const notifRef = doc(database, "users", user.uid, "notifications", item.id);
      await deleteDoc(notifRef);
  
      // Update local notification state
      setNotifications((prevNotifications) =>
        prevNotifications.filter((n) => n.id !== item.id)
      );
  
      Alert.alert(
        t("notifications.invitationAccepted"),
        t("notifications.eventAddedToProfile")
      );
    } catch (error) {
      console.error("Error accepting private event invitation:", error);
      Alert.alert(
        t("notifications.error"),
        t("notifications.acceptInvitationError")
      );
    } finally {
      setLoadingEventId(null);
    }
  };

  const handleRejectPrivateEvent = async (item) => {
    try {
      // Eliminar la notificación
      const notificationRef = doc(database, "users", auth.currentUser.uid, "notifications", item.id);
      await deleteDoc(notificationRef);
  
      // Eliminar el valor del array invitedFriends en /EventsPriv/{eventId}
      const eventRef = doc(database, "EventsPriv", item.eventId);
      await updateDoc(eventRef, {
        invitedFriends: arrayRemove(auth.currentUser.uid)
      });
  
      // Remover la notificación del estado local
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notif) => notif.id !== item.id)
      );
  
      Alert.alert("Rechazado", "Has rechazado la invitación al evento privado.");
    } catch (error) {
      console.error("Error al rechazar la invitación al evento privado:", error);
      Alert.alert("Error", "No se pudo rechazar la invitación.");
    }
  };

  const handleAcceptGeneralEvent = async (item) => {
    try {
      setLoadingEventId(item.id);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(t("notifications.error"), t("notifications.userAuthError"));
        setLoadingEventId(null);
        return;
      }
  
      // Get user data
      const userDoc = await getDoc(doc(database, "users", user.uid));
      const userData = userDoc.data();
  
      // Check if user is already a participant
      const eventRef = doc(database, "GoBoxs", item.eventTitle);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const participants = eventData[item.eventDate] || [];
        const isAlreadyParticipant = participants.some(
          (participant) => participant.uid === user.uid
        );
  
        if (isAlreadyParticipant) {
          Alert.alert(
            t("notifications.alreadyParticipant"),
            t("notifications.alreadyInEvent")
          );
          setLoadingEventId(null);
          return;
        }
  
        // Add user as participant
        const updatedParticipants = participants.concat({
          uid: user.uid,
          username: userData.username || user.displayName,
          profileImage: userData.photoUrls && userData.photoUrls.length > 0
            ? userData.photoUrls[0]
            : "https://via.placeholder.com/150",
        });
  
        await updateDoc(eventRef, {
          [item.eventDate]: updatedParticipants,
        });
  
        // Add event data to user's database
        const userEventsRef = collection(database, "users", user.uid, "events");
        await addDoc(userEventsRef, {
          title: eventData.title || item.eventTitle,
          imageUrl: eventData.imageUrl || item.eventImage,
          date: item.eventDate,
          coordinates: eventData.coordinates || {},
          dateArray: eventData.dateArray || [],
          hours: eventData.hours || {},
          locationLink: eventData.locationLink || "Sin ubicación especificada",
          phoneNumber: eventData.phoneNumber || "",
          status: "accepted",
        });
      }
  
      // Delete the notification from the database
      const notifRef = doc(database, "users", user.uid, "notifications", item.id);
      await deleteDoc(notifRef);
  
      // Update local notification state
      setNotifications((prevNotifications) =>
        prevNotifications.filter((n) => n.id !== item.id)
      );
  
      Alert.alert(
        t("notifications.invitationAccepted"),
        t("notifications.eventAddedToProfile")
      );
    } catch (error) {
      console.error("Error accepting general event invitation:", error);
      Alert.alert(
        t("notifications.error"),
        t("notifications.acceptInvitationError")
      );
    } finally {
      setLoadingEventId(null);
    }
  };
  

  const handleRejectGeneralEvent = async (item) => {
    try {
      // Eliminar la notificación
      const notificationRef = doc(database, "users", auth.currentUser.uid, "notifications", item.id);
      await deleteDoc(notificationRef);
  
      // Eliminar los datos del array invitations en /GoBoxs/{eventTitle}
      const eventRef = doc(database, "GoBoxs", item.eventTitle);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const updatedInvitations = (eventData[item.eventDate] || []).map((entry) => {
          if (entry.uid === item.fromId) {
            return {
              ...entry,
              invitations: (entry.invitations || []).filter(
                (inv) => inv.invitedTo !== auth.currentUser.uid
              ),
            };
          }
          return entry;
        });
  
        await updateDoc(eventRef, {
          [item.eventDate]: updatedInvitations,
        });
      }
  
      // Remover la notificación del estado local
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notif) => notif.id !== item.id)
      );
  
      Alert.alert("Rechazado", "Has rechazado la invitación al evento general.");
    } catch (error) {
      console.error("Error al rechazar la invitación al evento general:", error);
      Alert.alert("Error", "No se pudo rechazar la invitación.");
    }
  };

  const renderPrivateEventNotification = ({ item }) => {
    const eventDate = item.date; // Use the date field instead of timestamp
    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("BoxDetails", {
            box: {
              title: item.eventTitle,
              imageUrl: item.eventImage,
              date: eventDate,
              isPrivate: true,
            },
            selectedDate: eventDate,
            isFromNotification: true,
          });
        }}
        style={[styles.notificationContainer]}
      >
        <View style={styles.notificationContent}>
          <Image
            source={{ uri: item.fromImage }}
            style={styles.profileImage}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.notificationText, { color: isNightMode ? "#fff" : "#000" }]}>
              <Text style={[styles.boldText]}>{item.fromName}</Text> te ha invitado a{" "}
              <Text style={[styles.boldText]}>{item.eventTitle}</Text> el día{" "}
              <Text style={[styles.boldText]}>{eventDate}</Text>
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAcceptPrivateEvent(item)}
                disabled={loadingEventId === item.id}
              >
                {loadingEventId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Aceptar</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleRejectPrivateEvent(item)}
              >
                <Text style={styles.buttonText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGeneralEventNotification = ({ item }) => {
    const eventDate = typeof item.eventDate === 'object' && item.eventDate.seconds
      ? new Date(item.eventDate.seconds * 1000).toLocaleString()
      : item.eventDate; // Convert timestamp to string if necessary
    const matchedBox = boxInfo.find((box) => box.title === item.eventTitle);
    const eventImage = matchedBox ? matchedBox.path : "https://via.placeholder.com/150";
    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("BoxDetails", {
            box: {
              title: item.eventTitle,
              imageUrl: eventImage,
              date: eventDate,
              isPrivate: false,
            },
            selectedDate: eventDate,
            isFromNotification: true,
          });
        }}
        style={[styles.notificationContainer]}
      >
        <View style={styles.notificationContent}>
          <Image
            source={{ uri: item.fromImage }}
            style={styles.profileImage}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.notificationText, { color: isNightMode ? "#fff" : "#000" }]}>
              <Text style={[styles.boldText]}>{item.fromName}</Text> te ha invitado a{" "}
              <Text style={[styles.boldText]}>{item.eventTitle}</Text> el día{" "}
              <Text style={[styles.boldText]}>{eventDate}</Text>
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAcceptGeneralEvent(item)}
                disabled={loadingEventId === item.id}
              >
                {loadingEventId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Aceptar</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleRejectGeneralEvent(item)}
              >
                <Text style={styles.buttonText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotificationItem = ({ item }) => {
    if (item.type === "generalEventInvitation") {
      return renderGeneralEventNotification({ item });
    }
  
    if (item.type === "invitation") {
      return renderPrivateEventNotification({ item });
    }
  
    return null;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size={50} color="black" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={isNightMode ? ["#1a1a1a", "#000"] : ["#fff", "#f0f0f0"]}
        style={styles.container}
      >
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["black"]}
              tintColor="black"
            />
          }
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  notificationContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#ccc",
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 10,
  },
  acceptButton: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  rejectButton: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  buttonText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  notificationImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  eventDateText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 10,
  },
  button: {
    backgroundColor: "#d3d3d3",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
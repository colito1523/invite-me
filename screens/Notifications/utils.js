import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";
import { auth, database } from "../../config/firebase";


export const markNotificationsAsSeen = async (params) => {
  const { user, database } = params;

  if (user) {
    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const unseenQuery = query(notificationsRef, where("seen", "==", false));
    const snapshot = await getDocs(unseenQuery);

    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
    const unseenFriendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));
    const friendRequestsSnapshot = await getDocs(unseenFriendRequestsQuery);

    if (!snapshot.empty || !friendRequestsSnapshot.empty) {
      const batch = writeBatch(database);

      snapshot.forEach((doc) => {
        batch.update(doc.ref, { seen: true });
      });

      friendRequestsSnapshot.forEach((doc) => {
        batch.update(doc.ref, { seen: true });
      });

      await batch.commit();
    }
  }
};

export const handleDeleteNotification = (params) => {
  const { notificationId, setNotifications, setNotificationList, t } = params;

  Alert.alert(
    t("notifications.deleteNotificationTitle"),
    t("notifications.deleteNotificationMessage"),
    [
      {
        text: t("notifications.cancel"),
        style: "cancel",
      },
      {
        text: t("notifications.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            const userRef = doc(database, "users", auth.currentUser.uid, "notifications", notificationId);
            await deleteDoc(userRef);
            
            // Actualizar ambos estados
            setNotifications((prevNotifications) =>
              prevNotifications.filter((notif) => notif.id !== notificationId)
            );
            
            setNotificationList((prevList) =>
              prevList.filter((notif) => notif.id !== notificationId)
            );

            // Actualizar el caché
            const cachedNotifications = await loadNotificationsFromCache();
            if (cachedNotifications) {
              const updatedCache = cachedNotifications.filter(
                (notif) => notif.id !== notificationId
              );
              await saveNotificationsToCache(updatedCache);
            }

            Alert.alert(
              t("notifications.notificationDeletedTitle"),
              t("notifications.notificationDeletedMessage")
            );
          } catch (error) {
            console.error("Error al eliminar la notificación:", error);
            Alert.alert(
              t("notifications.deleteNotificationErrorTitle"),
              t("notifications.deleteNotificationErrorMessage")
            );
          }
        },
      },
    ],
    { cancelable: true }
  );
};




export const updateNotifications = (params) => {
  const { newNotifications, setNotifications } = params;

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

export const handleUserPress = async (params) => {
  const { uid, navigation, t } = params;

  try {
    // Obtener el documento del usuario actual para revisar usuarios bloqueados
    const currentUserDoc = await getDoc(doc(database, "users", auth.currentUser.uid));
    const blockedUsers = currentUserDoc.data()?.blockedUsers || [];

    if (blockedUsers.includes(uid)) {
      Alert.alert("Error", "No puedes interactuar con este usuario.");
      return;
    }

    // Obtener los datos del usuario seleccionado
    const selectedUserDoc = await getDoc(doc(database, "users", uid));
    if (selectedUserDoc.exists()) {
      const selectedUserData = selectedUserDoc.data();
      selectedUserData.id = uid;
      selectedUserData.profileImage =
        selectedUserData.photoUrls && selectedUserData.photoUrls.length > 0
          ? selectedUserData.photoUrls[0]
          : "https://via.placeholder.com/150";

      // Determinar si el usuario es privado y si es amigo del usuario actual
      const isPrivate = selectedUserData.isPrivate || false;
      let isFriend = false;
      if (uid === auth.currentUser.uid) {
        isFriend = true;
      } else {
        const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
        const friendQuery = query(friendsRef, where("friendId", "==", uid));
        const friendSnapshot = await getDocs(friendQuery);
        isFriend = !friendSnapshot.empty;
      }

      // Navegar a la pantalla correspondiente según la privacidad y amistad
      if (isPrivate && !isFriend) {
        navigation.navigate("PrivateUserProfile", { selectedUser: selectedUserData });
      } else {
        navigation.navigate("UserProfile", { selectedUser: selectedUserData });
      }
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

export const handleAcceptRequest = async (params) => {
  const { request, setLoadingEventId, setNotifications, setNotificationList, t } = params;
  

  setLoadingEventId(request.id);
  try {
    const user = auth.currentUser;
    const userFriendsRef = collection(database, "users", user.uid, "friends");
    const senderFriendsRef = collection(database, "users", request.fromId, "friends");

    const friendImage = request.fromImage || "https://via.placeholder.com/150";

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

    

    const requestRef = doc(database, "users", user.uid, "friendRequests", request.id);
    await updateDoc(requestRef, { status: "accepted" });

    const senderNotificationsRef = collection(database, "users", request.fromId, "notifications");

    const newNotification = {
      type: "friendRequestResponse",
      response: "accepted",
      fromId: user.uid,
      fromName: userData.username,
      fromImage: profileImage,
      message: t("notifications.friendRequestAccepted", {
        name: userData.firstName,
      }),
      timestamp: new Date(),
    };

    await addDoc(senderNotificationsRef, newNotification);

    const userNotificationsRef = doc(database, "users", user.uid, "notifications", request.id);
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

    setNotifications((prevNotifications) => {
      const updatedNotifications = prevNotifications.filter((notif) => notif.id !== request.id);
      updatedNotifications.push({
        id: request.id,
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
      return updatedNotifications.sort((a, b) => b.timestamp - a.timestamp);
    });

     // <-- Agrega la actualización de notificationList aquí:
     setNotificationList((prevList) => {
      const updatedList = prevList.filter((notif) => notif.id !== request.id);
      updatedList.push({
        id: request.id,
        type: "friendRequestResponse",
        response: "accepted",
        fromId: request.fromId,
        fromName: request.fromName,
        fromImage: request.fromImage,
        message: t("notifications.youAreNowFriends", { name: request.fromName }),
        timestamp: new Date(),
      });
      return updatedList.sort((a, b) => b.timestamp - a.timestamp);
    });


  } catch (error) {
    console.error("Error accepting request:", error);
    Alert.alert(t("notifications.error"), t("notifications.acceptRequestError"));
  } finally {
    setLoadingEventId(null);
  }
};

export const handleRejectRequest = async (params) => {
  const { request, setLoadingEventId, setNotifications, t } = params;

  setLoadingEventId(request.id)
  try {
    const user = auth.currentUser;
    const requestRef = doc(
      database,
      "users",
      user.uid,
      "friendRequests",
      request.id
    );
    await deleteDoc(requestRef)


    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.id !== request.id)
    );

  } catch (error) {
    console.error("Error rejecting request:", error);
    Alert.alert(
      t("notifications.error"),
      t("notifications.rejectRequestError")
    );
  }
};

export const handleAcceptEventInvitation = async (params) => {
  const { notif, setNotifications, t } = params;

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
      prevNotifications.filter((n) => n.id !== notif.id)
    );

  } catch (error) {
    console.error("Error accepting invitation:", error);
    Alert.alert(
      t("notifications.error"),
      t("notifications.acceptInvitationError")
    );
  }
};

export const handleRejectEventInvitation = async (params) => {
  const { notif, setNotifications, t } = params;

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
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    Alert.alert(
      t("notifications.error"),
      t("notifications.rejectInvitationError")
    );
  }
};

export const handleAcceptPrivateEvent = async (params) => {
  const { setNotifications, setLoadingEventId, setNotificationList, item, t } = params;

  try {
    setLoadingEventId(item.id);
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(t("notifications.error"), t("notifications.userAuthError"));
      setLoadingEventId(null);
      return;
    }

    // Check if the user already has an event with the same eventId
    const eventsRef = collection(database, "users", user.uid, "events");
    const q = query(eventsRef, where("eventId", "==", item.eventId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      Alert.alert(
        t("notifications.alreadyParticipant"),
        t("notifications.alreadyInEvent")
      );
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
          profileImage:
            userData.photoUrls && userData.photoUrls.length > 0
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
        dateArray: [eventData.date],
        Admin: item.Admin || eventData.Admin, // Add Admin field from notification or event data
      });
    }

    // Función para convertir la fecha
function convertDateToShortFormat(date) {
  const options = { day: '2-digit', month: 'short' }; // Formato "26 Dec"
  return new Date(date).toLocaleDateString('en-GB', options);
}

 // **ACTUALIZAR ESTADOS LOCALES INMEDIATAMENTE**
 setNotifications((prevNotifications) =>
  prevNotifications.filter((notif) => notif.id !== item.id)
);

setNotificationList((prevList) =>
  prevList.filter((notif) => notif.id !== item.id)
);

    // Update the notification with the confirmation message
    const notifRef = doc(database, "users", user.uid, "notifications", item.id);
    await setDoc(notifRef, {
      ...item,
      status: "confirmed",
      message: t("notifications.eventConfirmationMessage"), 
      timestamp: new Date(),
      type: "eventConfirmation",
    });

    // Update local notification state
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.id === item.id
          ? {
              ...notif,
              status: "confirmed",
              message: t("notifications.eventConfirmationMessage"),
              timestamp: new Date(),
              type: "eventConfirmation",
            }
          : notif
      )
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

export const handleRejectPrivateEvent = async (params) => {
  const { item, setNotifications, setNotificationList, t } = params; // Agregar setNotificationList

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

    // También eliminar de notificationList
    setNotificationList((prevList) =>
      prevList.filter((notif) => notif.id !== item.id)
    );

  } catch (error) {
    console.error("Error al rechazar la invitación al evento privado:", error);
    Alert.alert(t("notifications.error"), t("notifications.rejectInvitationError"));
  }
};


export const handleAcceptGeneralEvent = async (params) => {
  const { item, setLoadingEventId, setNotifications, setNotificationList, t} = params;

  try {
    setLoadingEventId(item.id);
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión para aceptar el evento.");
      setLoadingEventId(null);
      return;
    }

    // Obtener datos del usuario
    const userDoc = await getDoc(doc(database, "users", user.uid));
    const userData = userDoc.data();

    // Verificar si ya es participante
    const eventRef = doc(database, "GoBoxs", item.eventTitle);
    const eventDoc = await getDoc(eventRef);

    if (eventDoc.exists()) {
      const participants = eventDoc.data()[item.eventDate] || [];
      if (participants.some((p) => p.uid === user.uid)) {
        Alert.alert(t("notifications.Notice"), t("notifications.alreadyParticipating"));
        setLoadingEventId(null);
        return;
      }

      // Agregar al usuario como participante
      const updatedParticipants = participants.concat({
        uid: user.uid,
        username: userData.username || user.displayName,
        profileImage:
          userData.photoUrls?.[0] || "https://via.placeholder.com/150",
      });

      await updateDoc(eventRef, { [item.eventDate]: updatedParticipants });

      // Agregar el evento a la base de datos del usuario
      const userEventsRef = collection(database, "users", user.uid, "events");
      await addDoc(userEventsRef, {
        title: item.eventTitle,
        imageUrl: item.imageUrl,
        date: item.eventDate,
        coordinates: item.coordinates,
        hours: item.hours,
        locationLink: "Sin ubicación especificada",
        phoneNumber: item.number,
        dateArray: [item.eventDate],
        expirationDate: item.expirationDate || null,
        eventId: item.eventTitle, // Add this line
        details: item.details || "",
      });

      // Actualizar la notificación existente
      const notifRef = doc(database, "users", user.uid, "notifications", item.id);
      await updateDoc(notifRef, {
        status: "confirmed",
        message: t("notifications.eventGeneralConfirmationMessage"), // Texto genérico
        timestamp: new Date(),
        type: "eventConfirmation",
      });

       // **ACTUALIZAR ESTADOS LOCALES INMEDIATAMENTE**
       setNotifications((prevNotifications) =>
        prevNotifications.filter((notif) => notif.id !== item.id)
      );

      setNotificationList((prevList) =>
        prevList.filter((notif) => notif.id !== item.id)
      );

      // Actualizar el estado local
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === item.id
            ? {
                ...notif,
                status: "confirmed",
                message: t("notifications.eventGeneralConfirmationMessage"), // Reflejar el mensaje genérico
                timestamp: new Date(),
                type: "eventConfirmation",
              }
            : notif
        )
      );

    }
  } catch (error) {
    console.error("Error al aceptar la invitación:", error);
    Alert.alert("Error", "No se pudo aceptar la invitación. Intenta nuevamente.");
  } finally {
    setLoadingEventId(null);
  }
};

export const handleRejectGeneralEvent = async (params) => {
  const { item, setNotifications, setNotificationList, t } = params; // Asegúrate de recibir setNotificationList

  try {
    // Eliminar la notificación de Firestore
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

    // Remover la notificación del estado local "notifications"
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.id !== item.id)
    );
    
    // <-- Agrega aquí la actualización de notificationList:
    setNotificationList((prevList) =>
      prevList.filter((notif) => notif.id !== item.id)
    );
    
  } catch (error) {
    console.error("Error al rechazar la invitación al evento general:", error);
    Alert.alert("Error", "No se pudo rechazar la invitación.");
  }
};


export const handleCancelFriendRequestNotification = async (params) => {
  const { notificationId, targetUserId, setNotifications } = params;

  try {
    // Delete the notification from the current user's notifications
    const userRef = doc(database, "users", auth.currentUser.uid, "notifications", notificationId);
    await deleteDoc(userRef);

    // Delete the friend request notification from the target user's notifications
    const targetUserNotificationRef = doc(database, "users", targetUserId, "notifications", notificationId);
    await deleteDoc(targetUserNotificationRef);

    // Update local notification state immediately
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.id !== notificationId)
    );

    Alert.alert("Notificación eliminada", "La notificación ha sido eliminada.");
  } catch (error) {
    console.error("Error deleting friend request cancellation notification:", error);
    Alert.alert("Error", "No se pudo eliminar la notificación. Inténtalo de nuevo.");
  }
};

export const handleLikeNote = async (note) => {
  try {
    const likeRef = doc(
      database,
      "users",
      note.friendId,
      "note",
      "current",
      "likes",
      user.uid
    );
    const likeDoc = await getDoc(likeRef);

    if (likeDoc.exists()) {
      await deleteDoc(likeRef);
      note.isLiked = false;
      note.likeCount--;
    } else {
      await setDoc(likeRef, { timestamp: new Date() });
      note.isLiked = true;
      note.likeCount++;

      const notificationsRef = collection(
        database,
        "users",
        note.friendId,
        "notifications"
      );
      await addDoc(notificationsRef, {
        type: "noteLike",
        fromId: user.uid,
        fromName: userData.username,
        fromImage: userData.photoUrls[0],
        messageKey: "notes.likedYourNote", // Envía la clave de traducción
        timestamp: new Date(),
        noteText: note.text,
        seen: false,
      });
    }

    setFriendsNotes([...friendsNotes]);
  } catch (error) {
    console.error("Error toggling like:", error);
    Alert.alert(t("notes.error"), t("notes.likeToggleError"));
  }
};
// Cache functions
export const saveNotificationsToCache = async (notifications) => {
  try {
    const serializedNotifications = notifications.map(notification => ({
      ...notification,
      timestamp: notification.timestamp instanceof Date 
        ? notification.timestamp.toISOString()
        : notification.timestamp?.toDate?.()?.toISOString() 
        || notification.timestamp,
      type: notification.type || 'notification'
    }));
    await AsyncStorage.setItem('cachedNotifications', JSON.stringify(serializedNotifications));
  } catch (error) {
    console.error('Error saving notifications to cache:', error);
  }
};

export const loadNotificationsFromCache = async () => {
  try {
    const cachedData = await AsyncStorage.getItem('cachedNotifications');
    if (cachedData) {
      const notifications = JSON.parse(cachedData);
      return notifications.map(notification => ({
        ...notification,
        timestamp: notification.timestamp ? new Date(notification.timestamp) : null,
        type: notification.type || 'notification'
      }));
    }
    return null;
  } catch (error) {
    console.error('Error loading notifications from cache:', error);
    return null;
  }
};

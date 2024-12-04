import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { Alert } from "react-native";
import { auth, database } from "../../config/firebase";


export const markNotificationsAsSeen = async (params) => {
  const user = params.user;
  const database = params.database;

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
  const notificationId = params.notificationId
  const setNotifications = params.setNotifications

  Alert.alert(
    "Eliminar notificación",
    "¿Estás seguro de que deseas eliminar esta notificación?",
    [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const userRef = doc(database, "users", auth.currentUser.uid, "notifications", notificationId);
            await deleteDoc(userRef);
            setNotifications((prevNotifications) =>
              prevNotifications.filter((notif) => notif.id !== notificationId)
            );
            Alert.alert(
              "Notificación eliminada",
              "La notificación ha sido eliminada."
            );
          } catch (error) {
            console.error("Error al eliminar la notificación:", error);
            Alert.alert(
              "Error",
              "No se pudo eliminar la notificación. Inténtalo de nuevo."
            );
          }
        },
      },
    ],
    { cancelable: true }
  );
};

export const updateNotifications = (params) => {
  const newNotifications = params.newNotifications
  const setNotifications = params.setNotifications

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
  console.log("handleUserPress params:", params);
  const uid = params.uid
  const navigation = params.navigation
  const t = params.t
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

export const handleAcceptRequest = async (params) => {
  const request = params.request;
  const setLoadingEventId = params.setLoadingEventId;
  const setNotifications = params.setNotifications;
  const t = params.t;

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
      fromName: userData.firstName,
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

    Alert.alert(t("notifications.invitationAccepted"), t("notifications.eventAddedToProfile"));
  } catch (error) {
    console.error("Error accepting request:", error);
    Alert.alert(t("notifications.error"), t("notifications.acceptRequestError"));
  } finally {
    setLoadingEventId(null);
  }
};

export const handleRejectRequest = async (params) => {
  const request = params.request
  const setLoadingEventId = params.setLoadingEventId
  const setNotifications = params.setNotifications
  const t = params.t

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

    Alert.alert(
      t("notifications.invitationRejected"),
      t("notifications.eventInvitationRejected")
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
  const notif = params.notif
  const setNotifications = params.setNotifications
  const t = params.t

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

export const handleRejectEventInvitation = async (params) => {
  const notif = params.notif
  const setNotifications = params.setNotifications
  const t = params.t

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

export const handleAcceptPrivateEvent = async (params) => {
  const setNotifications = params.setNotifications
  const setLoadingEventId = params.setLoadingEventId
  const item = params.item
  const t = params.t

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
        dateArray: [eventData.date],
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

export const handleRejectPrivateEvent = async (params) => {
  const item = params.item
  const setNotifications = params.setNotifications

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

export const handleAcceptGeneralEvent = async (params) => {
  const item = params.item;
  const setLoadingEventId = params.setLoadingEventId;
  const setNotifications = params.setNotifications;
  const t = params.t;

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

    // Check if user is already a participant in the event
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

      // Add user as a participant
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

      // Ensure that imageUrl is correctly handled as a number
      const imageUrl = typeof item.imageUrl === 'number' ? item.imageUrl : parseInt(item.imageUrl, 10);

      // Add event data to user's database
      const userEventsRef = collection(database, "users", user.uid, "events");
      await addDoc(userEventsRef, {
        title: item.eventTitle,
        imageUrl: imageUrl,
        date: item.eventDate,
        coordinates: item.coordinates,
        dateArray: [item.eventDate],
        hours: item.hours,
        locationLink: "Sin ubicación especificada",
        phoneNumber: item.number,
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

export const handleRejectGeneralEvent = async (params) => {
  const item = params.item
  const setNotifications = params.setNotifications

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

export const handleCancelFriendRequestNotification = async (params) => {
  const notificationId = params.notificationId;
  const targetUserId = params.targetUserId; // Add targetUserId parameter
  const setNotifications = params.setNotifications;

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

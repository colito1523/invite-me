import { addDoc, arrayUnion, collection, deleteDoc, deleteField, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { auth, database } from "../../config/firebase";
import { Alert } from "react-native";


export const checkAndRemoveExpiredEvents = async (title) => {

    const boxRef = doc(database, "GoBoxs", title);
    const boxDoc = await getDoc(boxRef);

    if (boxDoc.exists()) {
      const data = boxDoc.data();
      const currentDate = new Date();

      for (const [dateKey, attendees] of Object.entries(data)) {
        let eventDate = parseCustomDate(dateKey);

        if (!eventDate) {
          console.error(`El valor ${dateKey} no se pudo convertir a fecha.`);
          continue;
        }

        const timeDifference = currentDate - eventDate;
        const hoursPassed = timeDifference / (1000 * 60 * 60);

        if (hoursPassed >= 24) {
          try {
            await updateDoc(boxRef, {
              [dateKey]: deleteField(),
            });
          } catch (error) {
            console.error(`Error al eliminar el evento del ${dateKey}:`, error);
          }
        }
      }
    }
};


const parseCustomDate = (dateStr) => {
    try {
      const [day, monthStr] = dateStr.split(" ");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthIndex = monthNames.indexOf(monthStr);
      if (monthIndex === -1) {
        return null;
      }
      const year = new Date().getFullYear();
      return new Date(year, monthIndex, parseInt(day));
    } catch (error) {
      console.error(`Error al parsear la fecha ${dateStr}:`, error);
      return null;
    }
};

export const checkNightMode = (setIsNightMode) => {
  const currentHour = new Date().getHours();
  setIsNightMode(currentHour >= 19 || currentHour < 6);
};

export const checkEventStatus = async (params) => {
  const box = params.box
  const selectedDate = params.selectedDate
  const setIsEventSaved = params.setIsEventSaved
  const user = auth.currentUser;
  if (user && box && box.title) {
    const eventsRef = collection(database, "users", user.uid, "events");
    const q = query(eventsRef, where("title", "==", box.title));
    const querySnapshot = await getDocs(q);

    const isPrivateEvent = box.category === "EventoParaAmigos";
    const eventDate = isPrivateEvent ? box.date : selectedDate;

    // Check if the event for the selected date already exists
    const existingEvent = querySnapshot.docs.find(doc => doc.data().dateArray.includes(eventDate));
    setIsEventSaved(!!existingEvent);
  }
};

export const fetchEventDetails = async (params) => {
  const box = params.box
  const setBoxData = params.setBoxData

  const eventRef = doc(database, "EventsPriv", box.id || box.title);
  const eventSnapshot = await getDoc(eventRef);
  if (eventSnapshot.exists()) {
    const eventData = eventSnapshot.data();
    setBoxData((prevBox) => ({ ...prevBox, ...eventData }));
  }
};

export const fetchAttendees = (params) => {
  const box = params.box;
  const selectedDate = params.selectedDate;
  const setAttendeesList = params.setAttendeesList;

  const eventRef = doc(
    database,
    box.category === "EventoParaAmigos" ? "EventsPriv" : "GoBoxs",
    box.eventId || box.id || box.title
  );

  const unsub = onSnapshot(eventRef, async (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const attendees =
        box.category === "EventoParaAmigos"
          ? data.attendees || []
          : data[selectedDate] || [];

      try {
        const userRef = doc(database, "users", auth.currentUser.uid);
        const userSnapshot = await getDoc(userRef);
        const blockedUsers = userSnapshot.data()?.blockedUsers || [];

        const filteredAttendees = attendees.filter(
          (attendee) => !blockedUsers.includes(attendee.uid)
        );

        const uniqueAttendees = filteredAttendees.map((attendee) => ({
          ...attendee,
          profileImage:
            attendee.profileImage || "https://via.placeholder.com/150",
        }));

        setAttendeesList(uniqueAttendees);
      } catch (error) {
        console.error("Error al filtrar usuarios bloqueados:", error);
      }
    } else {
      setAttendeesList([]);
    }
  });

  return unsub;
};

export const handleGeneralEventInvite = async (params) => {
  const { friendId, isEventSaved, box, selectedDate } = params;
  const user = auth.currentUser;
  if (!user) return;

  if (!isEventSaved) {
    Alert.alert("Error", "Debes unirte al evento antes de invitar a otros.");
    return;
  }

  try {
    const eventRef = doc(database, "GoBoxs", box.title);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      Alert.alert("Error", "El evento no existe.");
      return;
    }

    const eventData = eventDoc.data();
    const dayData = eventData[selectedDate] || [];

    const existingInvitationOrAttendee = dayData.some(
      (entry) =>
        entry.uid === friendId ||
        (entry.invitations && entry.invitations.some((inv) => inv.invitedTo === friendId))
    );

    if (existingInvitationOrAttendee) {
      Alert.alert("Error", "Esta persona ya está invitada o asistiendo al evento.");
      return;
    }

    const userDocRef = doc(database, "users", user.uid);
    const userDocSnapshot = await getDoc(userDocRef);

    if (!userDocSnapshot.exists()) {
      Alert.alert("Error", "No se pudo obtener la información del usuario.");
      return;
    }

    const userData = userDocSnapshot.data();
    const fromName = userData.username || "Usuario Desconocido";
    const fromImage = userData.photoUrls && userData.photoUrls.length > 0
      ? userData.photoUrls[0]
      : "https://via.placeholder.com/150";

    const invitationData = {
      invitedBy: user.uid,
      invitedTo: friendId,
      timestamp: new Date(),
      number: box.number || "Sin número", // Incluye el número aquí
    };

    const updatedDayData = dayData.map((entry) => {
      if (entry.uid === user.uid) {
        return {
          ...entry,
          invitations: entry.invitations
            ? [...entry.invitations, invitationData]
            : [invitationData],
        };
      }
      return entry;
    });

    await updateDoc(eventRef, {
      [selectedDate]: updatedDayData,
    });

    const notificationRef = collection(database, "users", friendId, "notifications");
    await addDoc(notificationRef, {
      fromId: user.uid,
      fromName: fromName,
      fromImage: fromImage,
      eventTitle: box.title || "Evento General",
      eventImage: eventData.image || "https://via.placeholder.com/150",
      eventDate: selectedDate,
      type: "generalEventInvitation",
      status: "pendiente",
      timestamp: new Date(),
      hours: box.hours || {},
      number: box.number || "Sin número", // Incluye el número aquí
      coordinates: box.coordinates || {},
      seen: false,
      imageUrl: box.imageUrl || "https://via.placeholder.com/150"
    });

    Alert.alert(
      "Invitación enviada",
      `Has invitado a un amigo al evento ${box.title} el día ${selectedDate}.`
    );
  } catch (error) {
    console.error("Error al invitar al evento general:", error);
    Alert.alert("Error", "No se pudo enviar la invitación.");
  }
};

export const handleInvite = async (params) => {
  const friendId = params.friendId;
  const isEventSaved = params.isEventSaved;
  const setFriends = params.setFriends;
  const friends = params.friends;
  const box = params.box;
  const selectedDate = params.selectedDate;
  const t = params.t;

  const user = auth.currentUser;
  if (!user) return;

  if (!isEventSaved) {
    Alert.alert("Error", "Debes unirte al evento antes de invitar a otros.");
    return;
  }

  try {
    setFriends(
      friends.map((friend) =>
        friend.friendId === friendId ? { ...friend, invited: true } : friend
      )
    );

    const eventRef = doc(database, "EventsPriv", box.eventId || box.id || box.title);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      Alert.alert("Error", "El evento no existe.");
      return;
    }

    const eventData = eventDoc.data();
    const invitedFriends = eventData.invitedFriends || [];
    const attendees = eventData.attendees || [];

    if (invitedFriends.includes(friendId) || attendees.some(attendee => attendee.uid === friendId)) {
      Alert.alert("Error", "Esta persona ya está invitada o asistiendo al evento.");
      return;
    }

    const userDocRef = doc(database, "users", user.uid);
    const userDocSnapshot = await getDoc(userDocRef);
    let fromName = user.displayName || "Usuario Desconocido";
    let fromImage = "https://via.placeholder.com/150";

    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      fromName = userData.username || fromName;
      fromImage = userData.photoUrls && userData.photoUrls.length > 0
        ? userData.photoUrls[0]
        : fromImage;
    }

    const eventDateTimestamp = box.date || new Date();
    let eventDateFormatted = "Fecha no disponible";

    if (eventDateTimestamp instanceof Date) {
      eventDateFormatted = eventDateTimestamp.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    } else if (
      eventDateTimestamp &&
      typeof eventDateTimestamp === "object" &&
      "seconds" in eventDateTimestamp
    ) {
      const dateObject = new Date(eventDateTimestamp.seconds * 1000);
      eventDateFormatted = dateObject.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    } else if (typeof eventDateTimestamp === "string") {
      eventDateFormatted = eventDateTimestamp;
    }

    const eventImage = box.imageUrl;
    const eventCategory = box.category || "Sin categoría";
    const notificationRef = collection(database, "users", friendId, "notifications");

    await addDoc(notificationRef, {
      fromId: user.uid,
      fromName: fromName,
      fromImage: fromImage,
      eventId: box.id,
      eventTitle: box.title,
      eventImage: eventImage,
      eventDate: eventDateTimestamp,
      date: eventDateFormatted,
      eventCategory: eventCategory,
      type: "invitation",
      status: "pendiente",
      timestamp: new Date(),
      seen: false,
      address: eventData.address || "Dirección no disponible",
      description: eventData.description || "Descripción no disponible",
      eventDateTime: `${eventData.day || "Fecha no disponible"} ${eventData.hour || "Hora no disponible"}`
    });

    await updateDoc(eventRef, {
      invitedFriends: arrayUnion(friendId),
    });
    
    setFriends((prevFriends) =>
      prevFriends.map((friend) =>
        friend.friendId === friendId ? { ...friend, invited: true } : friend
      )
    );

    const invitationsRef = collection(eventRef, "invitations");
    await addDoc(invitationsRef, {
      invitedBy: user.uid,
      invitedTo: friendId,
      timestamp: new Date(),
    });

    Alert.alert(
      t("boxDetails.invitationSent"),
      `${t("boxDetails.invitationSentMessage")} el día ${selectedDate}.`
    );
  } catch (error) {
    console.error("Error al invitar al usuario:", error);
    Alert.alert("Error", "No se pudo enviar la invitación.");
  }
};

export const handleRemoveFromEvent = async (params) => {
  const box = params.box
  const selectedDate = params.selectedDate
  const setIsEventSaved = params.setIsEventSaved
  const setAttendeesList = params.setAttendeesList
  

  const user = auth.currentUser;
  if (!user || !box) return;

  try {
    // Eliminar de la colección del usuario
    const userEventsRef = collection(database, "users", user.uid, "events");
    const q = query(userEventsRef, where("title", "==", box.title));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const batch = writeBatch(database);
      querySnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

    }

    // Eliminar del evento privado (EventsPriv)
    if (box.category === "EventoParaAmigos") {
      const eventRef = doc(database, "EventsPriv", box.eventId || box.id || box.title);

      // Obtén el documento del evento para identificar al usuario en la lista de attendees
      const eventSnapshot = await getDoc(eventRef);
      if (eventSnapshot.exists()) {
        const eventData = eventSnapshot.data();

        const updatedAttendees = eventData.attendees.filter(
          (attendee) => attendee.uid !== user.uid
        );

        // Actualiza la lista de asistentes sin el usuario
        await updateDoc(eventRef, {
          attendees: updatedAttendees,
        });
      }
    } else {
      // Eliminar del evento general (GoBoxs)
      await handleRemoveFromGoBoxs(box.title, selectedDate);
    }

    // Actualizamos el estado local para reflejar los cambios
    setIsEventSaved(false);
    setAttendeesList((prev) => prev.filter((attendee) => attendee.uid !== user.uid));
  } catch (error) {
    console.error("Error al eliminar del evento:", error);
    Alert.alert("Error", "No se pudo eliminar del evento, por favor intente más tarde.");
  }
};

const handleRemoveFromGoBoxs = async (boxTitle, selectedDate) => {
  try {
    const boxRef = doc(database, "GoBoxs", boxTitle);
    const boxDoc = await getDoc(boxRef);

    if (boxDoc.exists()) {
      const existingData = boxDoc.data()[selectedDate];

      if (existingData) {
        const updatedData = existingData.filter(
          (user) => user.uid !== auth.currentUser.uid
        );

        if (updatedData.length > 0) {
          await updateDoc(boxRef, {
            [selectedDate]: updatedData,
          });
        } else {
          await updateDoc(boxRef, {
            [selectedDate]: deleteField(),
          });
        }

      }
    }
  } catch (error) {
    console.error("Error eliminando el usuario de GoBoxs:", error);
  }
};

export const handleDeleteEvent = async (params) => {
  const setMenuVisible = params.setMenuVisible
  const navigation = params.navigation
  const box = params.box

  setMenuVisible(false);
  Alert.alert(
    "Eliminar Evento",
    "¿Estás seguro de que deseas eliminar este evento?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const eventRef = doc(database, "EventsPriv", box.id || box.title);
            await deleteDoc(eventRef);
            Alert.alert("Evento eliminado exitosamente");
            navigation.goBack();
          } catch (error) {
            console.error("Error eliminando el evento:", error);
            Alert.alert("Error", "No se pudo eliminar el evento.");
          }
        },
      },
    ]
  );
};

// ...existing code...
const saveUserEvent = async (
  boxTitle,
  selectedDate,
  daySpecial,
  phoneNumber,
  locationLink,
  hours,
  coordinates,
  imageUrl // Add imageUrl parameter
) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    const userDocRef = doc(database, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    let username = "Usuario desconocido";
    let profileImage = "https://via.placeholder.com/150";

    if (userDoc.exists()) {
      const userData = userDoc.data();
      username = userData.username || username;
      profileImage =
        userData.photoUrls && userData.photoUrls.length > 0
          ? userData.photoUrls[0]
          : profileImage;
    }

    const boxRef = doc(database, "GoBoxs", boxTitle);
    const boxDoc = await getDoc(boxRef);

    let existingData = [];
    if (boxDoc.exists()) {
      const data = boxDoc.data();
      existingData = data[selectedDate] || [];
    } else {
      await setDoc(boxRef, { [selectedDate]: [] });
    }

    const userDataToSave = {
      profileImage: profileImage,
      username: username,
      uid: user.uid,
      phoneNumber: phoneNumber,
      locationLink: locationLink,
      hours: hours,
      coordinates: coordinates, // Save coordinates
      imageUrl: imageUrl // Save imageUrl
    };

    if (daySpecial) {
      userDataToSave.DaySpecial = daySpecial;
    }

    await updateDoc(boxRef, {
      [selectedDate]: [...existingData, userDataToSave],
    });
  } catch (error) {
    console.error("Error al guardar el evento: ", error);
  }
};
// ...existing code...

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

      // Ensure you are passing the correct imageUrl here
      const imageUrl = item.imageUrl || item.eventImage; // Use the appropriate mapping based on your data structure

      // Add event data to user's database
      const userEventsRef = collection(database, "users", user.uid, "events");
      await addDoc(userEventsRef, {
        title: item.eventTitle,
        imageUrl: imageUrl, // Correctly assign the imageUrl here.
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

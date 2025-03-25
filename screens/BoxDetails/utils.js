import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { auth, database } from "../../config/firebase";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


const parseCustomDate = (dateStr) => {
  try {
    // Check if date is in DD/MM/YYYY format
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Handle D MMM format
    else {
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
        console.error(`Invalid month string: ${monthStr}`);
        return null;
      }
      const year = new Date().getFullYear();
      return new Date(year, monthIndex, parseInt(day));
    }
  } catch (error) {
    console.error(`Error parsing date ${dateStr}:`, error);
    return null;
  }
};

export const checkNightMode = (setIsNightMode) => {
  const currentHour = new Date().getHours();
  setIsNightMode(currentHour >= 19 || currentHour < 6);
};

export const checkEventStatus = async (params) => {
  const box = params.box;
  const selectedDate = params.selectedDate;
  const setIsEventSaved = params.setIsEventSaved;
  const user = auth.currentUser;
  if (user && box && box.title) {
    const eventsRef = collection(database, "users", user.uid, "events");
    const q = query(
      eventsRef,
      where("eventId", "==", box.eventId || box.id || box.title),
    );
    const querySnapshot = await getDocs(q);

    const isPrivateEvent = box.category === "EventoParaAmigos";
    const eventDate = isPrivateEvent ? box.date : selectedDate;

    // Check if the event for the selected date already exists
    const existingEvent = querySnapshot.docs.find((doc) =>
      doc.data().dateArray.includes(eventDate),
    );
    setIsEventSaved(!!existingEvent);
  }
};

export const fetchEventDetails = async (params) => {
  const { box, setBoxData } = params;

  try {
    // Referencia al documento del evento
    const eventRef = doc(database, "EventsPriv", box.id || box.title);
    const eventSnapshot = await getDoc(eventRef);

    if (eventSnapshot.exists()) {
      const eventData = eventSnapshot.data();

      // Asegurarte de que `day` esté correctamente formateado
      const formatDay = (date) => {
        if (typeof date === "string") {
          return date; // Si ya es un string, usarlo directamente
        }
        const parsedDate = new Date(date);
        return parsedDate.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      };

      const formattedDay = eventData.day || formatDay(eventData.date);

      // Actualiza `setBoxData` con los datos obtenidos
      setBoxData((prevBox) => ({
        ...prevBox,
        ...eventData,
        day: formattedDay, // Agrega el campo `day` con el formato correcto
      }));
    } else {
      console.warn("El evento no existe.");
    }
  } catch (error) {
    console.error("Error al obtener los detalles del evento:", error);
  }
};

export const fetchAttendees = (params) => {
  const box = params.box;
  const selectedDate = params.selectedDate;
  const setAttendeesList = params.setAttendeesList;

  const eventRef = doc(
    database,
    box.category === "EventoParaAmigos" ? "EventsPriv" : "GoBoxs",
    box.eventId || box.id || box.title,
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
          (attendee) => !blockedUsers.includes(attendee.uid),
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
    Alert.alert(t("indexBoxDetails.error"), t("indexBoxDetails.dontJoing"));
    return;
  }

  try {
    const eventRef = doc(database, "GoBoxs", box.title);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      Alert.alert(
        t("indexBoxDetails.error"),
        t("indexBoxDetails.eventNotFound"),
      );
      return;
    }

    const eventData = eventDoc.data();
    const dayData = eventData[selectedDate] || [];

    const existingInvitationOrAttendee = dayData.some(
      (entry) =>
        entry.uid === friendId ||
        (entry.invitations &&
          entry.invitations.some((inv) => inv.invitedTo === friendId)),
    );

    if (existingInvitationOrAttendee) {
      Alert.alert(
        t("indexBoxDetails.error"),
        t("indexBoxDetails.alreadyParticipantPerson"),
      );
      return;
    }

    const userDocRef = doc(database, "users", user.uid);
    const userDocSnapshot = await getDoc(userDocRef);

    if (!userDocSnapshot.exists()) {
      Alert.alert(
        t("indexBoxDetails.error"),
        t("indexBoxDetails.dotnGetUserInfo"),
      );
      return;
    }

    const userData = userDocSnapshot.data();
    const fromName = userData.username || "Usuario Desconocido";
    const fromImage =
      userData.photoUrls && userData.photoUrls.length > 0
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

    const notificationRef = collection(
      database,
      "users",
      friendId,
      "notifications",
    );

    // Calculate expiration date (24 hours after event date)
    const [day, month] = selectedDate.split(" ");
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
    const monthIndex = monthNames.indexOf(month);
    const year = new Date().getFullYear();
    const selectedDateObj = new Date(year, monthIndex, parseInt(day));
    const expirationDate = new Date(selectedDateObj);
    expirationDate.setHours(expirationDate.getHours() + 24);

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
      number: box.number || "Sin número",
      coordinates: box.coordinates || {},
      seen: false,
      imageUrl: box.imageUrl || "https://via.placeholder.com/150",
      expirationDate: expirationDate,
      details: box.details || "",
    });
  } catch (error) {
    console.error("Error al invitar al evento general:", error);
    Alert.alert(
      t("indexBoxDetails.error"),
      t("indexBoxDetails.eventInviteError"),
    );
  }
};

const formatHour = (hour) => {
  const date = new Date(hour);
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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
    Alert.alert(t("indexBoxDetails.error"), t("indexBoxDetails.dontJoing"));
    return;
  }

  try {
    setFriends(
      friends.map((friend) =>
        friend.friendId === friendId ? { ...friend, invited: true } : friend,
      ),
    );

    const eventRef = doc(
      database,
      "EventsPriv",
      box.eventId || box.id || box.title,
    );
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      Alert.alert(
        t("indexBoxDetails.error"),
        t("indexBoxDetails.eventNotFound"),
      );

      return;
    }

    const eventData = eventDoc.data();
    const invitedFriends = eventData.invitedFriends || [];
    const attendees = eventData.attendees || [];

    if (
      invitedFriends.includes(friendId) ||
      attendees.some((attendee) => attendee.uid === friendId)
    ) {
      Alert.alert(
        t("indexBoxDetails.error"),
        t("indexBoxDetails.alreadyParticipantPerson"),
      );
      return;
    }

    const userDocRef = doc(database, "users", user.uid);
    const userDocSnapshot = await getDoc(userDocRef);
    let fromName = user.displayName || "Usuario Desconocido";
    let fromImage = "https://via.placeholder.com/150";

    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      fromName = userData.username || fromName;
      fromImage =
        userData.photoUrls && userData.photoUrls.length > 0
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
    const notificationRef = collection(
      database,
      "users",
      friendId,
      "notifications",
    );

    const formatDay = (date) => {
      if (typeof date === "string") {
        return date; // Asume que ya está correctamente formateada.
      }
      const parsedDate = new Date(date);
      return parsedDate.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    await addDoc(notificationRef, {
      fromId: user.uid,
      fromName: fromName,
      fromImage: fromImage,
      eventId: box.id,
      eventTitle: box.title,
      eventImage: eventImage,
      day: eventData.day || formatDay(box.date || new Date()),
      eventDate: eventDateTimestamp,
      date: eventDateFormatted,
      expirationDate: eventData.expirationDate || box.expirationDate || null,
      eventCategory: eventCategory,
      type: "invitation",
      status: "pendiente",
      timestamp: new Date(),
      seen: false,
      address: eventData.address || "Dirección no disponible",
      description: eventData.description || "Descripción no disponible",
      eventDateTime: `${eventData.day || "Fecha no disponible"} ${eventData.hour || "Hora no disponible"}`,
      Admin: user.uid, // Add the Admin field with sender's UID
      hour:
        box.category === "EventoParaAmigos"
          ? formatHour(box.hour || new Date())
          : box.hours || {},
    });

    await updateDoc(eventRef, {
      invitedFriends: arrayUnion(friendId),
    });

    setFriends((prevFriends) =>
      prevFriends.map((friend) =>
        friend.friendId === friendId ? { ...friend, invited: true } : friend,
      ),
    );

    const invitationsRef = collection(eventRef, "invitations");
    await addDoc(invitationsRef, {
      invitedBy: user.uid,
      invitedTo: friendId,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error al invitar al usuario:", error);

    Alert.alert(
      t("indexBoxDetails.error"),
      t("indexBoxDetails.eventInviteError"),
    );
  }
};

export const handleRemoveFromEvent = async (params) => {
  const box = params.box;
  const selectedDate = params.selectedDate;
  const setIsEventSaved = params.setIsEventSaved;
  const setAttendeesList = params.setAttendeesList;

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
      const eventRef = doc(
        database,
        "EventsPriv",
        box.eventId || box.id || box.title,
      );

      // Obtén el documento del evento para identificar al usuario en la lista de attendees
      const eventSnapshot = await getDoc(eventRef);
      if (eventSnapshot.exists()) {
        const eventData = eventSnapshot.data();

        const updatedAttendees = eventData.attendees.filter(
          (attendee) => attendee.uid !== user.uid,
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
    setAttendeesList((prev) =>
      prev.filter((attendee) => attendee.uid !== user.uid),
    );
  } catch (error) {
    console.error("Error al eliminar del evento:", error);
    Alert.alert(
      t("indexBoxDetails.error"),
      t("indexBoxDetails.eventDeleteError"),
    );
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
          (user) => user.uid !== auth.currentUser.uid,
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
        (participant) => participant.uid === user.uid,
      );

      if (isAlreadyParticipant) {
        Alert.alert(
          t("notifications.alreadyParticipant"),
          t("notifications.alreadyInEvent"),
        );
        setLoadingEventId(null);
        return;
      }

      // Add user as a participant
      const updatedParticipants = participants.concat({
        uid: user.uid,
        username: userData.username || user.displayName,
        profileImage:
          userData.photoUrls && userData.photoUrls.length > 0
            ? userData.photoUrls[0]
            : "https://via.placeholder.com/150",
      });

      // Convertir la fecha del evento a un objeto Date
      const [day, month] = item.eventDate.split(" ");
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
      const monthIndex = monthNames.indexOf(month);
      const year = new Date().getFullYear();
      const selectedDateObj = new Date(year, monthIndex, parseInt(day));

      // Calcular la fecha de expiración (24 horas después)
      const expirationDate = new Date(selectedDateObj);
      expirationDate.setHours(expirationDate.getHours() + 24);

      const eventDataToAdd = {
        title: item.eventTitle,
        expirationDate: Timestamp.fromDate(expirationDate),
        category: item.eventCategory || "General",
        date: item.eventDate,
        dateArray: [item.eventDate],
        description: item.description || "",
        address: item.address || "",
        imageUrl: item.imageUrl || item.eventImage || "",
        date: item.eventDate,
        phoneNumber: item.number || "Sin número",
        locationLink: item.locationLink || "Sin ubicación especificada",
        hours: item.hours || {},
        uid: user.uid,
        eventId: item.eventId,
        status: "accepted",
        coordinates: item.coordinates || {},
        details: item.details || "",
      };

      await updateDoc(eventRef, {
        [item.eventDate]: updatedParticipants,
      });

      // Ensure you are passing the correct imageUrl here
      const imageUrl = item.imageUrl || item.eventImage; // Use the appropriate mapping based on your data structure

      // Add event data to user's database
      const userEventsRef = collection(database, "users", user.uid, "events");
      await addDoc(userEventsRef, eventDataToAdd);
    }

    // Delete the notification from the database
    const notifRef = doc(database, "users", user.uid, "notifications", item.id);
    await deleteDoc(notifRef);

    // Update local notification state
    setNotifications((prevNotifications) =>
      prevNotifications.filter((n) => n.id !== item.id),
    );

    Alert.alert(
      t("notifications.invitationAccepted"),
      t("notifications.eventAddedToProfile"),
    );
  } catch (error) {
    console.error("Error accepting general event invitation:", error);
    Alert.alert(
      t("notifications.error"),
      t("notifications.acceptInvitationError"),
    );
  } finally {
    setLoadingEventId(null);
  }
};

export const handleSaveEdit = async ({
  editedData,
  boxData,
  setBoxData,
  setEditModalVisible,
  setIsProcessing,
  t,
}) => {
  try {
    setIsProcessing(true);

    const eventRef = doc(database, "EventsPriv", boxData.id || boxData.title);
    const updatedData = {
      title: editedData.title,
      address: editedData.address,
      description: editedData.description,
      category: boxData.category || "EventoParaAmigos",
    };

    // Actualizar en EventsPriv
    await updateDoc(eventRef, updatedData);

    // Actualizar en cada usuario en /users/{userId}/events/{eventId}
    const attendees = boxData.attendees || [];
    for (const attendee of attendees) {
      const eventsCollectionRef = collection(
        database,
        "users",
        attendee.uid,
        "events",
      );

      const querySnapshot = await getDocs(
        query(
          eventsCollectionRef,
          where("eventId", "==", boxData.id || boxData.title),
        ),
      );

      querySnapshot.forEach(async (docSnapshot) => {
        await updateDoc(docSnapshot.ref, {
          title: updatedData.title,
          description: updatedData.description,
          address: updatedData.address,
          category: updatedData.category,
        });
      });
    }

    // Actualizar las notificaciones en /users/{userId}/notifications/{notificationId}
    const invitedFriends = boxData.invitedFriends || [];
    for (const friendId of invitedFriends) {
      const notificationsRef = collection(
        database,
        "users",
        friendId,
        "notifications",
      );

      const notificationsSnapshot = await getDocs(
        query(
          notificationsRef,
          where("eventId", "==", boxData.id || boxData.title),
        ),
      );

      notificationsSnapshot.forEach(async (docSnapshot) => {
        await updateDoc(docSnapshot.ref, {
          eventTitle: updatedData.title,
          description: updatedData.description,
          address: updatedData.address,
        });
      });
    }

    // Actualizar el estado local
    setBoxData((prevData) => ({
      ...prevData,
      ...updatedData,
    }));

    Alert.alert(
      t("indexBoxDetails.succes"),
      t("indexBoxDetails.eventUpdateSuccess"),
    );
    setEditModalVisible(false);
  } catch (error) {
    console.error("Error al actualizar el evento:", error);
    Alert.alert(
      t("indexBoxDetails.error"),
      t("indexBoxDetails.eventUpdateError"),
    );
  } finally {
    setIsProcessing(false);
  }
};

export const handleEditImage = async ({ boxData, setIsProcessing, t }) => {
  const user = auth.currentUser;

  if (!user || user.uid !== boxData.Admin) {
    return;
  }

  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert(
      t("indexBoxDetails.error"),
      t("indexBoxDetails.dontPermission"),
    );
    return;
  }

  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (
    !pickerResult.canceled &&
    pickerResult.assets &&
    pickerResult.assets.length > 0
  ) {
    try {
      setIsProcessing(true);

      // Subir la nueva imagen a Firebase Storage
      const storage = getStorage();
      const imageRef = ref(
        storage,
        `EventosParaAmigos/${boxData.id || boxData.title}_${Date.now()}.jpg`,
      );
      const uri = pickerResult.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      await uploadBytes(imageRef, blob);

      // Obtener la URL de descarga
      const downloadURL = await getDownloadURL(imageRef);

      // Actualizar la imagen en el evento principal
      const eventRef = doc(database, "EventsPriv", boxData.id || boxData.title);
      await updateDoc(eventRef, { image: downloadURL });

      // Actualizar la imagen en las subcolecciones de los asistentes
      const attendees = boxData.attendees || [];
      for (const attendee of attendees) {
        const userEventRef = collection(
          database,
          "users",
          attendee.uid,
          "events",
        );

        const querySnapshot = await getDocs(
          query(
            userEventRef,
            where("eventId", "==", boxData.id || boxData.title),
          ),
        );

        querySnapshot.forEach(async (docSnapshot) => {
          await updateDoc(docSnapshot.ref, { imageUrl: downloadURL });
        });
      }

      // Actualizar la imagen en las notificaciones
      const invitedFriends = boxData.invitedFriends || [];
      for (const friendId of invitedFriends) {
        const notificationsRef = collection(
          database,
          "users",
          friendId,
          "notifications",
        );

        const notificationsSnapshot = await getDocs(
          query(
            notificationsRef,
            where("eventId", "==", boxData.id || boxData.title),
          ),
        );

        notificationsSnapshot.forEach(async (docSnapshot) => {
          await updateDoc(docSnapshot.ref, { eventImage: downloadURL });
        });
      }

      Alert.alert(
        t("indexBoxDetails.succes"),
        t("indexBoxDetails.eventUpdated"),
      );
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      Alert.alert(
        t("indexBoxDetails.error"),
        t("indexBoxDetails.eventUpdateError"),
      );
    } finally {
      setIsProcessing(false);
    }
  }
};
export const handleDeleteEvent = async ({
  box,
  setIsProcessing,
  navigation,
  t,
}) => {
  try {
    setIsProcessing(true);

    // Referencia al documento del evento privado
    const eventRef = doc(database, "EventsPriv", box.id || box.title);
    const eventSnapshot = await getDoc(eventRef);

    if (eventSnapshot.exists()) {
      const eventData = eventSnapshot.data();
      const attendees = eventData.attendees || []; // Lista de asistentes
      const invitedFriends = eventData.invitedFriends || []; // Lista de invitados

      // Eliminar el evento de las subcolecciones de los usuarios asistentes
      for (const attendee of attendees) {
        const userEventRef = collection(
          database,
          "users",
          attendee.uid,
          "events",
        );

        const querySnapshot = await getDocs(
          query(userEventRef, where("eventId", "==", box.id || box.title)),
        );

        const batch = writeBatch(database);
        querySnapshot.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref); // Eliminar el documento del usuario
        });
        await batch.commit();
      }

      // Eliminar notificaciones de los invitados
      for (const friendId of invitedFriends) {
        const notificationsRef = collection(
          database,
          "users",
          friendId,
          "notifications",
        );

        const notificationsSnapshot = await getDocs(
          query(notificationsRef, where("eventId", "==", box.id || box.title)),
        );

        const notificationsBatch = writeBatch(database);
        notificationsSnapshot.forEach((docSnapshot) => {
          notificationsBatch.delete(docSnapshot.ref); // Eliminar la notificación
        });
        await notificationsBatch.commit();
      }

      // Eliminar el evento de la colección principal (EventsPriv)
      await deleteDoc(eventRef);
      // Obtener la información del usuario para determinar su idioma preferido
      const user = auth.currentUser;
      let selectedCategory = "Todos"; // Valor por defecto

      if (user) {
        const userDocRef = doc(database, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        const userData = userDocSnapshot.data();

        if (userData && userData.preferredLanguage === "en") {
          selectedCategory = "All";
        }
      }

      // Redirigir a la pantalla principal y mostrar un mensaje de éxito
      navigation.reset({
        index: 0,
        routes: [{ name: "Home", params: { selectedCategory } }],
      });
      Alert.alert(
        t("indexBoxDetails.succes"),
        t("indexBoxDetails.eventDeleteSuccess"),
      );
    } else {
      Alert.alert(
        t("indexBoxDetails.error"),
        t("indexBoxDetails.eventNotFound"),
      );
    }
  } catch (error) {
    console.error("Error al eliminar el evento:", error);
    Alert.alert(
      t("indexBoxDetails.error"),
      t("indexBoxDetails.eventDeleteError"),
    );
  } finally {
    setIsProcessing(false);
  }
};

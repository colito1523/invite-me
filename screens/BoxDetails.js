import React, { useState, useEffect, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Linking,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, Entypo, Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { auth, database } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  arrayUnion,
  onSnapshot,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";
import { Image } from "expo-image";
import DotIndicatorBoxDetails from "../Components/Dots/DotIndicatorBoxDetails";
import { useTranslation } from "react-i18next";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from "./BoxDetailsComponents/Header";
import ButtonsSection from "./BoxDetailsComponents/ButtonsSection";
import SliderContent from "./BoxDetailsComponents/SliderContent";

const { width } = Dimensions.get("window");

export default memo(function BoxDetails({ route, navigation }) {
  const { t } = useTranslation();
  const { box, selectedDate, isFromNotification  } = route.params || {};
  const [isEventSaved, setIsEventSaved] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const [attendeesList, setAttendeesList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [boxData, setBoxData] = useState(box || {});
  const [menuVisible, setMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedData, setEditedData] = useState({
    title: "",
    address: "",
    description: "",
    hour: "",
    day: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);


  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    if (box && !isFromNotification) {
      // Solo fetch de datos si no viene de una notificación
      fetchEventDetails();
    }
  }, [box, isFromNotification]);

  useEffect(() => {
    let unsubscribe;

    if (box) {
      console.log("Datos del evento al entrar en BoxDetails:", box);

      fetchEventDetails();
      checkEventStatus();
      fetchFriends();
      checkNightMode();
      checkAndRemoveExpiredEvents();

      // Configura el listener en tiempo real para los asistentes
      unsubscribe = fetchAttendees();
    }

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe(); // Limpia el listener al salir del componente
      }
      console.log("Limpiando el efecto en BoxDetails");
    };
  }, [box, selectedDate]);




  const checkAndRemoveExpiredEvents = async () => {
    const boxRef = doc(database, "GoBoxs", box.title);
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
            console.log(`Evento del ${dateKey} eliminado correctamente`);
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

  const checkNightMode = () => {
    const currentHour = new Date().getHours();
    setIsNightMode(currentHour >= 24 || currentHour < 6);
  };

  const checkEventStatus = async () => {
    const user = auth.currentUser;
    if (user && box && box.title) {
      const eventsRef = collection(database, "users", user.uid, "events");
      const q = query(eventsRef, where("title", "==", box.title));
      const querySnapshot = await getDocs(q);
      setIsEventSaved(!querySnapshot.empty);
    }
  };

  const fetchEventDetails = async () => {
    const eventRef = doc(database, "EventsPriv", box.id || box.title);
    const eventSnapshot = await getDoc(eventRef);
    if (eventSnapshot.exists()) {
      const eventData = eventSnapshot.data();
      setBoxData((prevBox) => ({ ...prevBox, ...eventData }));
    } else {
      console.log("El evento no existe en la base de datos");
    }
  };

  const fetchAttendees = () => {
    if (box) {
      const eventRef = doc(
        database,
        box.category === "EventoParaAmigos" ? "EventsPriv" : "GoBoxs",
        box.eventId || box.id || box.title
      );

      console.log("Referencia al evento:", eventRef.path);

      // Usa `onSnapshot` para escuchar los cambios en tiempo real
      const unsub = onSnapshot(eventRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log("Datos del evento obtenidos:", data);

          // Selección de asistentes según el tipo de evento
          const attendees =
            box.category === "EventoParaAmigos"
              ? data.attendees || [] // Para eventos privados
              : data[selectedDate] || []; // Para eventos generales

          try {
            // Obtener la lista de usuarios bloqueados
            const userRef = doc(database, "users", auth.currentUser.uid);
            const userSnapshot = await getDoc(userRef);
            const blockedUsers = userSnapshot.data()?.blockedUsers || [];

            // Filtrar los usuarios bloqueados
            const filteredAttendees = attendees.filter(
              (attendee) => !blockedUsers.includes(attendee.uid)
            );

            // Procesa los asistentes para asegurar imágenes de perfil
            const uniqueAttendees = filteredAttendees.map((attendee) => ({
              ...attendee,
              profileImage:
                attendee.profileImage || "https://via.placeholder.com/150",
            }));

            console.log("Asistentes únicos procesados:", uniqueAttendees);
            setAttendeesList(uniqueAttendees);
          } catch (error) {
            console.error("Error al filtrar usuarios bloqueados:", error);
          }
        } else {
          console.error("El evento no existe en la base de datos.");
          setAttendeesList([]); // Limpia la lista local si no existe
        }
      });

      return unsub; // Devuelve la función para limpiar el listener
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
      const eventImage = eventData.image || "https://via.placeholder.com/150"; // URL predeterminada si no hay imagen
      const eventDate = selectedDate || eventData.date || "Fecha no disponible";
      const eventTitle = box.title || eventData.title || "Evento General";

      // Obtener nombre de usuario
      const userDocRef = doc(database, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const fromName = userDocSnapshot.exists()
        ? userDocSnapshot.data().username || "Usuario Desconocido"
        : "Usuario Desconocido";

      // Enviar notificación al amigo invitado
      const notificationRef = collection(database, "users", friendId, "notifications");
      await addDoc(notificationRef, {
        fromId: user.uid,
        fromName: fromName, // Nombre de usuario
        eventTitle: eventTitle,
        eventImage: eventImage, // URL válida de la imagen
        eventDate: eventDate,
        type: "generalEventInvitation",
        status: "pendiente",
        timestamp: new Date(),
      });

      Alert.alert("Invitación enviada", `Has invitado a un amigo al evento ${eventTitle}.`);
    } catch (error) {
      console.error("Error al invitar al evento general:", error);
      Alert.alert("Error", "No se pudo enviar la invitación.");
    }
  };







  const handleRemoveFromEvent = async () => {
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

        console.log("Evento eliminado de la colección del usuario.");
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

          console.log("Usuario eliminado de la lista de asistentes del evento privado.");
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

  const fetchFriends = async () => {
    const user = auth.currentUser;
    if (user) {
      const friendsRef = collection(database, "users", user.uid, "friends");
      const querySnapshot = await getDocs(friendsRef);
      const friendsList = await Promise.all(
        querySnapshot.docs.map(async (friendDoc) => {
          const friendId = friendDoc.data().friendId;
          if (friendId) {
            const friendDocRef = doc(database, "users", friendId);
            const friendData = await getDoc(friendDocRef);
            if (friendData.exists()) {
              return {
                friendId: friendId,
                friendName: friendData.data().username,
                friendImage:
                  friendData.data().friendImage ||
                  friendDoc.data().friendImage ||
                  "https://via.placeholder.com/150",
                invited: false,
              };
            }
          }
          return null;
        })
      );
      const validFriends = friendsList.filter((friend) => friend !== null);
      setFriends(validFriends);
      setFilteredFriends(validFriends);
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleDeleteEvent = async () => {
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

  const handleEditImage = async () => {
    const user = auth.currentUser;

    if (!user || user.uid !== boxData.Admin) {
      Alert.alert("Acceso denegado", "Solo el administrador puede editar la imagen.");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
        Alert.alert("Permiso denegado", "Se requieren permisos para acceder a tus fotos.");
        return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        try {
            setIsProcessing(true);

            // Subir la nueva imagen a Firebase Storage
            const storage = getStorage();
            const imageRef = ref(storage, `EventosParaAmigos/${boxData.id || boxData.title}_${Date.now()}.jpg`);
            const uri = pickerResult.assets[0].uri;
            const response = await fetch(uri);
            const blob = await response.blob();

            await uploadBytes(imageRef, blob);

            // Obtener la URL de descarga
            const downloadURL = await getDownloadURL(imageRef);

            // Actualizar la imagen en Firebase Firestore
            const eventRef = doc(database, "EventsPriv", boxData.id || boxData.title);
            await updateDoc(eventRef, { image: downloadURL });

            // Navegar a Home con el parámetro de recarga
            navigation.navigate("Home", { refresh: true });

            Alert.alert("Éxito", "Imagen actualizada exitosamente");
        } catch (error) {
            console.error("Error al subir la imagen:", error);
            Alert.alert("Error", "Hubo un problema al subir la imagen.");
        } finally {
            setIsProcessing(false);
        }
    }
};





const handleEditEvent = () => {
  const user = auth.currentUser;

  if (!user || user.uid !== boxData.Admin) {
    Alert.alert("Acceso denegado", "Solo el administrador puede editar este evento.");
    return;
  }

  setEditedData({
    title: boxData.title || "",
    address: boxData.address || "",
    description: boxData.description || "",
  });
  setEditModalVisible(true);
  setMenuVisible(false);
};

const handleSaveEdit = async () => {
  try {
      setIsProcessing(true);

      const eventRef = doc(database, "EventsPriv", boxData.id || boxData.title);
      await updateDoc(eventRef, {
          title: editedData.title,
          address: editedData.address,
          description: editedData.description,
      });

      setBoxData((prevData) => ({
          ...prevData,
          title: editedData.title,
          address: editedData.address,
          description: editedData.description,
      }));

      Alert.alert("Éxito", "Evento actualizado exitosamente");
      setEditModalVisible(false);
  } catch (error) {
      console.error("Error al actualizar el evento:", error);
      Alert.alert("Error", "Hubo un problema al actualizar el evento.");
  } finally {
      setIsProcessing(false);
  }
};



  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editModalContent}>
          <Text style={styles.editModalTitle}>Editar Evento</Text>
          {/* Inputs para edición */}
          <TextInput
            style={styles.input}
            value={editedData.title}
            onChangeText={(text) => setEditedData({ ...editedData, title: text })}
            placeholder="Título"
          />
          <TextInput
            style={styles.input}
            value={editedData.address}
            onChangeText={(text) => setEditedData({ ...editedData, address: text })}
            placeholder="Ubicación"
          />
          <TextInput
            style={styles.input}
            value={editedData.description}
            onChangeText={(text) => setEditedData({ ...editedData, description: text })}
            placeholder="Descripción"
            multiline
          />
          {/* Botones */}
          <View style={styles.editModalButtons}>
            <TouchableOpacity
              style={[styles.editModalButton, styles.cancelButton]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.editModalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editModalButton, styles.saveButton]}
              onPress={handleSaveEdit}
              disabled={isProcessing}
            >
              <Text style={styles.editModalButtonText}>
                {isProcessing ? "Guardando..." : "Guardar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const handleInvite = async (friendId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Actualizar el estado local para marcar al usuario como invitado
      setFriends(
        friends.map((friend) =>
          friend.friendId === friendId ? { ...friend, invited: true } : friend
        )
      );

      // Obtener referencia del evento en Firestore
      const eventRef = doc(database, "EventsPriv", box.eventId || box.id || box.title);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        Alert.alert("Error", "El evento no existe.");
        return;
      }

      const eventData = eventDoc.data();
      const invitedFriends = eventData.invitedFriends || [];

      // Verificar si el usuario ya ha sido invitado
      if (invitedFriends.includes(friendId)) {
        Alert.alert("Este usuario ya ha sido invitado.");
        return;
      }

      // Preparar datos del usuario que envía la invitación
      let fromName = user.displayName || "Usuario Desconocido";
      const userDocRef = doc(database, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        fromName = userData.username || fromName;
      }

      const eventDateTimestamp = box.date || new Date();
      let eventDateFormatted = "Fecha no disponible";

      // Formatear la fecha del evento
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

      // Datos adicionales de la notificación
      const eventImage = box.imageUrl;
      const eventCategory = box.category || "Sin categoría";
      const notificationRef = collection(database, "users", friendId, "notifications");

      // Crear la notificación
      await addDoc(notificationRef, {
        fromId: user.uid,
        fromName: fromName,
        fromImage: eventImage,
        eventId: box.id,
        eventTitle: box.title,
        eventImage: eventImage,
        eventDate: eventDateTimestamp,
        date: eventDateFormatted,
        eventCategory: eventCategory,
        type: "invitation",
        status: "pendiente",
        timestamp: new Date(),
      });

      // Actualizar la lista de invitados en el evento
      await updateDoc(eventRef, {
        invitedFriends: arrayUnion(friendId),
      });

      Alert.alert(
        t("boxDetails.invitationSent"),
        t("boxDetails.invitationSentMessage")
      );
    } catch (error) {
      console.error("Error al invitar al usuario:", error);
      Alert.alert("Error", "No se pudo enviar la invitación.");
    }
  };


  const handleAddEvent = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const user = auth.currentUser;
    if (!user || !box) {
      setIsProcessing(false);
      return;
    }

    try {
      const eventsRef = collection(database, "users", user.uid, "events");
      const q = query(eventsRef, where("title", "==", box.title));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Si el evento ya existe, eliminarlo
        const eventDoc = querySnapshot.docs[0];
        await deleteDoc(eventDoc.ref);
        setIsEventSaved(false);

        const eventRef = doc(
          database,
          box.category === "EventoParaAmigos" ? "EventsPriv" : "GoBoxs",
          box.id || box.title
        );

        if (box.category === "EventoParaAmigos") {
          await updateDoc(eventRef, {
            attendees: arrayRemove({ uid: user.uid }),
          });
        } else {
          await handleRemoveFromGoBoxs(box.title, selectedDate);
        }

        console.log("Evento eliminado correctamente.");
      } else {
        // Si el evento no existe, agregarlo
        const eventsSnapshot = await getDocs(eventsRef);
        if (eventsSnapshot.size >= 6) {
          Alert.alert(
            t("boxDetails.limitReached"),
            t("boxDetails.limitReachedMessage"),
            [{ text: t("boxDetails.accept"), style: "default" }]
          );
          setIsProcessing(false);
          return;
        }

        const isPrivateEvent = box.category === "EventoParaAmigos";
        const eventDate = isPrivateEvent ? box.date : selectedDate;
        const eventRef = doc(
          database,
          isPrivateEvent ? "EventsPriv" : "GoBoxs",
          box.id || box.title
        );

        const eventData = {
          title: box.title,
          imageUrl: box.imageUrl || "",
          date: eventDate,
          phoneNumber: box.number || "Sin número",
          locationLink: box.locationLink || "Sin ubicación especificada",
          hours: box.hours || {},
          ...(box.coordinates ? { coordinates: box.coordinates } : {}),
        };

        if (isPrivateEvent) {
          const userDoc = await getDoc(doc(database, "users", user.uid));
          const username = userDoc.exists() ? userDoc.data().username || "Anónimo" : "Anónimo";
          const profileImage = userDoc.exists()
            ? userDoc.data().photoUrls?.[0] || "https://via.placeholder.com/150"
            : "https://via.placeholder.com/150";

          const attendeeData = { uid: user.uid, username, profileImage };

          const eventSnapshot = await getDoc(eventRef);
          if (!eventSnapshot.exists()) {
            await setDoc(eventRef, {
              attendees: [attendeeData],
              ...eventData,
            });
          } else {
            await updateDoc(eventRef, {
              attendees: arrayUnion(attendeeData),
            });
          }
        } else {
          await saveUserEvent(box.title, eventDate, box.day, eventData.phoneNumber, eventData.locationLink, eventData.hours);
        }

        // Guardar el evento en la colección del usuario
        await addDoc(eventsRef, {
          ...eventData,
          dateArray: [eventDate],
        });

        setIsEventSaved(true);
        console.log("Evento agregado correctamente.");
      }
    } catch (error) {
      console.error("Error al manejar el evento:", error);
      Alert.alert(t("boxDetails.error"), t("boxDetails.eventSavingError"));
    } finally {
      setIsProcessing(false);
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

          console.log("Usuario eliminado de GoBoxs correctamente");
        }
      }
    } catch (error) {
      console.error("Error eliminando el usuario de GoBoxs:", error);
    }
  };


  const saveUserEvent = async (
    boxTitle,
    selectedDate,
    daySpecial,
    phoneNumber,
    locationLink,
    hours
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
      };

      if (daySpecial) {
        userDataToSave.DaySpecial = daySpecial;
      }

      await updateDoc(boxRef, {
        [selectedDate]: [...existingData, userDataToSave],
      });

      console.log("Evento guardado exitosamente en Firebase");
    } catch (error) {
      console.error("Error al guardar el evento: ", error);
    }
  };

  const openGoogleMaps = () => {
    if (box.locationLink) {
      Linking.openURL(box.locationLink).catch((err) =>
        console.error("Error al abrir Google Maps:", err)
      );
    } else {
      Alert.alert(
        t("boxDetails.linkNotAvailable"),
        t("boxDetails.linkNotAvailableMessage")
      );
    }
  };

  const renderFriendItem = ({ item }) => (
    <View
      style={[
        styles.friendContainer,
        isNightMode && styles.friendContainerNight,
      ]}
    >
      <Image
        source={{
          uri: item.friendImage || "https://via.placeholder.com/150",
        }}
        style={styles.friendImage}
        cachePolicy="memory-disk"
      />
      <Text style={[styles.friendName, isNightMode && styles.friendNameNight]}>
        {item.friendName}
      </Text>
      {box.category !== "EventoParaAmigos" ? (
        <TouchableOpacity
          style={[
            styles.shareButton,
            item.invited && styles.invitedButton,
            isNightMode && styles.shareButtonNight,
          ]}
          onPress={() => handleGeneralEventInvite(item.friendId)}
          disabled={item.invited}
        >
          <Ionicons
            name={item.invited ? "checkmark-sharp" : "arrow-redo"}
            size={16}
            color={isNightMode ? "black" : "white"}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.shareButton,
            item.invited && styles.invitedButton,
            isNightMode && styles.shareButtonNight,
          ]}
          onPress={() => handleInvite(item.friendId)}
          disabled={item.invited}
        >
          <Ionicons
            name={item.invited ? "checkmark-sharp" : "arrow-redo"}
            size={16}
            color={isNightMode ? "black" : "white"}
          />
        </TouchableOpacity>
      )}
    </View>
  );


  const handleSearch = (text) => {
    setSearchText(text);
    if (text === "") {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter((friend) =>
        friend.friendName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  };

  const renderSliderContent = () => (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.slider}
    >
      {/* Primer Slider */}
      <View style={styles.sliderPart}>
        {box &&
        box.coordinates &&
        typeof box.coordinates.latitude === "number" &&
        typeof box.coordinates.longitude === "number" &&
        box.coordinates.latitude !== 0 &&
        box.coordinates.longitude !== 0 ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: box.coordinates.latitude,
                longitude: box.coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              customMapStyle={isNightMode ? nightMapStyle : dayMapStyle}
            >
              <Marker
                coordinate={{
                  latitude: box.coordinates.latitude,
                  longitude: box.coordinates.longitude,
                }}
                title={box.title || "Evento"}
                description={box.description || ""}
              />
            </MapView>
          </View>
        ) : isFromNotification && box.description ? (
          // Descripción desde la notificación
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {box.description || "Descripción no disponible"}
            </Text>
          </View>
        ) : boxData.description ? (
          // Descripción desde EventsPriv
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {boxData.description || "Descripción no disponible"}
            </Text>
          </View>
        ) : (
          <View style={styles.addressContainer}>
            <Text style={styles.addressTitle}>Ubicación:</Text>
            <Text style={styles.addressText}>
              {boxData.address || "No hay dirección disponible"}
            </Text>
          </View>
        )}
      </View>

     {/* Segundo Slider: Horarios */}
     <View style={styles.sliderPart}>
      <View style={styles.hoursContainer}>
        {isFromNotification && (box.hour || box.day) ? (
          // Mostrar hora y día desde la notificación
          <View style={styles.notificationHours}>
            <Text style={styles.hoursText}>
              {`Hora: ${box.hour || "No disponible"}`}
            </Text>
            <Text style={styles.dayText}>
              {`Día: ${box.day || "No disponible"}`}
            </Text>
          </View>
        ) : (
          // Mostrar horarios desde EventsPriv
          <View style={styles.hoursContent}>
            <View style={styles.column}>
              {Object.keys(boxData.hours || {}).map((day, index) => (
                <Text key={index} style={styles.dayText}>
                  {day}
                </Text>
              ))}
            </View>
            <View style={styles.column}>
              {Object.values(boxData.hours || {}).map((time, index) => (
                <Text key={index} style={styles.timeText}>
                  {time}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>

   {/* Tercer Slider: Ubicación o Contacto */}
<View style={styles.sliderPart}>
  {isFromNotification && box.address ? (
    // Mostrar dirección si proviene de notificación
    <View style={styles.addressContainer}>
      <Text style={styles.addressTitle}>Ubicación:</Text>
      <Text style={styles.addressText}>
        {box.address || "Ubicación no disponible"}
      </Text>
    </View>
  ) : boxData.address ? (
    // Mostrar dirección desde la base de datos para eventos privados
    <View style={styles.addressContainer}>
      <Text style={styles.addressTitle}>Ubicación:</Text>
      <Text style={styles.addressText}>
        {boxData.address || "Ubicación no disponible"}
      </Text>
    </View>
  ) : (
    // Mostrar contacto para eventos generales
    <View style={styles.contactContainer}>
      <Text style={styles.contactTitle}>Contacto:</Text>
      <Text style={styles.contactText}>
        {boxData.number || boxData.phoneNumber || "Sin número de contacto"}
      </Text>
    </View>
  )}
</View>

  </ScrollView>
  );


  return (
    <SafeAreaView style={styles.container}>
      {/* Imagen de fondo */}
      <Image
        source={box.isPrivate ? { uri: box.imageUrl } : box.imageUrl}
        style={styles.backgroundImage}
        cachePolicy="memory-disk"
      />

      {/* Gradiente de fondo */}
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
        style={styles.gradient}
      >
        {/* Contenedor principal */}
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {/* Header */}
          <Header
            navigation={navigation}
            boxData={boxData}
            isNightMode={isNightMode}
            menuVisible={menuVisible}
            toggleMenu={() => setMenuVisible(!menuVisible)}
            handleEditImage={handleEditImage}
            handleEditEvent={handleEditEvent}
            handleDeleteEvent={handleDeleteEvent}
            isProcessing={isProcessing}
          />

          {/* Contenido principal */}
          <View style={styles.content}>
            {/* Título del evento */}
            <Text style={styles.title}>{boxData.title}</Text>

            {/* Indicador de asistentes */}
            <View style={styles.dotIndicatorContainer}>
              {console.log(
                "Datos enviados a DotIndicatorBoxDetails:",
                attendeesList
              )}
              <DotIndicatorBoxDetails attendeesList={attendeesList} />
            </View>

            {/* Sección de botones */}
            <ButtonsSection
              isEventSaved={isEventSaved}
              isProcessing={isProcessing}
              handleAddEvent={handleAddEvent}
              handleRemoveFromEvent={handleRemoveFromEvent}
              setModalVisible={setModalVisible}
              t={t}
            />

            {/* Slider de contenido */}
            <SliderContent
              key={box?.id || box?.title}
              box={box}
              boxData={boxData}
              isNightMode={isNightMode}
              isFromNotification={isFromNotification}
            />

          </View>
        </ScrollView>
      </LinearGradient>

      {/* Modal para invitar amigos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.friendsModalContent,
                  isNightMode && styles.friendsModalContentNight,
                ]}
              >
                {/* Título del modal */}
                <Text
                  style={[
                    styles.modalTitle,
                    isNightMode && styles.modalTitleNight,
                  ]}
                >
                  {t("boxDetails.inviteFriendsTitle")}
                </Text>

                {/* Barra de búsqueda */}
                <TextInput
                  style={[
                    styles.searchInput,
                    isNightMode && styles.searchInputNight,
                  ]}
                  placeholder={t("boxDetails.searchFriendsPlaceholder")}
                  placeholderTextColor={isNightMode ? "#888" : "#888"}
                  value={searchText}
                  onChangeText={handleSearch}
                />

                {/* Lista de amigos */}
                <FlatList
                  data={filteredFriends}
                  renderItem={renderFriendItem}
                  keyExtractor={(item) => item.friendId.toString()}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal para editar el evento */}
      {renderEditModal()}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: null,
    height: null,
    contentFit: "cover",
  },
  gradient: {
    flex: 1,
    justifyContent: "flex-start",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  content: {
    alignItems: "center",
    marginTop: 70,
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "white",
    marginBottom: 60,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 80,
    marginBottom: 70,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  activeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  slider: {
    width: width,
    height: 250,
    marginTop: 60,
  },
  sliderPart: {
    width: width * 0.9,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 10,
  },
  mapContainer: {
    width: width * 0.75,
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  hoursContainer: {
    width: "100%",
    alignItems: "center",
  },
  hoursContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  column: {
    flex: 1,
    paddingHorizontal: 30,
  },
  dayText: {
    color: "white",
    fontWeight: "600",
    fontSize: 11,
    marginBottom: 5,
    textAlign: "right",
    paddingRight: 0,
  },
  timeText: {
    color: "white",
    fontWeight: "600",
    fontSize: 11,
    marginBottom: 5,
    textAlign: "left",
    paddingLeft: 0,
  },
  hoursTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    width: "100%",
  },
  contactContainer: {
    padding: 15,
    alignItems: "center",
    width: "90%",
  },
  contactTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  contactText: {
    color: "white",
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    width: "100%",
    position: "absolute",
    top: 0,
    zIndex: 10,
  },
  backButton: {
    paddingLeft: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "transparent",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteEventButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  deleteEventText: {
    color: "white",
    fontWeight: "bold",
  },
  editEventButton: {
    backgroundColor: "white", // Puedes cambiar el color según tu preferencia
    padding: 10,
    borderRadius: 5,
    marginBottom: 10, // Espacio entre los botones
  },
  editEventText: {
    color: "black",
    fontWeight: "bold",
  },
  friendsModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    width: "90%",
  },
  friendsModalContentNight: {
    backgroundColor: "#1a1a1a",
  },
  modalTitle: {
    color: "black",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalTitleNight: {
    color: "white",
  },
  searchInput: {
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: "#333",
  },
  searchInputNight: {
    borderColor: "black",
    color: "white",
    backgroundColor: "#333",
  },
  friendContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  friendContainerNight: {
    borderBottomColor: "#444",
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  friendNameNight: {
    color: "white",
  },
  shareButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  shareButtonNight: {
    backgroundColor: "black",
  },
  invitedButton: {
    backgroundColor: "gray",
  },
  closeModalButton: {
    marginTop: 20,
    backgroundColor: "#black",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeModalButtonNight: {
    backgroundColor: "black",
  },
  closeModalText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeModalTextNight: {
    color: "black",
  },
  dotIndicatorContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    marginVertical: 20,
    alignItems: "center",
    height: 60,
  },
  descriptionContainer: {
    padding: 15,
    alignItems: "center",
    width: "90%",
  },
  descriptionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  descriptionText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  addressContainer: {
    padding: 15,
    alignItems: "center",
    width: "90%",
  },
  addressTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  addressText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },

  editModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  editModalButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  editModalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  notificationHours: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  hoursText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
  dayText: {
    fontSize: 16,
    color: "white",
  },
});

const nightMapStyle = [];

const dayMapStyle = [];

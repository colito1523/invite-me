import { styles } from "./styles";
import React, { useState, useEffect, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, database } from "../../config/firebase";
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
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { Image } from "expo-image";
import DotIndicatorBoxDetails from "../../Components/Dots/DotIndicatorBoxDetails";
import { useTranslation } from "react-i18next";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import Header from "./BoxDetailsComponents/Header";
import ButtonsSection from "./BoxDetailsComponents/ButtonsSection";
import SliderContent from "./BoxDetailsComponents/SliderContent";
import InviteFriendsModal from "./BoxDetailsComponents/InviteFriendsModal";
import {
  handleInvite,
  fetchAttendees,
  checkNightMode,
  checkEventStatus,
  handleGeneralEventInvite,
  checkAndRemoveExpiredEvents,
} from "./utils";

export default memo(function BoxDetails({ route, navigation }) {
  const { t } = useTranslation();
  const { box, selectedDate, isFromNotification } = route.params || {};
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

  useEffect(() => {
    const start = Date.now(); // Marca el tiempo inicial

    return () => {
      const end = Date.now(); // Marca el tiempo al desmontar
      console.log(`Tiempo de desmontaje: ${end - start}ms`);
    };
  }, []);

  useEffect(() => {
    if (box) {
      checkEventStatus({ box, selectedDate, setIsEventSaved });
    }
  }, [box, selectedDate]);

  const closeModal = () => {
    setModalVisible(false);
  };

  const fetchEventDetails = async ({ box, setBoxData }) => {
    try {
      // Referencia al documento del evento
      const eventRef = doc(database, "EventsPriv", box.id || box.title);
      const eventSnapshot = await getDoc(eventRef);

      if (eventSnapshot.exists()) {
        const eventData = eventSnapshot.data();

        // Actualiza `setBoxData` con los datos obtenidos, incluidos Admin y category
        setBoxData((prevData) => ({
          ...prevData,
          description: eventData.description || prevData.description,
          address: eventData.address || prevData.address,
          Admin: eventData.Admin || prevData.Admin, // Agregar Admin
          category: eventData.category || prevData.category, // Agregar category
          // ...otros campos necesarios
        }));
      } else {
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  useEffect(() => {
    if (box && !isFromNotification) {
      // Solo fetch de datos si no viene de una notificación
      fetchEventDetails({ box, setBoxData });
    }
    if (isFromNotification) {
      console.log("Datos recibidos desde la notificación:", {
        box,
        selectedDate,
        isFromNotification,
      });
    } else {
      console.log("Datos del evento:", box); // Add this line to log all event data
    }
  }, [box, isFromNotification]);

  useEffect(() => {
    let unsubscribeAttendees;

    const fetchDetailsAndAttendees = async () => {
      if (!box) return;

      try {
        await Promise.allSettled([
          fetchEventDetails({ box, setBoxData }),
          (unsubscribeAttendees = fetchAttendees({
            box,
            selectedDate,
            setAttendeesList,
          })),
        ]);

        setTimeout(() => {
          fetchFriends();
          checkNightMode(setIsNightMode);
          checkAndRemoveExpiredEvents(box.title);
        }, 300);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchDetailsAndAttendees();

    return () => {
      if (typeof unsubscribeAttendees === "function") {
        unsubscribeAttendees();
      }
    };
  }, [box, selectedDate]);

  useEffect(() => {
    if (!box || box.category !== "EventoParaAmigos") return;

    const eventRef = doc(
      database,
      "EventsPriv",
      box.eventId || box.id || box.title,
    );

    const unsubscribe = onSnapshot(eventRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const eventData = docSnapshot.data();
        setBoxData((prevData) => ({
          ...prevData,
          invitedFriends: eventData.invitedFriends || [],
        }));
      }
    });

    return () => unsubscribe();
  }, [box]);

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

  const handleDeleteEvent = async () => {
    try {
      setIsProcessing(true);
      const eventRef = doc(database, "EventsPriv", box.id || box.title);
      await deleteDoc(eventRef);
      navigation.navigate("Home", { refresh: true });
      Alert.alert(
        t("indexBoxDetails.succes"),
        t("indexBoxDetails.eventDeleteSuccess"),
      );
    } catch (error) {
      console.error("Error deleting event:", error);
      Alert.alert(
        t("indexBoxDetails.error"),
        t("indexBoxDetails.eventDeleteError"),
      );
    } finally {
      setIsProcessing(false);
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
        }),
      );
      const validFriends = friendsList.filter((friend) => friend !== null);
      setFriends(validFriends);
      setFilteredFriends(validFriends);
    }
  };

  const handleEditImage = async () => {
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

        // Actualizar la imagen en Firebase Firestore
        const eventRef = doc(
          database,
          "EventsPriv",
          boxData.id || boxData.title,
        );
        await updateDoc(eventRef, { image: downloadURL });

        // Navegar a Home con el parámetro de recarga
        navigation.navigate("Home", { refresh: true });

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

  const handleEditEvent = () => {
    const user = auth.currentUser;

    if (!user || user.uid !== boxData.Admin) {
      Alert.alert(
        t("indexBoxDetails.accessDenied"),
        t("indexBoxDetails.onlyAdminCanEdit"),
      );
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
      const updatedData = {
        title: editedData.title,
        address: editedData.address,
        description: editedData.description,
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

        // Buscar el documento que coincida con el `eventId`
        const querySnapshot = await getDocs(
          query(
            eventsCollectionRef,
            where("eventId", "==", boxData.id || boxData.title),
          ),
        );

        querySnapshot.forEach(async (docSnapshot) => {
          // Actualizar el documento encontrado
          await updateDoc(docSnapshot.ref, updatedData);
        });

        // Actualizar las notificaciones en /users/{userId}/notifications
        const notificationsCollectionRef = collection(
          database,
          "users",
          attendee.uid,
          "notifications",
        );

        const notificationsSnapshot = await getDocs(
          query(
            notificationsCollectionRef,
            where("eventId", "==", boxData.id || boxData.title),
          ),
        );

        notificationsSnapshot.forEach(async (notificationSnapshot) => {
          await updateDoc(notificationSnapshot.ref, {
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

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editModalContent}>
          <Text style={styles.editModalTitle}>
            {t("indexBoxDetails.editEvent")}
          </Text>
          {/* Inputs para edición */}
          <TextInput
            style={styles.input}
            value={editedData.title}
            onChangeText={(text) =>
              setEditedData({ ...editedData, title: text })
            }
            placeholder={t("indexBoxDetails.titlePlaceholder")}
          />
          <TextInput
            style={styles.input}
            value={editedData.address}
            onChangeText={(text) =>
              setEditedData({ ...editedData, address: text })
            }
            placeholder={t("indexBoxDetails.addressPlaceholder")}
          />
          <TextInput
            style={styles.input}
            value={editedData.description}
            onChangeText={(text) =>
              setEditedData({ ...editedData, description: text })
            }
            placeholder={t("indexBoxDetails.descriptionPlaceholder")}
            multiline
          />
          {/* Botones */}
          <View style={styles.editModalButtons}>
            <TouchableOpacity
              style={[styles.editModalButton, styles.cancelButton]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.editModalButtonText}>
                {t("storyViewer.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editModalButton, styles.saveButton]}
              onPress={handleSaveEdit}
              disabled={isProcessing}
            >
              <Text style={styles.editModalButtonText}>
                {isProcessing
                  ? t("storyViewer.saving")
                  : t("storyViewer.saver")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ...existing code...
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
      const q = query(eventsRef, where("eventId", "==", box.eventId || box.id || box.title));
      const querySnapshot = await getDocs(q);

      const isPrivateEvent =
        box.category === "EventoParaAmigos" || box.isPrivate;
      const eventDate = isPrivateEvent ? box.date : selectedDate;
      const eventId = box.eventId || box.id || box.title; // Ensure eventId is defined
      const eventRef = doc(database, "EventsPriv", eventId);

      if (!querySnapshot.empty) {
        // Check if the event for the selected date already exists
        const existingEvent = querySnapshot.docs.find((doc) =>
          doc.data().dateArray.includes(eventDate),
        );
        if (existingEvent) {
          // If the event for the selected date exists, remove it
          await deleteDoc(existingEvent.ref);
          setIsEventSaved(false);

          if (isPrivateEvent) {
            const eventSnapshot = await getDoc(eventRef);
            if (eventSnapshot.exists()) {
              const eventData = eventSnapshot.data();
              const updatedAttendees = eventData.attendees.filter(
                (attendee) => attendee.uid !== user.uid,
              );
              await updateDoc(eventRef, {
                attendees: updatedAttendees,
              });
            }
          } else {
            await handleRemoveFromGoBoxs(box.title, eventDate);
          }
        } else {
          // If the event for the selected date does not exist, add it
          await addEventToUser(eventsRef, eventDate, eventRef, isPrivateEvent);
        }
      } else {
        // If no events exist, add the new event
        await addEventToUser(eventsRef, eventDate, eventRef, isPrivateEvent);
      }

      setIsEventSaved(true);
    } catch (error) {
      console.error("Error al manejar el evento:", error);
      Alert.alert(t("boxDetails.error"), t("boxDetails.eventSavingError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const addEventToUser = async (
    eventsRef,
    eventDate,
    eventRef,
    isPrivateEvent,
  ) => {
    const eventsSnapshot = await getDocs(eventsRef);
    if (eventsSnapshot.size >= 6) {
      Alert.alert(
        t("boxDetails.limitReached"),
        t("boxDetails.limitReachedMessage"),
        [{ text: t("boxDetails.accept"), style: "default" }],
      );
      setIsProcessing(false);
      return;
    }

    const eventId = box.eventId || box.id || box.title; // Ensure eventId is defined
    if (!eventId) {
      console.error("Event ID is undefined");
      Alert.alert(t("boxDetails.error"), t("boxDetails.eventIdError"));
      setIsProcessing(false);
      return;
    }

    // Convertir la fecha del evento a un objeto Date
    const [day, month] = eventDate.split(" ");
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

    const eventData = {
      expirationDate: Timestamp.fromDate(expirationDate),
      title: box.title,
      category: box.category || "General",
      date: box.date,
      dateArray: [eventDate],
      description: box.description || "",
      address: box.address || "",
      imageUrl: box.imageUrl || "",
      date: eventDate,
      phoneNumber: box.number || "Sin número",
      locationLink: box.locationLink || "Sin ubicación especificada",
      hours: box.hours || {},
      uid: box.Admin || auth.currentUser?.uid,
      Admin: box.Admin || auth.currentUser?.uid,
      eventId: box.eventId || box.id || box.title,
      status: "accepted",
      coordinates: box.coordinates || {},
    };

    // Agregar expirationDate solo para eventos privados
    if (isPrivateEvent && box.expirationDate) {
      eventData.expirationDate = box.expirationDate;
    }

    if (isPrivateEvent) {
      const userDoc = await getDoc(
        doc(database, "users", auth.currentUser.uid),
      );
      const username = userDoc.exists()
        ? userDoc.data().username || "Anónimo"
        : "Anónimo";
      const profileImage = userDoc.exists()
        ? userDoc.data().photoUrls?.[0] || "https://via.placeholder.com/150"
        : "https://via.placeholder.com/150";

      const attendeeData = {
        uid: auth.currentUser.uid,
        username,
        profileImage,
      };

      const eventSnapshot = await getDoc(eventRef);
      if (eventSnapshot.exists()) {
        const eventDetails = eventSnapshot.data();
        eventData.description =
          eventDetails.description || eventData.description;
        eventData.address = eventDetails.address || eventData.address;

        await updateDoc(eventRef, {
          attendees: arrayUnion(attendeeData),
        });
      } else {
        console.error("Event does not exist in EventsPriv");
        Alert.alert(t("boxDetails.error"), t("boxDetails.eventNotFound"));
        setIsProcessing(false);
        return;
      }
    } else {
      await saveUserEvent(
        box.title,
        eventDate,
        box.day,
        eventData.phoneNumber,
        eventData.locationLink,
        eventData.hours,
        eventData.coordinates,
        eventData.imageUrl,
      );
    }

    await addDoc(eventsRef, {
      ...eventData,
      dateArray: [eventDate],
    });
  };

  const saveUserEvent = async (
    boxTitle,
    selectedDate,
    daySpecial,
    phoneNumber,
    locationLink,
    hours,
    coordinates,
    imageUrl,
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
        coordinates: coordinates, // Add coordinates
        imageUrl: imageUrl, // Add imageUrl
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

  const renderFriendItem = ({ item }) => {
    let isInvited, hasBeenInvited, isDisabled;

    if (box.category !== "EventoParaAmigos") {
      // Lógica para eventos generales
      isInvited = attendeesList.some(
        (attendee) => attendee.uid === item.friendId,
      );
      hasBeenInvited = attendeesList.some(
        (attendee) =>
          attendee.invitations &&
          attendee.invitations.some(
            (invitation) =>
              invitation.invitedTo === item.friendId &&
              invitation.invitedBy === auth.currentUser.uid,
          ),
      );
      isDisabled = isInvited || hasBeenInvited;
    } else {
      // Lógica para eventos privados
      isInvited = boxData.invitedFriends?.includes(item.friendId);
      const isAttending = attendeesList.some(
        (attendee) => attendee.uid === item.friendId,
      );
      isDisabled = isInvited || isAttending;
    }

    return (
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
        <Text
          style={[styles.friendName, isNightMode && styles.friendNameNight]}
        >
          {item.friendName}
        </Text>
        {box.category !== "EventoParaAmigos" ? (
          // Botón para eventos generales
          <TouchableOpacity
            style={[
              styles.shareButton,
              isDisabled && styles.invitedButton,
              isNightMode && styles.shareButtonNight,
            ]}
            onPress={() =>
              handleGeneralEventInvite({
                friendId: item.friendId,
                isEventSaved,
                box,
                selectedDate,
              })
            }
            disabled={isDisabled}
          >
            <Ionicons
              name={isDisabled ? "close-sharp" : "paper-plane"}
              size={20}
              color={isNightMode ? "white" : "black"}
            />
          </TouchableOpacity>
        ) : (
          // Botón para eventos privados
          <TouchableOpacity
            style={[
              styles.shareButton,
              isDisabled && styles.invitedButton,
              isNightMode && styles.shareButtonNight,
            ]}
            onPress={() =>
              handleInvite({
                box,
                friends,
                isEventSaved,
                selectedDate,
                friendId: item.friendId,
                setFriends,
                t,
              })
            }
            disabled={isDisabled}
          >
            <Ionicons
              name={isDisabled ? "close-sharp" : "paper-plane"}
              size={20}
              color={isNightMode ? "white" : "black"}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (text === "") {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter((friend) =>
        friend.friendName.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredFriends(filtered);
    }
  };

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
              box={box}
              boxData={boxData}
            />

            {/* Slider de contenido */}
            <SliderContent
              key={box?.id || box?.title}
              box={box}
              boxData={boxData}
              isNightMode={isNightMode}
              isFromNotification={isFromNotification}
              showDescription={box.category === "EventoParaAmigos"} // Add this prop to control the display
            />
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Modal para invitar amigos */}
      <InviteFriendsModal
        modalVisible={modalVisible}
        closeModal={closeModal}
        isNightMode={isNightMode}
        searchText={searchText}
        handleSearch={handleSearch}
        filteredFriends={filteredFriends}
        renderFriendItem={renderFriendItem}
        styles={styles}
        attendeesList={attendeesList} // Pasar la lista de asistentes
      />

      {/* Modal para editar el evento */}
      {renderEditModal()}
    </SafeAreaView>
  );
});

const nightMapStyle = [];

const dayMapStyle = [];

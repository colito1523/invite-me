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
} from "firebase/firestore";
import { Image } from "expo-image";
import DotIndicatorBoxDetails from "../Components/Dots/DotIndicatorBoxDetails";
import { useTranslation } from "react-i18next";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

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
      const unsub = onSnapshot(eventRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log("Datos del evento obtenidos:", data);
  
          // Selección de asistentes según el tipo de evento
          const attendees =
            box.category === "EventoParaAmigos"
              ? data.attendees || [] // Para eventos privados
              : data[selectedDate] || []; // Para eventos generales
  
          // Procesa los asistentes para asegurar imágenes de perfil
          const uniqueAttendees = attendees.map((attendee) => ({
            ...attendee,
            profileImage: attendee.profileImage || "https://via.placeholder.com/150",
          }));
  
          console.log("Asistentes únicos procesados:", uniqueAttendees);
          setAttendeesList(uniqueAttendees);
        } else {
          console.error("El evento no existe en la base de datos.");
          setAttendeesList([]); // Limpia la lista local si no existe
        }
      });
  
      return unsub; // Devuelve la función para limpiar el listener
    }
  };
  
  
  

  const handleRemoveFromEvent = async () => {
    const user = auth.currentUser;
    if (!user || !box) return;
  
    try {
      const eventRef = doc(
        database,
        box.category === "EventoParaAmigos" ? "EventsPriv" : "GoBoxs",
        box.eventId || box.id || box.title
      );
  
      // Verificar si el documento del evento existe
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
  
        // Filtrar al usuario actual de la lista de asistentes
        const updatedAttendees = (eventData.attendees || []).filter(
          (attendee) => attendee.uid !== user.uid
        );
  
        // Actualizar la lista de asistentes en el documento del evento
        await updateDoc(eventRef, {
          attendees: updatedAttendees,
        });
  
        console.log("Usuario eliminado de la lista de asistentes del evento.");
        setAttendeesList(updatedAttendees); // Actualizar el estado local
      } else {
        console.error("El evento no existe en la base de datos.");
      }
  
      // Eliminar el evento de la colección de eventos del usuario
      const userEventsRef = collection(database, "users", user.uid, "events");
      const q = query(userEventsRef, where("title", "==", box.title));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const userEventDoc = querySnapshot.docs[0];
        await deleteDoc(doc(userEventsRef, userEventDoc.id));
        console.log("Evento eliminado de la colección del usuario.");
      }
  
      setIsEventSaved(false);
      Alert.alert("Has marcado 'No voy'");
    } catch (error) {
      console.error("Error al eliminar del evento: ", error);
      Alert.alert("Error", "No se pudo eliminar del evento");
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
    setFriends(
      friends.map((friend) =>
        friend.friendId === friendId ? { ...friend, invited: true } : friend
      )
    );

    const user = auth.currentUser;
    if (user) {
      let fromName = user.displayName || "Usuario Desconocido";
      let fromImage = user.photoURL || "";

      const userDocRef = doc(database, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        fromName = userData.username || fromName;
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
        "notifications"
      );

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

      Alert.alert(
        t("boxDetails.invitationSent"),
        t("boxDetails.invitationSentMessage")
      );
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

    const eventsRef = collection(database, "users", user.uid, "events");
    const q = query(eventsRef, where("title", "==", box.title));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      try {
        const eventDoc = querySnapshot.docs[0];
        await deleteDoc(doc(eventsRef, eventDoc.id));
        setIsEventSaved(false);

        if (box.category === "EventoParaAmigos") {
            const eventRef = doc(database, "EventsPriv", box.id);
            await updateDoc(eventRef, {
                attendees: arrayRemove({
                    uid: user.uid,
                }),
            });
        } else {
            await handleRemoveFromGoBoxs(box.title, selectedDate);
        }

        await fetchAttendees();
    } catch (error) {
        console.error("Error eliminando el evento: ", error);
        Alert.alert(t("boxDetails.error"), t("boxDetails.eventDeletionError"));
    }
} else {
      const eventsSnapshot = await getDocs(eventsRef);
      const eventCount = eventsSnapshot.size;

      if (eventCount >= 6) {
        Alert.alert(
          t("boxDetails.limitReached"),
          t("boxDetails.limitReachedMessage"),
          [{ text: t("boxDetails.accept"), style: "default" }]
        );
      } else {
        try {
          const isPrivateEvent = box.category === "EventoParaAmigos";
          const eventDate = isPrivateEvent ? box.date : selectedDate;
          const daySpecial = isPrivateEvent && box.day ? box.day : undefined;
          const phoneNumber = box.number || "Sin número";
          const locationLink = box.locationLink || "Sin ubicación especificada";
          const hours = box.hours || {};

          if (!isPrivateEvent) {
            await saveUserEvent(
              box.title,
              eventDate,
              daySpecial,
              phoneNumber,
              locationLink,
              hours
            );
          }

          const dateArray = [eventDate];

          const eventData = {
            title: box.title,
            imageUrl: box.imageUrl || "",
            date: eventDate,
            dateArray: dateArray,
            phoneNumber: phoneNumber,
            locationLink: locationLink,
            hours: hours,
            ...(box.coordinates ? { coordinates: box.coordinates } : {}),
          };

          if (daySpecial) {
            eventData.DaySpecial = daySpecial;
          }

          await addDoc(eventsRef, eventData);

          if (isPrivateEvent) {
            const userDoc = await getDoc(doc(database, "users", user.uid));
            const username = userDoc.exists()
              ? userDoc.data().username
              : "Anónimo";
            const profileImage = userDoc.exists()
              ? (userDoc.data().photoUrls && userDoc.data().photoUrls[0]) ||
                "https://via.placeholder.com/150"
              : "https://via.placeholder.com/150";

            const attendeeData = {
              uid: user.uid,
              username,
              profileImage,
            };

            const eventRef = doc(database, "EventsPriv", box.id);

            const eventDoc = await getDoc(eventRef);
            if (!eventDoc.exists()) {
              await setDoc(eventRef, {
                attendees: [],
                title: box.title,
                date: box.date || "",
                hour: box.hour || "",
                description: box.description || "",
                image: box.image || "",
              });
            }

            await updateDoc(eventRef, {
              attendees: arrayUnion(attendeeData),
            });
          }

          setIsEventSaved(true);
          await fetchAttendees();
        } catch (error) {
          console.error("Error guardando el evento: ", error);
          Alert.alert(t("boxDetails.error"), t("boxDetails.eventSavingError"));
        }
      }
    }

    setIsProcessing(false);
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
      <Image 
  source={box.isPrivate ? { uri: box.imageUrl } : box.imageUrl}
  style={styles.backgroundImage}
  cachePolicy="memory-disk"
/>

      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {/* Contenedor de la flecha de volver y el menú */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Entypo
                name="chevron-left"
                size={24}
                color={isNightMode ? "#000" : "#000"}
              />
            </TouchableOpacity>

            {boxData.category === "EventoParaAmigos" && (
              <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                <Entypo
                  name="dots-three-vertical"
                  size={24}
                  color={isNightMode ? "#000" : "#000"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Modal para el menú de eliminación */}
          <Modal
            visible={menuVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={() => setMenuVisible(false)}
            >
              <View style={styles.menuContainer}>
              <TouchableOpacity
                  onPress={handleEditImage}
                  style={styles.editEventButton}
                  disabled={isProcessing}
                >
                  <Text style={styles.editEventText}>
                    {isProcessing ? "Actualizando..." : "Editar Imagen "}
                    <Ionicons name="image" size={15} color="black" />
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEditEvent}
                  style={styles.editEventButton}
                >
                  <Text style={styles.editEventText}>
                    Editar Evento{" "}
                    <Ionicons name="pencil" size={15} color="black" />
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteEvent}
                  style={styles.deleteEventButton}
                >
                  <Text style={styles.deleteEventText}>
                    Eliminar Evento{" "}
                    <FontAwesome name="trash" size={15} color="white" />
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Contenido principal */}
          <View style={styles.content}>
            <Text style={styles.title}>{boxData.title}</Text>

            <View style={styles.dotIndicatorContainer}>
            {console.log("Datos enviados a DotIndicatorBoxDetails:", attendeesList)}
              <DotIndicatorBoxDetails attendeesList={attendeesList} />
            </View>

            <View style={styles.buttonContainer}>
            <TouchableOpacity
  style={[styles.button, isEventSaved && styles.activeButton]}
  disabled={isProcessing}
  onPress={() => {
    if (isEventSaved) {
      handleRemoveFromEvent(); // Elimina al usuario del evento
    } else {
      handleAddEvent(); // Agrega al usuario al evento
    }
  }}
>
  <Text style={styles.buttonText}>
    {isEventSaved
      ? t("boxDetails.notGoingButton") // Texto para "No voy"
      : t("boxDetails.goingButton")}
  </Text>
</TouchableOpacity>

  <TouchableOpacity
    style={styles.button}
    onPress={() => setModalVisible(true)}
  >
    <Text style={styles.buttonText}>
      {t("boxDetails.inviteButton")}
    </Text>
  </TouchableOpacity>
</View>


            {renderSliderContent()}
          </View>
        </ScrollView>
      </LinearGradient>

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
                <Text
                  style={[
                    styles.modalTitle,
                    isNightMode && styles.modalTitleNight,
                  ]}
                >
                  {t("boxDetails.inviteFriendsTitle")}
                </Text>
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

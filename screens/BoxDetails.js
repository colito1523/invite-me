import React, { useState, useEffect, memo  } from "react";
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
  TouchableWithoutFeedback 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, Entypo } from "@expo/vector-icons";
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
  arrayRemove
} from "firebase/firestore";
import { Image } from "expo-image";
import DotIndicatorBoxDetails from "../Components/Dots/DotIndicatorBoxDetails";
import { useTranslation } from "react-i18next";
import { Ionicons } from '@expo/vector-icons'; // Asegúrate de importar Ionicons


const { width } = Dimensions.get("window");

export default memo(function BoxDetails({ route, navigation }) {
  const { t } = useTranslation();
  const { box, selectedDate } = route.params || {};
  const [isEventSaved, setIsEventSaved] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const [attendeesList, setAttendeesList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    if (box) {
      checkEventStatus();
      fetchFriends();
      checkNightMode();
      checkAndRemoveExpiredEvents();
  
      // Llamar a fetchAttendees y guardar la función de desuscripción
      const unsubscribe = fetchAttendees();
  
      // Limpieza de la suscripción al desmontar el componente
      return () => unsubscribe && unsubscribe();
    }
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

  const fetchAttendees = () => {
    if (box) {
      const eventRef = doc(
        database,
        box.category === "EventoParaAmigos" ? "EventsPriv" : "GoBoxs",
        box.id || box.title
      );
  
      // Escucha en tiempo real para cambios en los asistentes
      const unsub = onSnapshot(eventRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const attendees =
            box.category === "EventoParaAmigos"
              ? data.attendees
              : data[selectedDate] || [];
  
              const uniqueAttendees = (attendees || []).map((attendee) => ({
                ...attendee,
                profileImage: attendee.profileImage || "https://via.placeholder.com/150",
              }));
          setAttendeesList(uniqueAttendees);
        }
      });
  
      // Retornar la función para cancelar la suscripción
      return unsub;
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
                friendImage: friendData.data().friendImage || friendDoc.data().friendImage || "https://via.placeholder.com/150",
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
      // Lógica para eliminar asistencia
      try {
        const eventDoc = querySnapshot.docs[0];
        await deleteDoc(doc(eventsRef, eventDoc.id));
        setIsEventSaved(false);
  
        if (box.category === "EventoParaAmigos") {
          // Lógica para eventos privados: elimina al usuario de la lista de asistentes
          const eventRef = doc(database, "EventsPriv", box.id);
          await updateDoc(eventRef, {
            attendees: arrayRemove({
              uid: user.uid,
            }),
          });
        } else {
          // Lógica para otros eventos
          await handleRemoveFromGoBoxs(box.title, selectedDate);
        }
  
        await fetchAttendees();
      } catch (error) {
        console.error("Error eliminando el evento: ", error);
        Alert.alert(t("boxDetails.error"), t("boxDetails.eventDeletionError"));
      }
    } else {
      // Lógica para agregar asistencia si no existe
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
  
          // Construye el objeto de datos del evento, agregando las coordenadas solo si están definidas
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
          uri: item.friendImage || "https://via.placeholder.com/150"
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
        <FontAwesome
          name={item.invited ? "check" : "share"}
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
          <View style={styles.content}>
            <Text style={styles.title}>{box.title}</Text>

            <View style={styles.dotIndicatorContainer}>
              <DotIndicatorBoxDetails attendeesList={attendeesList} />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, isEventSaved && styles.activeButton]}
                disabled={isProcessing} 
                onPress={handleAddEvent}
              >
                <Text style={styles.buttonText}>
                  {isEventSaved
                    ? t("boxDetails.notGoingButton")
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

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.slider}
            >
              <View style={styles.sliderPart}>
                {box &&
                  box.coordinates &&
                  typeof box.coordinates.latitude === "number" &&
                  typeof box.coordinates.longitude === "number" &&
                  box.coordinates.latitude !== 0 &&
                  box.coordinates.longitude !== 0 && (
                    <View style={styles.mapContainer}>
                      <MapView
                        style={styles.map}
                        initialRegion={{
                          latitude: box.coordinates.latitude,
                          longitude: box.coordinates.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                        customMapStyle={
                          isNightMode ? nightMapStyle : dayMapStyle
                        }
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
                  )}
              </View>

              <View style={styles.sliderPart}>
                <View style={styles.hoursContainer}>
                  <Text style={styles.hoursTitle}>
                    {t("boxDetails.scheduleTitle")}
                  </Text>
                  <View style={styles.hoursContent}>
                    <View style={styles.column}>
                      {Object.keys(box.hours).map((day, index) => (
                        <Text key={index} style={styles.dayText}>
                          {day}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.column}>
                      {Object.values(box.hours).map((time, index) => (
                        <Text key={index} style={styles.timeText}>
                          {time}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.sliderPart}>
                <View style={styles.contactContainer}>
                  <Text style={styles.contactTitle}>
                    {t("boxDetails.contactTitle")}
                  </Text>
                  <Text style={styles.contactText}>
                    {box.number  || box.phoneNumber}
                  </Text>
                </View>
              </View>
            </ScrollView>
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
              style={[styles.modalTitle, isNightMode && styles.modalTitleNight]}
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
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    marginBottom: 60,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
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
});

const nightMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#212121" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#212121" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1b1b1b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [{ color: "#4e4e4e" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];

const dayMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { addDoc, collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { database, auth, storage } from "../config/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useBlockedUsers } from "../src/contexts/BlockContext";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function CreateEvent() {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [category] = useState("EventoParaAmigos");
  const [day, setDay] = useState(new Date());
  const [hour, setHour] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [image, setImage] = useState(null);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const navigation = useNavigation();
  const blockedUsers = useBlockedUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);

  const today = new Date();
  const maxDate = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000); // Max 1 month from today

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            t("createEvent.permissionsError"),
            t("createEvent.permissionsMessage")
          );
        }
      }
    })();
    fetchFriends();
  }, []);

  const theme = isNightMode ? darkTheme : lightTheme;

  const fetchFriends = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const friendsRef = collection(database, "users", user.uid, "friends");
        const friendsSnapshot = await getDocs(friendsRef);
  
        const userDocRef = doc(database, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        const blockedUsers = userDocSnapshot.data()?.blockedUsers || [];
  
        const friendsList = friendsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((friend) => !blockedUsers.includes(friend.friendId));
  
        setFriends(friendsList);
      } catch (error) {
        console.error("Error al cargar los amigos:", error);
      }
    }
  };

  const sendInvitationNotifications = async (eventData, eventId) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(database, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        const userData = userDocSnapshot.data();
  
        const blockedUsers = userData?.blockedUsers || [];
  
        for (const friendDocId of selectedFriends) {
          if (blockedUsers.includes(friendDocId)) {
            continue;
          }
  
          const friendDocRef = doc(
            database,
            "users",
            user.uid,
            "friends",
            friendDocId
          );
          const friendDocSnapshot = await getDoc(friendDocRef);
          const friendData = friendDocSnapshot.data();
  
          if (friendData && friendData.friendId) {
            const notificationRef = collection(
              database,
              "users",
              friendData.friendId,
              "notifications"
            );
            await addDoc(notificationRef, {
              fromId: user.uid,
              fromName: userData.username,
              fromImage: eventData.image,
              eventTitle: eventData.title,
              eventImage: eventData.image,
              eventDate: eventData.timestamp,
              date: eventData.date,
              day: eventData.day,
              hour: eventData.hour,
              address: eventData.address,
              description: eventData.description,
              phoneNumber: eventData.phoneNumber || "No disponible",
              eventCategory: eventData.category,
              eventId: eventId,
              type: "invitation",
              status: "pending",
              timestamp: new Date(),
            });
          }
        }
      } catch (error) {
        console.error("Error al enviar notificaciones:", error);
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (blockedUsers.includes(auth.currentUser.uid)) {
      Alert.alert(t("createEvent.error"), t("createEvent.blockedError"));
      return;
    }

    if (
      !title ||
      !day ||
      !hour ||
      !address ||
      !description ||
      !image ||
      selectedFriends.length === 0
    ) {
      Alert.alert(
        t("createEvent.requiredFields"),
        t("createEvent.fillAllFields")
      );
      return;
    }
    setIsSubmitting(true);

    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(database, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        const userData = userDocSnapshot.data();

        const response = await fetch(image);
        const blob = await response.blob();
        const imageRef = ref(
          storage,
          `EventosParaAmigos/${user.uid}_${Date.now()}.jpg`
        );
        await uploadBytes(imageRef, blob);

        const imageUrl = await getDownloadURL(imageRef);

        const eventDateTime = new Date(day);
        eventDateTime.setHours(hour.getHours(), hour.getMinutes());

        const expirationDate = new Date(
          eventDateTime.getTime() + 24 * 60 * 60 * 1000
        );

        const dateText = day.toLocaleDateString(t("locale"), {
          day: "numeric",
          month: "short",
        });

        const eventData = {
          userId: user.uid,
          username: userData.username,
          title,
          category,
          day: day.toLocaleDateString(),
          date: dateText,
          hour: hour.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          address,
          description,
          image: imageUrl,
          timestamp: new Date(),
          invitedFriends: selectedFriends,
          expirationDate: expirationDate,
          Admin: user.uid,
        };

        const docRef = await addDoc(
          collection(database, "EventsPriv"),
          eventData
        );

        await updateDoc(docRef, { eventId: docRef.id });

        await sendInvitationNotifications(
          { ...eventData, eventId: docRef.id },
          docRef.id
        );

        Alert.alert(t("createEvent.success"), t("createEvent.eventCreated"));
        navigation.navigate("Home", { 
          screen: "Home",
          params: { selectedCategory: "all" }
        });
      } catch (error) {
        console.error("Error creating event: ", error);
        Alert.alert(t("createEvent.error"), t("createEvent.eventCreationError"));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || day;
    setShowDatePicker(false);
    setDay(currentDate);
  };

  const onChangeTime = (event, selectedTime) => {
    const currentTime = selectedTime || hour;
    setShowTimePicker(false);
    setHour(currentTime);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends((prevSelected) =>
      prevSelected.includes(friendId)
        ? prevSelected.filter((id) => id !== friendId)
        : [...prevSelected, friendId]
    );
  };

  const filteredFriends = friends.filter((friend) =>
    friend.friendName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        selectedFriends.includes(item.id) && styles.selectedFriendItem,
      ]}
      onPress={() => toggleFriendSelection(item.id)}
    >
      <Image
        source={{ uri: item.friendImage }}
        style={styles.friendImage}
        cachePolicy="memory-disk"
      />
      <Text style={[styles.friendName, { color: theme.text }]}>{item.friendName}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={isNightMode ? ["#1a1a1a", "#000"] : ["#fff", "#f0f0f0"]}
        style={styles.gradientContainer}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <FlatList
          ListHeaderComponent={
            <>
              <Text style={[styles.title, { color: theme.text }]}>{t("createEvent.title")}</Text>
              <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={styles.selectedImage}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="images-outline" size={40} color={theme.icon} />
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder={t("createEvent.eventTitle")}
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={theme.placeholder}
              />

              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.dateTimeButton, { backgroundColor: theme.buttonBackground }]}
                >
                  <Text style={[styles.dateTimeLabel, { color: theme.text }]}>
                    {t("createEvent.date")}
                  </Text>
                  <Text style={[styles.dateTimeText, { color: theme.text }]}>
                    {day.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  style={[styles.dateTimeButton, { backgroundColor: theme.buttonBackground }]}
                >
                  <Text style={[styles.dateTimeLabel, { color: theme.text }]}>
                    {t("createEvent.time")}
                  </Text>
                  <Text style={[styles.dateTimeText, { color: theme.text }]}>
                    {hour.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder={t("createEvent.searchFriends")}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.placeholder}
              />

              <View style={[styles.friendsContainer, { backgroundColor: theme.background }]}>
                <FlatList
                  data={filteredFriends}
                  renderItem={renderFriendItem}
                  keyExtractor={(item) => item.id}
                  style={styles.friendsList}
                />
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder={t("createEvent.address")}
                value={address}
                onChangeText={setAddress}
                placeholderTextColor={theme.placeholder}
              />

              <TextInput
                style={[styles.input, styles.descriptionInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder={t("createEvent.description")}
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={theme.placeholder}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.disabledButton,
                  { backgroundColor: theme.buttonBackground }
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size={50} color={theme.text} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: theme.text }]}>
                    {t("createEvent.createEvent")}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          }
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={showDatePicker || showTimePicker}
          onRequestClose={() => {
            setShowDatePicker(false);
            setShowTimePicker(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style={[styles.modalView, { backgroundColor: theme.background }]}>
              <DateTimePicker
                value={showDatePicker ? day : hour}
                mode={showDatePicker ? "date" : "time"}
                display="spinner"
                onChange={showDatePicker ? onChangeDate : onChangeTime}
                minimumDate={today}
                maximumDate={maxDate}
                textColor={theme.text}
              />
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.buttonBackground }]}
                onPress={() => {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>{t("common.done")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  imagePicker: {
    width: width * 0.9,
    height: width * 0.6,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 30,
    paddingHorizontal: 15,
    marginBottom: 15,
    paddingLeft: 35,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 15,
  },
  dateTimeContainer: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  dateTimeButton: {
    borderRadius: 10,
    padding: 15,
    width: "100%",
    marginBottom: 10,
    alignItems: "center",
  },
  dateTimeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  dateTimeText: {
    fontSize: 16,
  },
  friendsList: {
    width: "100%",
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  selectedFriendItem: {
    backgroundColor: "#e0e0e0",
  },
  friendImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  friendName: {
    fontSize: 16,
  },
  submitButton: {
    borderRadius: 10,
    padding: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  friendsContainer: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    
  },
  modalButtonText: {
    fontWeight: "bold",
    textAlign: "center",
  },
});

const lightTheme = {
  background: "#fff",
  text: "black",
  textSecondary: "#666",
  inputBackground: "white",
  placeholder: "#999",
  icon: "black",
  buttonBackground: "white",
};

const darkTheme = {
  background: "#000",
  text: "#fff",
  textSecondary: "#ccc",
  inputBackground: "#1a1a1a",
  placeholder: "#666",
  icon: "white",
  buttonBackground: "#333",
  
  

  

};
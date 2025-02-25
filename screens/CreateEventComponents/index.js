import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
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
import DateTimePicker from "@react-native-community/datetimepicker";

import { Ionicons } from "@expo/vector-icons";
import { useBlockedUsers } from "../../src/contexts/BlockContext";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Keyboard } from "react-native";
import { fetchFriends, sendInvitationNotifications, pickImage, handleSubmit, onChangeDate, onChangeTime, toggleFriendSelection, closeDateTimePicker } from "./utils";
import { styles, lightTheme, darkTheme } from "./styles";

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  const today = new Date();
  const maxDate = new Date(today.getTime() + 6 * 30 * 24 * 60 * 60 * 1000); // Max 2 months from today

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
    fetchFriends(setFriends);
  }, []);

  // Add this useEffect for keyboard listeners
useEffect(() => {
  const keyboardDidShowListener = Keyboard.addListener(
    'keyboardDidShow',
    () => {
      setKeyboardVisible(true);
    }
  );
  const keyboardDidHideListener = Keyboard.addListener(
    'keyboardDidHide',
    () => {
      setKeyboardVisible(false);
    }
  );
  return () => {
    keyboardDidShowListener.remove();
    keyboardDidHideListener.remove();
  };
}, []);

  const theme = isNightMode ? darkTheme : lightTheme;

  const filteredFriends = friends.filter((friend) =>
    friend.friendName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        selectedFriends.includes(item.id) && styles.selectedFriendItem,
      ]}
      onPress={() => toggleFriendSelection(item.id, setSelectedFriends)}
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
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={[styles.container, keyboardVisible && styles.keyboardAvoidingContainer]}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
             
              <TouchableOpacity onPress={() => pickImage(setImage)} style={styles.imagePicker}>
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
                onPress={() => handleSubmit(
                  title,
                  day,
                  hour,
                  address,
                  description,
                  image,
                  selectedFriends,
                  setIsSubmitting,
                  blockedUsers,
                  t,
                  navigation
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size={20} color={theme.text} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: theme.text }]}>
                    {t("createEvent.createEvent")}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={{ marginBottom: 20 }} /> 
            </>
          }
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={showDatePicker || showTimePicker}
          onRequestClose={() => closeDateTimePicker(setShowDatePicker, setShowTimePicker)}
        >
          <View style={styles.centeredView}>
            <View style={[styles.modalView, { backgroundColor: theme.background }]}>
            <DateTimePicker
  value={showDatePicker ? tempDate : tempTime}
  mode={showDatePicker ? "date" : "time"}
  display="spinner"
  onChange={(event, selectedValue) => {
    const today = new Date();
    console.log("Día real:", today.toLocaleDateString());
    console.log("Día seleccionado:", selectedValue ? selectedValue.toLocaleDateString() : "Ninguno");

    if (selectedValue) {
      if (showDatePicker) {
        if (Platform.OS === "android") {
          setDay(selectedValue);
          setShowDatePicker(false);
        } else {
          setTempDate(selectedValue);
        }
      } else {
        if (Platform.OS === "android") {
          setHour(selectedValue);
          setShowTimePicker(false);
        } else {
          setTempTime(selectedValue);
        }
      }
    } else {
      if (Platform.OS === "android") {
        setShowDatePicker(false);
        setShowTimePicker(false);
      }
    }
  }}
  minimumDate={showTimePicker && day.toDateString() === new Date().toDateString() ? new Date() : undefined}
  maximumDate={maxDate}
  textColor={theme.text}
/>



{Platform.OS === "ios" && (
  <View style={{ flexDirection: "row", marginTop: 20 }}>
    <TouchableOpacity
      style={[styles.modalButton, { backgroundColor: theme.buttonBackground, marginRight: 10 }]}
      onPress={() => closeDateTimePicker(setShowDatePicker, setShowTimePicker)}
    >
      <Text style={[styles.modalButtonText, { color: theme.text }]}>
        {t("createEvent.cancel")}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.modalButton, { backgroundColor: theme.buttonBackground }]}
      onPress={() => {
        setDay(tempDate);
        setHour(tempTime);
        closeDateTimePicker(setShowDatePicker, setShowTimePicker);
      }}
    >
      <Text style={[styles.modalButtonText, { color: theme.text }]}>
        {t("createEvent.accept")}
      </Text>
    </TouchableOpacity>
  </View>
)}


            </View>
          </View>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
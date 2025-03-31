import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  addDoc,
  writeBatch,
} from "firebase/firestore";
import {
  saveUserNoteToCache,
  getUserNoteFromCache,
  saveFriendsNotesToCache,
  getFriendsNotesFromCache
} from "./utils";
import { AntDesign, Feather, Ionicons, FontAwesome } from "@expo/vector-icons";
import { auth, database } from "../../config/firebase";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";


const moodOptions = [
  "morning_walk",
  "movie_night",
  "dining_out",
  "coffee_break",
  "out_for_a_drink",
  "out_for_a_run"
];

export default function Notes({ refresh }) {
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [friendsNotes, setFriendsNotes] = useState([]);
  const [userNote, setUserNote] = useState(null);
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showSendButton, setShowSendButton] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteResponse, setNoteResponse] = useState("");
  const [isInputVisible, setIsInputVisible] = useState(false);
  const moodOptionsHeight = useRef(new Animated.Value(0)).current;
  const [showMoodOptions, setShowMoodOptions] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);
  const [selectedNoteFullScreen, setSelectedNoteFullScreen] = useState(null);
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [isNightMode, setIsNightMode] = useState(false);
  const [showMoodToggle, setShowMoodToggle] = useState(false);

  const user = auth.currentUser;
  const inputRef = useRef(null);
  const theme = isNightMode ? darkTheme : lightTheme;

  useEffect(() => {
    const loadCachedNotes = async () => {
      const cachedUserNote = await getUserNoteFromCache();
      if (cachedUserNote) {
        setUserNote(cachedUserNote);
      }
      const cachedFriendsNotes = await getFriendsNotesFromCache();
      if (cachedFriendsNotes && cachedFriendsNotes.length > 0) {
        setFriendsNotes(cachedFriendsNotes);
      }
    };
    loadCachedNotes();
  }, []);


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
    if (user) {
      const userRef = doc(database, "users", user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          setUserData(docSnapshot.data());
        }
      });

      fetchFriendsNotes();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const noteRef = doc(database, "users", user.uid, "note", "current");
      const unsubscribe = onSnapshot(noteRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const noteData = docSnapshot.data();
          const now = new Date();
          const noteDate = noteData.createdAt.toDate();
          const hoursSinceCreation = (now - noteDate) / (1000 * 60 * 60);
  
          if (hoursSinceCreation < 24) {
            const newUserNote = { id: docSnapshot.id, ...noteData };
            setUserNote(newUserNote);
            saveUserNoteToCache(newUserNote);
          } else {
            handleDeleteNote();
          }
        } else {
          setUserNote(null);
          saveUserNoteToCache(null);
        }
      });
  
      return () => unsubscribe();
    }
  }, [user]);

  const fetchFriendsNotes = async () => {
    if (!user) return;
  
    const friendsRef = collection(database, "users", user.uid, "friends");
    const friendsSnapshot = await getDocs(friendsRef);
    const friendsData = friendsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  
    const friendsNotesPromises = friendsData.map(async (friend) => {
      const noteRef = doc(database, "users", friend.friendId, "note", "current");
      const noteSnapshot = await getDoc(noteRef);
      if (noteSnapshot.exists()) {
        const noteData = noteSnapshot.data();
        const now = new Date();
        const noteDate = noteData.createdAt.toDate();
        const hoursSinceCreation = (now - noteDate) / (1000 * 60 * 60);
  
        if (hoursSinceCreation < 24) {
          const likesRef = collection(
            database,
            "users",
            friend.friendId,
            "note",
            "current",
            "likes"
          );
          const likesSnapshot = await getDocs(likesRef);
          const isLiked = likesSnapshot.docs.some((doc) => doc.id === user.uid);
  
          const friendDoc = await getDoc(doc(database, "users", friend.friendId));
          const friendData = friendDoc.data();
  
          return {
            id: noteSnapshot.id,
            ...noteData,
            username: friendData.username,
            friendImage: friend.friendImage,
            friendId: friend.friendId,
            isLiked: isLiked,
            likeCount: likesSnapshot.size,
          };
        }
      }
      return null;
    });
  
    const friendsNotesFetched = (await Promise.all(friendsNotesPromises)).filter(
      (note) => note !== null
    );
  
    // Actualizar la caché local con los datos más recientes de Firebase
    saveFriendsNotesToCache(friendsNotesFetched);
  
    setFriendsNotes(friendsNotesFetched);
  };
  

  const handleNoteChange = (text) => {
    if (text.length <= 30) {
      setNote(text);
      setShowSendButton(text.trim() !== "");
    } else {
      Alert.alert(t("notes.error"), t("notes.emptyNoteError"));
    }
  };

  const handleSubmitNote = async (text = note) => {
    if (text.trim() === "") {
      Alert.alert(t("notes.error"), t("notes.emptyNoteError"));
      return;
    }

    try {
      const noteRef = doc(database, "users", user.uid, "note", "current");
      await setDoc(noteRef, {
        text: text,
        createdAt: new Date(),
        photoUrl: userData ? userData.photoUrls[0] : "",
      });
      setNote("");
      setIsEditing(false);
      setShowOptions(false);
      setShowSendButton(false);
      setIsInputActive(false);
      setShowMoodOptions(false);
      setShowMoodToggle(false);
      Animated.timing(moodOptionsHeight, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error("Error posting note:", error);
      Alert.alert(t("notes.error"), t("notes.postNoteError"));
    }
  };

  const handleDeleteNote = async () => {
    try {
      const noteRef = doc(database, "users", user.uid, "note", "current");
      const likesRef = collection(noteRef, "likes");

      const likesSnapshot = await getDocs(likesRef);

      const batch = writeBatch(database);

      likesSnapshot.forEach((likeDoc) => {
        batch.delete(likeDoc.ref);
      });

      batch.delete(noteRef);

      await batch.commit();

      setUserNote(null);
    } catch (error) {
      console.error("Error deleting note and likes:", error);
      Alert.alert(t("notes.error"), t("notes.deleteNoteError"));
    }
  };

  const handlePress = () => {
    if (userNote) {
      Alert.alert(t("notes.deleteMood"), t("notes.deleteMoodConfirm"), [
        { text: t("notes.cancel"), style: "cancel" },
        { text: t("notes.ok"), onPress: () => handleDeleteNote() },
      ]);
    } else {
      setIsEditing(true);
      setShowOptions(true);
      setIsInputActive(true);
      setShowMoodToggle(true);
    }
  };

  const handleLikeNote = async (note) => {
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
          messageKey: "notes.likedYourNote",
          timestamp: new Date(),
          noteText: note.text,
          seen: false,
        });
      }
  
      // Actualizar la caché local con los datos más recientes
      const updatedFriendsNotes = friendsNotes.map((n) =>
        n.friendId === note.friendId ? { ...n, isLiked: note.isLiked, likeCount: note.likeCount } : n
      );
      
      setFriendsNotes(updatedFriendsNotes);
      saveFriendsNotesToCache(updatedFriendsNotes);
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert(t("notes.error"), t("notes.likeToggleError"));
    }
  };

  const handleSendNoteResponse = async (note) => {
    if (noteResponse.trim()) {
      try {
        const senderId = user.uid;
        const receiverId = selectedNoteFullScreen.friendId;
        // Use the getChatId function to find or create a chat between the users
        const chatId = await getChatId(senderId, receiverId);
        const chatRef = doc(database, "chats", chatId);
        const chatDoc = await getDoc(chatRef);
        // If the chat doesn't exist, create it
        if (!chatDoc.exists()) {
          await setDoc(chatRef, {
            participants: [senderId, receiverId],
            createdAt: new Date(),
            lastMessage: "",
            lastMessageTimestamp: new Date(), // Marca de tiempo inicial
          });
        }
        // Create the message
        const messagesRef = collection(database, "chats", chatId, "messages");
        const newMessage = {
          text: responseMessage,
          senderId: user.uid,
          senderName: userData?.username || t("notes.anonymous"),
          createdAt: new Date(),
          seen: false, // Cambiar de array a boolean
          isNoteResponse: true, // Mark as a note response
          noteText: selectedNoteFullScreen.text, // Include the note text
        };
        // Add the message to the database
        await addDoc(messagesRef, newMessage);
        // Update the chat with the last message details
        await updateDoc(chatRef, {
          lastMessage: responseMessage,
          lastMessageSenderId: user.uid,
          lastMessageTimestamp: new Date(),
        });
        setResponseMessage("");
        setShowResponseInput(false);
      } catch (error) {
        console.error("Error sending response:", error);
        Alert.alert(t("notes.error"), t("notes.sendResponseError"));
      }
    }
  };

  const getChatId = async (user1Id, user2Id) => {
    const chatsRef = collection(database, "chats");

    // Query for a chat that includes both user1Id and user2Id
    const q = query(chatsRef, where("participants", "array-contains", user1Id));

    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      const chatParticipants = doc.data().participants;
      if (chatParticipants.includes(user2Id)) {
        return doc.id; // Return existing chat ID
      }
    }

    // If no chat exists, return a new chat ID based on user IDs
    // This part is for creating a new chat if none exists
    const user1Doc = await getDoc(doc(database, "users", user1Id));
    const user2Doc = await getDoc(doc(database, "users", user2Id));

    const user1Name = user1Doc.data().username;
    const user2Name = user2Doc.data().username;

    return user1Name > user2Name
      ? `${user1Name}_${user2Name}`
      : `${user2Name}_${user1Name}`;
  };

  const toggleMoodOptions = () => {
    setShowMoodOptions(!showMoodOptions);
    moodOptionsHeight.setValue(showMoodOptions ? 0 : 40); // Actualiza directamente sin animación
  };

  const handleOutsidePress = () => {
    if (showMoodOptions) {
      setShowMoodOptions(false);
    }
  };

  const handleMoodOptionPress = async (mood) => {
    const translatedMood = t(`notes.moodOptions.${mood}`);
    try {
      await handleSubmitNote(translatedMood); // Guarda el texto traducido
      setShowMoodOptions(false);
      setShowMoodToggle(false);
      moodOptionsHeight.setValue(0); // Actualiza sin animación
    } catch (error) {
      console.error("Error uploading mood:", error);
      Alert.alert(t("notes.error"), t("notes.shareMoodError"));
    }
  };

  useEffect(() => {
    // Vuelve a cargar las notas de amigos al cambiar la prop refresh
    fetchFriendsNotes();
  }, [refresh]);
  
  const renderMoodNote = (note, isUser = false) => (
    <TouchableOpacity
      key={`note-${note.friendId}-${note.id}`} // Añadir prefijo 'note-' y friendId
      onPress={isUser ? handlePress : () => setSelectedNoteFullScreen(note)}
      style={styles.storyContainer}
    >
      <Text
        style={[styles.usernameText, { color: isNightMode ? "#fff" : "black" }]}
      >
        {isUser ? " " : note.username}
      </Text>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: note.photoUrl || "https://via.placeholder.com/150" }}
          style={styles.storyImage}
        />
        <View style={styles.noteTextContainer}>
          <Text style={styles.noteText} numberOfLines={2}>
            {note.text}
          </Text>
          {!isUser && (
            <View style={styles.noteActions}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => handleLikeNote(note)}
              >
                <AntDesign
                  name={note.isLiked ? "heart" : "hearto"}
                  size={14}
                  color={note.isLiked ? "red" : "black"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButtonNote}
                onPress={() => setSelectedNote(note)}
              >
                <Feather name="message-circle" size={14} color="black" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleSendResponse = async () => {
    if (responseMessage.trim() === "") {
      Alert.alert(t("notes.error"), t("notes.emptyResponseError"));
      return;
    }

    try {
      const senderId = user.uid;
      const receiverId = selectedNoteFullScreen.friendId;

      // Asegúrate de que el chat existe o créalo
      const chatId = await createChatIfNotExists(senderId, receiverId);

      // Referencia a la colección de mensajes
      const messagesRef = collection(database, "chats", chatId, "messages");

      // Crear el mensaje solo con el UID del remitente en 'seen'
      const newMessage = {
        text: responseMessage,
        senderId: user.uid,
        senderName: userData?.username || t("notes.anonymous"),
        createdAt: new Date(),
        seen: false, // Cambiar de array a boolean
        isNoteResponse: true,
        noteText: selectedNoteFullScreen.text,
      };

      // Agregar el mensaje a la base de datos
      await addDoc(messagesRef, newMessage);

      // Actualizar el chat con los detalles del último mensaje
      await updateDoc(doc(database, "chats", chatId), {
        lastMessage: responseMessage,
        lastMessageSenderId: user.uid,
        lastMessageTimestamp: new Date(),
      });

      // Resetear el input y cerrar el modal
      setResponseMessage("");
      setShowResponseInput(false);
      setSelectedNoteFullScreen(null);
    } catch (error) {
      console.error("Error sending response:", error);
      Alert.alert(t("notes.error"), t("notes.sendResponseError"));
    }
  };

  const createChatIfNotExists = async (senderId, receiverId) => {
    // Construct chat ID from user IDs
    const chatId = await getChatId(senderId, receiverId);
    const chatRef = doc(database, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    // If the chat doesn't exist, create it
    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        participants: [senderId, receiverId],
        createdAt: new Date(),
        lastMessage: "",
        lastMessageTimestamp: new Date(),
      });
    }

    return chatId;
  };

  const renderFullScreenNote = () => {
    if (!selectedNoteFullScreen) return null;

    return (
      <Modal
        visible={!!selectedNoteFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedNoteFullScreen(null)}
      >
     <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={Platform.OS === "ios" ? -130 : 0}
    style={{ flex: 1 }}
  >
        <TouchableWithoutFeedback
          onPress={() => setSelectedNoteFullScreen(null)}
        >
          <View
            style={[
              styles.fullScreenNoteContainer,
              { backgroundColor: isNightMode ? "black" : "white" },
            ]}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.fullScreenNoteContent,
                  { backgroundColor: isNightMode ? "#000" : "#fff" },
                ]}
              >
                <View style={styles.fullScreenUsernameContainer}>
                  <Text style={styles.fullScreenUsername}>
                    {selectedNoteFullScreen.username || userData?.username}
                  </Text>
                </View>

                <View style={styles.fullScreenImageContainer}>
                  <Image
                    source={{
                      uri:
                        selectedNoteFullScreen.photoUrl ||
                        "https://via.placeholder.com/150",
                    }}
                    style={styles.fullScreenNoteImage}
                  />
                  <View style={styles.fullScreenNoteTextContainer}>
                    <Text
                      style={[
                        styles.fullScreenNoteText,
                        { color: isNightMode ? "white" : "black" },
                      ]}
                    >
                      {selectedNoteFullScreen.text}
                    </Text>
                    <View style={styles.fullScreenNoteIconsContainer}>
                      <TouchableOpacity
                        style={styles.fullScreenNoteLikeButton}
                        onPress={() => handleLikeNote(selectedNoteFullScreen)}
                      >
                        <AntDesign
                          name={
                            selectedNoteFullScreen.isLiked ? "heart" : "hearto"
                          }
                          size={24}
                          color={
                            selectedNoteFullScreen.isLiked
                              ? "red"
                              : isNightMode
                              ? "white"
                              : "black"
                          }
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.fullScreenNoteSendButton}
                        onPress={() => setShowResponseInput((prev) => !prev)}
                      >
                        <Feather
                          name="message-circle"
                          size={24}
                          color={isNightMode ? "white" : "black"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {showResponseInput && (
                  <View style={styles.responseInputContainer}>
                    <TextInput
                       style={[
                        styles.responseInput,
                        {
                          color: isNightMode ? "white" : "#333",
                          borderColor: isNightMode ? "white" : "black"  // Color específico del texto escrito
                        },
                      ]}
                      value={responseMessage}
                      onChangeText={setResponseMessage}
                      placeholder={t("notes.typePlaceholder")}
                      placeholderTextColor={isNightMode ? "white" : "black"}
                      multiline
                    />
                    {responseMessage.trim() !== "" && (
                      <TouchableOpacity
                        style={styles.inlineSendButton}
                        onPress={handleSendResponse}
                      >
                        <FontAwesome name="send" size={20} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>

          </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderMoodOption = ({ item }) => (
    <TouchableOpacity
      style={styles.moodOption}
      onPress={() => handleMoodOptionPress(item)}
    >
      <Text style={styles.moodOptionText}>{t(`notes.moodOptions.${item}`)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.notesContainer}>
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
        {userNote ? (
          renderMoodNote(userNote, true)
        ) : (
          <View style={styles.storyContainer}>
            <Text
              style={[
                styles.usernameText,
                { color: isNightMode ? "#fff" : "#333" },
              ]}
            >
              {""}
            </Text>
            <TouchableOpacity onPress={handlePress}>
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri:
                      userData?.photoUrls[0] ||
                      "https://via.placeholder.com/150",
                  }}
                  cachePolicy="memory-disk"
                  style={styles.storyImage}
                />
                <View style={styles.noteTextContainer}>
                  {isEditing ? (
                    <View style={styles.inputContainer}>
                      <TextInput
                        ref={inputRef}
                        style={[
                          styles.input,
                          { color: isNightMode ? "#fff" : "#000" },
                        ]}
                        placeholder={t("notes.typeMoodPlaceholder")}
                        placeholderTextColor={isNightMode ? "#888" : "#888"}
                        value={note}
                        onChangeText={handleNoteChange}
                        multiline
                        onFocus={() => {
                          setIsInputActive(true);
                          setShowMoodToggle(true);
                        }}
                        onBlur={() => {
                          setIsInputActive(false);
                        }}
                        blurOnSubmit={false}
                        onKeyPress={({ nativeEvent }) => {
                          if (nativeEvent.key === "Enter") {
                            handleSubmitNote();
                          }
                        }}
                      />
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>
                      {t("notes.shareMoodPlaceholder")}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {friendsNotes.map((note) => renderMoodNote(note))}
      </ScrollView>

      {showMoodToggle && (
        <TouchableOpacity
          onPress={toggleMoodOptions}
          style={styles.moodToggleButton}
        >
          <Text style={styles.moodToggleButtonText}>
            {showMoodOptions
              ? t("notes.hideMoodOptions")
              : t("notes.showMoodOptions")}
          </Text>
        </TouchableOpacity>
      )}

      <Animated.View
        style={[styles.moodOptionsContainer, { height: moodOptionsHeight }]}
      >
        <FlatList
          data={moodOptions}
          renderItem={renderMoodOption}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </Animated.View>
      {selectedNote && isInputVisible && (
        <View
          style={[
            styles.noteResponseContainer,
            { backgroundColor: isNightMode ? "#1a1a1a" : "white" },
          ]}
        >
          <TextInput
            style={[
              styles.noteResponseInput,
              {
                color: isNightMode ? "#fff" : "#000",
                borderColor: isNightMode ? "#444" : "#ccc",
              },
            ]}
            placeholder={t("notes.respondToNotePlaceholder")}
            placeholderTextColor={isNightMode ? "#ccc" : "#666"}
            value={noteResponse}
            onChangeText={setNoteResponse}
          />
          <TouchableOpacity
            style={[
              styles.noteResponseSendButton,
              { backgroundColor: isNightMode ? "#C0A368" : "#3e3d3d" },
            ]}
            onPress={() => handleSendNoteResponse(selectedNote)}
          >
            <Feather
              name="message-circle"
              size={24}
              color={isNightMode ? "#000" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      )}
      {renderFullScreenNote()}
    </View>
  );
}

const styles = StyleSheet.create({
  notesContainer: {
    marginBottom: 20,
  },
  storyContainer: {
    marginBottom: 40,
    marginHorizontal: 6,
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  storyImage: {
    width: 120,
    height: 140,
    borderRadius: 20,
  },
  noteTextContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(200, 200, 200, 0.9);",
    padding: 5,
    paddingHorizontal: 10,
    borderRadius: 35,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  noteText: {
    color: "black",
    fontSize: 10,
    textAlign: "center",
    flex: 1,
    fontWeight: "bold",
    alignSelf: "center",
  },
  placeholderText: {
    color: "black",
    fontSize: 8,
    textAlign: "center",
    width: "100%",
    fontWeight: "bold",
    alignSelf: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    alignSelf: "center",
  },
  input: {
    fontSize: 10,
    flex: 1,
    padding: 0,
    textAlign: "center",
    minHeight: 14,
    maxHeight: 14,
    overflow: "hidden",
    fontWeight: "bold",
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  usernameText: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
  },
  sendButton: {
    padding: 5,
    borderRadius: 15,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    padding: 3,
  },
  sendButtonNote: {},
  moodOptionsContainer: {
    overflow: "hidden",
    marginBottom: 10,
  },
  moodOption: {
    backgroundColor: "#c8c8c8",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginHorizontal: 5,
    height: 40,
    justifyContent: "center",
  },
  moodOptionText: {
    color: "black",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "bold",
  },
  noteResponseContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    padding: 10,
  },
  noteResponseInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  noteResponseSendButton: {
    borderRadius: 50,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  moodToggleButton: {
    backgroundColor: "#c8c8c8",
    padding: 10,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 10,
  },
  moodToggleButtonText: {
    color: "black",
    fontSize: 12,
    fontWeight: "bold",
  },
  fullScreenNoteContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenNoteContent: {
    width: "90%",
    maxWidth: 350,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  fullScreenImageContainer: {
    position: "relative",
    width: 280,
    height: 320,
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 20,
  },
  fullScreenUsernameContainer: {
    marginBottom: 10,
    alignItems: "center",
    width: "100%",
  },
  fullScreenUsername: {
    textAlign: "center",
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
    paddingVertical: 10,
  },
  fullScreenNoteImage: {
    width: "100%",
    height: "100%",
  },
  fullScreenNoteTextContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    padding: 2,
    paddingHorizontal: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 35,
    width: "100%",
  },
  fullScreenNoteText: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
    flex: 1,
  },
  fullScreenNoteIconsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  fullScreenNoteActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  fullScreenNoteLikeButton: {
    padding: 5,
  },
  fullScreenNoteSendButton: {
    padding: 5,
    marginLeft: 10,
  },
  responseInputContainer: {
    marginTop: 10,
    width: "100%",
    paddingHorizontal: 10,
  },
  responseInput: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 70,
    marginBottom: 90,
    borderColor: "black",
    borderWidth: 1,
    color: "#000",
    width: "100%",
    maxHeight: 100,
  },
  inlineSendButton: {
    position: "absolute",
    right: 15,
    top: 5,
    backgroundColor: "#3e3d3d",
    borderRadius: 50,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendResponseButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  sendResponseButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

const lightTheme = {
  background: "#fff",
  text: "#333",
  textSecondary: "#666",
  inputBackground: "#f5f5f5",
  placeholder: "#4b4b4b",
  icon: "#3e3d3d",
  borderColor: "#bbb7b7",
  noteBackground: "rgba(128, 128, 128, 0.7)",
  sendButtonBackground: "rgba(0, 0, 0, 0.5)",
  sendButtonIcon: "white",
  moodOptionsBackground: "rgba(255, 255, 255, 0.9)",
  noteResponseBackground: "white",
};

const darkTheme = {
  background: "#000",
  text: "#fff",
  textSecondary: "#ccc",
  inputBackground: "#1a1a1a",
  placeholder: "white",  icon: "#C0A368",
  borderColor: "#444",
  noteBackground: "rgba(64, 64, 64, 0.7)",
  sendButtonBackground: "rgba(255, 255, 255, 0.5)",
  sendButtonIcon: "black",
  moodOptionsBackground: "rgba(0, 0, 0, 0.9)",
  noteResponseBackground: "#1a1a1a",
};
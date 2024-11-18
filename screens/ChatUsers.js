import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { auth, database, storage } from "../config/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Video } from "expo-av";
import { Audio } from "expo-av";
import AudioPlayer from "./AudioPlayer";
import { useBlockedUsers } from "../src/contexts/BlockContext";
import { ImageBackground } from "react-native";
import { Menu } from "react-native-paper";
import { Ionicons, FontAwesome, Feather } from "@expo/vector-icons";

export default function Chat({ route }) {
  const { chatId: initialChatId, recipientUser } = route.params;
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [chatId, setChatId] = useState(initialChatId);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(recipientUser);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const user = auth.currentUser;
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [imageUri, setImageUri] = useState(route.params?.imageUri || null);
  const blockedUsers = useBlockedUsers();
  const [menuVisible, setMenuVisible] = useState(false);
  const [noteText, setNoteText] = useState(""); // Estado para almacenar el texto de la nota


  // Verificación de usuarios bloqueados
  useEffect(() => {
    if (blockedUsers.includes(recipientUser.id)) {
      Alert.alert("Error", "No puedes interactuar con este usuario.");
      navigation.goBack();
      return;
    }
  }, [recipientUser, blockedUsers]); // Cierra el primer useEffect aquí

  useEffect(() => {
    if (recipientUser?.photoUrls && recipientUser.photoUrls.length > 0) {
      setBackgroundImage(recipientUser.photoUrls[0]);
    }
  }, [recipientUser]);

  // Configuración del chat
  useEffect(() => {
    const setupChat = async () => {
      if (chatId) {
        const messagesRef = collection(database, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        // Escucha los mensajes del chat
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messagesList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(messagesList);
        });

        // Lógica para cargar respuestas de historias
        const fetchStoryResponses = async () => {
          const responses = [];

          // Respuestas a las historias del destinatario
          if (recipientUser?.id) {
            const recipientStoriesRef = collection(
              database,
              "users",
              recipientUser.id,
              "stories"
            );
            try {
              const recipientStoriesSnapshot = await getDocs(
                recipientStoriesRef
              );
              for (const storyDoc of recipientStoriesSnapshot.docs) {
                const responsesRef = collection(
                  recipientStoriesRef,
                  storyDoc.id,
                  "responses"
                );
                const responsesSnapshot = await getDocs(responsesRef);
                responses.push(
                  ...responsesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    storyId: storyDoc.id,
                    ...doc.data(),
                    isStoryResponse: true, // Indicador para identificar respuestas de historias
                  }))
                );
              }
            } catch (error) {
              console.error(
                "Error al cargar respuestas de historias del destinatario:",
                error
              );
            }
          }

          // Respuestas a tus propias historias
          const userStoriesRef = collection(
            database,
            "users",
            user.uid,
            "stories"
          );
          try {
            const userStoriesSnapshot = await getDocs(userStoriesRef);
            for (const storyDoc of userStoriesSnapshot.docs) {
              const responsesRef = collection(
                userStoriesRef,
                storyDoc.id,
                "responses"
              );
              const responsesSnapshot = await getDocs(responsesRef);
              responses.push(
                ...responsesSnapshot.docs.map((doc) => ({
                  id: doc.id,
                  storyId: storyDoc.id,
                  ...doc.data(),
                  isStoryResponse: true, // Indicador para identificar respuestas de historias
                }))
              );
            }
          } catch (error) {
            console.error(
              "Error al cargar respuestas de tus propias historias:",
              error
            );
          }

          // Agregar las respuestas al estado de mensajes
          setMessages((prevMessages) => [...prevMessages, ...responses]);
        };


  // Lógica para cargar respuestas a notas
  const fetchNote = async () => {
    if (recipientUser?.id) {
      try {
        const noteRef = doc(database, "users", recipientUser.id, "note", "current");
        const noteSnapshot = await getDoc(noteRef);
        if (noteSnapshot.exists()) {
          setNoteText(noteSnapshot.data().text); // Guardar el texto de la nota
        } else {
          setNoteText("No hay nota disponible");
        }
      } catch (error) {
        console.error("Error al obtener la nota:", error);
        setNoteText("Error al obtener la nota");
      }
    }
  };

  await Promise.all([fetchStoryResponses(), fetchNote()]);

        // Si hay una imagenUri pasada desde ChatList, enviarla automáticamente
        if (imageUri) {
          handleSend("image", imageUri);
          setImageUri(null); // Limpiar después de enviar la imagen
        }

        // Limpieza
        return () => unsubscribe();
      }
    };

    setupChat();
  }, [chatId, imageUri, blockedUsers, recipientUser]);

  const handleReport = async () => {
    if (!recipientUser || !recipientUser.id) {
      Alert.alert(
        "Error",
        "No se puede denunciar a este usuario en este momento."
      );
      return;
    }

    try {
      const chatDoc = await getDoc(doc(database, "chats", chatId));

      if (chatDoc.exists()) {
        const chatData = chatDoc.data();

        if (!chatData.participants.includes(recipientUser.id)) {
          Alert.alert(
            "Error",
            "No puedes denunciar a este usuario ya que no es parte de este chat."
          );
          return;
        }

        setIsReportModalVisible(true);
        setMenuVisible(false);
      } else {
        Alert.alert("Error", "No se pudo obtener la información del chat.");
      }
    } catch (error) {
      console.error("Error al obtener los datos del chat:", error);
      Alert.alert(
        "Error",
        "Ocurrió un error al intentar acceder a los datos del chat."
      );
    }
  };
  const handleReportSubmit = async (reason, description) => {
    try {
      const complaintsRef = collection(database, "complaints");
      const newComplaint = {
        reporterId: user.uid,
        reporterName: user.displayName || "Anónimo",
        reporterUsername: user.email ? user.email.split("@")[0] : "unknown",
        reportedId: recipientUser.id || "unknown",
        reportedName: recipientUser
          ? `${recipientUser.firstName} ${recipientUser.lastName}`
          : "Usuario Desconocido",
        reportedUsername: recipientUser?.username || "unknown",
        reason: reason,
        description: description,
        timestamp: Timestamp.now(),
      };
      await addDoc(complaintsRef, newComplaint);
      Alert.alert(
        "Gracias",
        "Tu denuncia ha sido enviada y será revisada por nuestro equipo de moderadores."
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert(
        "Error",
        "No se pudo enviar la denuncia. Por favor, inténtalo de nuevo."
      );
    }
    setIsReportModalVisible(false);
  };

  const createChatIfNotExists = async () => {
    if (!chatId) {
      const chatRef = doc(collection(database, "chats"));
      const newChatId = chatRef.id;

      // Validar que los datos no sean undefined
      if (!user || !recipientUser || !newChatId) {
        console.error(
          "Error: Los datos del chat o los usuarios son indefinidos."
        );
        return null;
      }

      await setDoc(chatRef, {
        participants: [user.uid, recipientUser.id],
        createdAt: new Date(),
        lastMessage: "",
      });

      setChatId(newChatId);
      return newChatId;
    }

    return chatId;
  };

  const handleSend = async (
    messageType = "text",
    mediaUri = null,
    isViewOnce = false
) => {
    try {
        const chatIdToUse = await createChatIfNotExists();
        const messagesRef = collection(
            database,
            "chats",
            chatIdToUse,
            "messages"
        );

        let messageData = {
            senderId: user.uid,
            senderName: user.displayName || "Anónimo",
            createdAt: new Date(),
            seen: false,
            viewedBy: [],
            isViewOnce,
        };

        if (messageType === "text") {
            messageData.text = message.trim();
        } else if (messageType === "image" || messageType === "video") {
            const mediaUrl = await uploadMedia(mediaUri);
            messageData.mediaType = messageType;
            messageData.mediaUrl = mediaUrl;
        }

        // Enviar mensaje a Firestore
        await addDoc(messagesRef, messageData);

        // Actualizar información del chat
        const chatDocRef = doc(database, "chats", chatIdToUse);
        const chatDoc = await getDoc(chatDocRef);

        if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            const otherParticipantId = chatData.participants.find(
                (participant) => participant !== user.uid
            );

            // Establecer isHidden a false para el receptor
            await updateDoc(chatDocRef, {
                lastMessage: messageData.text || "Media",
                lastMessageTimestamp: messageData.createdAt,
                lastMessageSenderId: user.uid,
                lastMessageSenderName: user.displayName || "Anónimo",
                [`isHidden.${otherParticipantId}`]: false,
            });
        }

        // Limpiar el campo de texto
        setMessage("");
        flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
        console.error("Error al enviar el mensaje:", error);
        Alert.alert(
            "Error",
            "No se pudo enviar el mensaje. Por favor, inténtalo de nuevo."
        );
    }
};


  const handleDeleteChat = async () => {
    try {
      const batch = writeBatch(database);
      const chatRef = doc(database, "chats", chatId);
      const messagesRef = collection(database, "chats", chatId, "messages");
  
      // Mark the chat as deleted for the current user
      batch.update(chatRef, {
        [`deletedFor.${user.uid}`]: true
      });
  
      // Mark all messages as deleted for the current user
      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.forEach((messageDoc) => {
        batch.update(messageDoc.ref, {
          [`deletedFor.${user.uid}`]: true
        });
      });
  
      // Commit the batch
      await batch.commit();
  
      // Navigate back
      navigation.goBack();
      Alert.alert("Éxito", "El chat ha sido eliminado para ti.");
    } catch (error) {
      console.error("Error al eliminar el chat:", error);
      Alert.alert("Error", "No se pudo eliminar el chat. Por favor, intenta nuevamente.");
    }
  };

  const uploadMedia = async (uri) => {
    if (!uri) return null;

    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(
      storage,
      `media/${user.uid}/${new Date().getTime()}`
    );
    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleCameraLaunch = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Se necesita permiso para acceder a la cámara"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      handleSend("image", asset.uri, true); // Enviar como `isViewOnce: true`
    }
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const mediaType = result.assets[0].type === "video" ? "video" : "image";
      handleSend(mediaType, result.assets[0].uri); // Verifica que `handleSend` esté en `ChatUsersParaEditar.js`
    }
  };

  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permiso de audio no concedido");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error("Error al iniciar la grabación:", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setIsRecording(false);
        handleSend("audio", uri);
      }
    } catch (err) {
      console.error("Error al detener la grabación:", err);
    }
  };

  const handleHideChat = async () => {
    try {
      await updateDoc(doc(database, "chats", chatId), { isHidden: true });
      setIsChatHidden(true);
      Alert.alert("Chat oculto", "Este chat ha sido ocultado.");
    } catch (error) {
      console.error("Error al ocultar el chat:", error);
    }

    setMenuVisible(false);
  };

  const handleUserPress = () => {
    navigation.navigate("UserProfile", { selectedUser: recipientUser });
  };

  const handleMediaPress = async (
    mediaUrl,
    mediaType,
    messageId,
    isViewOnce
  ) => {
    try {
      const messageRef = doc(database, "chats", chatId, "messages", messageId);
      const messageSnapshot = await getDoc(messageRef);

      if (!messageSnapshot.exists()) {
        Alert.alert("Error", "No se encontró el mensaje.");
        return;
      }

      const messageData = messageSnapshot.data();

      if (isViewOnce) {
        if (messageData.viewedBy?.includes(user.uid)) {
          Alert.alert("Imagen no disponible", "Esta imagen ya ha sido vista.");
          return;
        }

        await updateDoc(messageRef, {
          viewedBy: [...(messageData.viewedBy || []), user.uid],
        });

        setSelectedImage(mediaUrl);
        setIsModalVisible(true);
      } else {
        setSelectedImage(mediaUrl);
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error("Error al abrir la imagen:", error);
      Alert.alert("Error", "No se pudo abrir la imagen.");
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  const handleLongPressMessage = (message) => {
    if (message.senderId === user.uid) {
      // Solo permitir eliminación de mensajes enviados por el usuario actual
      Alert.alert("Opciones de Mensaje", "¿Qué te gustaría hacer?", [
        {
          text: "Cancelar",
          onPress: () => setSelectedMessageId(null),
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: () => handleDeleteMessage(message.id),
          style: "destructive",
        },
      ]);
    }
  };

  const handleDeleteMessage = (messageId) => {
    setMessages((prevMessages) =>
      prevMessages.filter((message) => message.id !== messageId)
    );
    setSelectedMessageId(null);
  };

  const renderDate = (date) => {
    return (
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          {date.toLocaleDateString([], {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>
    );
  };

  const renderMessage = ({ item, index }) => {
    const previousMessage = messages[index - 1];
    const currentMessageDate = new Date(item.createdAt.seconds * 1000);
    const previousMessageDate =
      previousMessage && new Date(previousMessage.createdAt.seconds * 1000);

    const isSameDay =
      previousMessageDate &&
      currentMessageDate.toDateString() === previousMessageDate.toDateString();

      const isOwnMessage = item.senderId === user.uid;

      if (item.deletedFor && item.deletedFor[user.uid]) {
        return null;
      }

    if (item.isStoryResponse) {
      return (
        <>
          {!isSameDay && renderDate(currentMessageDate)}

          {/* Renderizar respuesta de historia */}
          <View
            style={[
              styles.message,
              item.senderId === user.uid
                ? styles.sent // A la derecha si el remitente eres tú
                : styles.received, // A la izquierda si el remitente es el destinatario
              styles.storyResponseContainer,
            ]}
          >
            <Text style={styles.storyResponseText}>
              {item.senderId === user.uid
                ? `Respondiste a su historia`
                : `Respondió a tu historia`}
            </Text>
            <Image
              source={{ uri: item.storyUrl }}
              style={styles.storyResponseImage}
            />
            <Text style={styles.messageText}>{item.text}</Text>
            {item.senderId === user.uid && item.seen && (
              <View style={styles.messageFooter}>
                <Text style={styles.timeText}>
                  {currentMessageDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {item.senderId === user.uid && item.seen && (
                  <Ionicons
                    name="checkmark-done-sharp"
                    size={16}
                    color="blue"
                    style={styles.seenIcon}
                  />
                )}
              </View>
            )}
          </View>
        </>
      );
    }
      // Renderizar respuesta de nota
      if (item.isNoteResponse) {
        return (
          <>
            {!isSameDay && renderDate(currentMessageDate)}
    
            <View
              style={[
                styles.message,
                isOwnMessage ? styles.sent : styles.received,
                styles.noteResponseContainer,
              ]}
            >
              <Text style={styles.noteResponseText}>
                {isOwnMessage ? "Respondiste a su nota" : "Respondió a tu nota"}
              </Text>
    
              <Image
                source={require("../assets/flecha-curva.png")}
                style={[
                  styles.arrowImage,
                  isOwnMessage ? styles.arrowImageSent : styles.arrowImageReceived,
                ]}
              />
              <View>
                <Text style={styles.originalNoteText}>
                  {item.noteText || "Nota no disponible"}
                </Text>
              </View>
    
              <TouchableOpacity
                onPress={() => navigation.navigate("FullNote", { note: item })}
              >
                <Text style={styles.messageTextNotas}>{item.text}</Text>
              </TouchableOpacity>
              <View style={styles.messageFooter}>
                <Text style={styles.timeText}>
                  {currentMessageDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {isOwnMessage && item.seen && (
                  <Ionicons
                    name="checkmark-done-sharp"
                    size={16}
                    color="blue"
                    style={styles.seenIcon}
                  />
                )}
              </View>
            </View>
          </>
        );
      }
      

      return (
        <>
          {!isSameDay && renderDate(currentMessageDate)}
      
          <TouchableOpacity onLongPress={() => handleLongPressMessage(item)}>
            <View
              style={[
                styles.message,
                item.senderId === user.uid ? styles.sent : styles.received,
              ]}
            >
              {item.text && <Text style={styles.messageText}>{item.text}</Text>}
      
              {item.mediaType === "image" && (
                item.isViewOnce ? (
                  <TouchableOpacity
                    onPress={() =>
                      handleMediaPress(item.mediaUrl, "image", item.id, item.isViewOnce)
                    }
                    style={[
                      styles.viewOnceImagePlaceholder,
                      item.viewedBy?.includes(user.uid)
                        ? styles.imageViewed
                        : styles.imageNotViewed,
                    ]}
                    disabled={item.viewedBy?.includes(user.uid)} // Desactivar si ya fue vista
                  >
                    <Text style={styles.imageStatusText}>
                      {item.viewedBy?.includes(user.uid) ? "Ya Vista" : "Ver"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      handleMediaPress(item.mediaUrl, "image", item.id, false)
                    }
                    style={styles.normalImageContainer}
                  >
                    <Image
                      source={{ uri: item.mediaUrl }}
                      style={styles.messageImage}
                    />
                  </TouchableOpacity>
                )
              )}
      
              {item.mediaType === "video" && (
                <Video
                  source={{ uri: item.mediaUrl }}
                  style={styles.messageVideo}
                  useNativeControls
                  resizeMode="contain"
                />
              )}
      
              {item.mediaType === "audio" && <AudioPlayer uri={item.mediaUrl} />}
      
              <View style={styles.messageFooter}>
                <Text style={styles.timeText}>
                  {currentMessageDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {item.senderId === user.uid && item.seen && (
                  <Ionicons
                    name="checkmark-done-sharp"
                    size={16}
                    color="blue"
                    style={styles.seenIcon}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </>
      );
      
  };

  return (
    <ImageBackground source={{ uri: backgroundImage }} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
          <Text style={styles.username}>
            {recipient.firstName + " " + recipient.lastName}
          </Text>
        </TouchableOpacity>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Feather name="more-vertical" size={24} color="white" />
            </TouchableOpacity>
          }
          contentStyle={styles.menuContainer}
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              Alert.alert(
                "Eliminar chat",
                "¿Estás seguro de que quieres eliminar este chat?",
                [
                  {
                    text: "Cancelar",
                    style: "cancel",
                  },
                  {
                    text: "Eliminar",
                    onPress: handleDeleteChat,
                  },
                ]
              );
            }}
            title="Borrar chat"
            titleStyle={styles.menuItemText}
            style={styles.menuItemContainer}
          />
          <Menu.Item
            onPress={handleHideChat}
            title="Silenciar"
            titleStyle={styles.menuItemText}
            style={styles.menuItemContainer}
          />
          <Menu.Item
            onPress={handleReport}
            title="Denunciar"
            titleStyle={styles.menuItemText}
            style={styles.menuItemContainer}
          />
          <Menu.Item
            onPress={handleHideChat}
            title="Bloquear"
            titleStyle={styles.menuItemText}
            style={styles.menuItemContainer}
          />
        </Menu>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
      />

      <View style={styles.containerIg}>
        <TouchableOpacity
          onPress={handleCameraLaunch}
          style={styles.iconButtonCamera}
        >
          <Ionicons name="camera-outline" size={20} color="white" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#999"
        />
        {message.trim() ? (
          <TouchableOpacity
            onPress={() => handleSend("text")}
            style={styles.sendButton}
          >
            <FontAwesome name="send" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={pickMedia}
            style={styles.iconButtonGaleria}
          >
            <Ionicons name="image-outline" size={30} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalBackground}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullscreenMedia}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "white",
    marginVertical: 40,
  },
  backButton: {
    marginRight: 15,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    color: "white",
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  message: {
    padding: 10,
    borderRadius: 20,
    marginVertical: 8,
    maxWidth: "80%",
    flexDirection: "column",
    alignSelf: "flex-start", // Cambia dinámicamente con sent/received
    backgroundColor: "rgba(240, 240, 240, 1)",
  },
  iconButtonGaleria: {
    marginRight: 10,
    marginLeft: 7,
  },
  iconButtonCamera: {
    backgroundColor: "#3e3d3d",
    padding: 7,
    borderRadius: 20,
  },
  sent: {
    alignSelf: "flex-end",
    backgroundColor: "transparent",
    fontWeight: "bold",
  },
  timeText: {
    fontSize: 10, // Reduce el tamaño
    color: "#888", // Color más tenue
    fontWeight: "bold",
  },

  received: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    fontWeight: "bold",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // Alinea el contenido hacia la derecha
    marginTop: 5,
  },
  emojiMessage: {
    backgroundColor: "transparent",
    padding: 0,
  },
  seenIcon: {
    marginLeft: 7, // Ajusta el espacio entre el horario y el ícono
  },
  messageText: {
    marginTop: 20,
    color: "#262626",
    fontSize: 14,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    fontWeight: "bold",
  },
  messageTextNotas: {
    color: "#262626",
    fontSize: 14,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    fontWeight: "bold",
  },
  emojiText: {
    fontSize: 40,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  messageVideo: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  containerIg: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: "#000",
  },
  sendButton: {
    backgroundColor: "#3e3d3d",
    borderRadius: 50,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenMedia: {
    width: "100%",
    height: "80%",
    resizeMode: "contain",
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  uploadingContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
  },
  uploadingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  uploadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
  },
  noteResponseContainer: {
    borderRadius: 18,
    padding: 12,
    marginVertical: 5,
    backgroundColor: "transparent",
    flexDirection: "column",
    alignItems: "center",
  },
  noteResponseText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  noteContent: {
    backgroundColor: "red",
    borderRadius: 12,
    padding: 8,
    marginTop: 5,
    marginBottom: 5,
  },
  arrowIcon: {
    marginBottom: 10,
  },
  originalNoteText: {
    marginTop: 40,
    color: "white",
    fontSize: 12,
    padding: 7,
    borderRadius: 20,
    backgroundColor: "rgba(128, 128, 128, 0.8)",
    marginBottom: 20,
  },
  arrowImageSent: {
    width: 35,
    height: 35,
    transform: [{ rotate: "140deg" }],
    position: "absolute",
    left: 140,
    top: 50,
  },
  arrowImageReceived: {
    width: 35,
    height: 35,
    transform: [{ rotate: "-140deg" }, { scaleX: -1 }],
    marginLeft: 0,
    right: 130,
    top: 50,
    position: "absolute",
  },
  storyResponseContainer: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8",
    borderRadius: 18,
    padding: 12,
    marginVertical: 5,
  },
  storyResponseImage: {
    width: 80,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  storyResponseContent: {
    flex: 1,
  },
  storyResponseText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  menuContainer: {
    borderRadius: 20,
  },
  menuItemText: {
    fontWeight: "bold",
    color: "#4b4b4b",
    fontSize: 13,
    textAlign: "center",
    borderRadius: 20,
  },
  menuItemContainer: {
    marginVertical: 0,
  },
  normalImageContainer: {
    borderRadius: 10,
    overflow: "hidden",
  },

  viewOnceImagePlaceholder: {
    width: 200,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  viewOnceVideoPlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },

  imageNotViewed: {
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Fondo oscuro para imágenes no vistas
  },
  imageViewed: {
    backgroundColor: "rgba(50, 50, 50, 0.8)", // Fondo gris más claro para imágenes vistas
  },

  imageStatusText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  viewOnceText: {
    color: "white",
    marginTop: 5,
    fontSize: 12,
  },
  noBackground: {
    backgroundColor: "transparent", // Fondo transparente para imágenes
  },
  dateContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  dateText: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#000",
    fontWeight: "bold",
    padding: 5,
    borderRadius: 10,
  },

  imageUnavailableContainer: {
    width: 200,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
  },
  imageUnavailableText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
  },
});

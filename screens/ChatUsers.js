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
  ActivityIndicator
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


import Complaints from '../Components/Complaints/Complaints';

export default function Chat({ route }) {
  const { chatId: initialChatId, recipientUser, imageUri } = route.params;
  const [backgroundImage, setBackgroundImage] = useState(imageUri || null);
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
  const blockedUsers = useBlockedUsers();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isComplaintVisible, setIsComplaintVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);



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

        // Limpieza
        return () => unsubscribe();
      }
    };

    setupChat();
  }, [chatId]);

  const markMessagesAsRead = async (messages) => {
    const batch = writeBatch(database);
    messages.forEach((message) => {
      if (message.senderId !== user.uid && !message.viewedBy?.includes(user.uid)) {
        const messageRef = doc(database, "chats", chatId, "messages", message.id);
        batch.update(messageRef, {
          viewedBy: [...(message.viewedBy || []), user.uid],
        });
      }
    });
    try {
      await batch.commit();
      console.log('Todos los mensajes visibles han sido marcados como leídos.');
    } catch (error) {
      console.error('Error al marcar los mensajes como leídos:', error);
    }
  };

  const handleReport = async () => {
    try {
      console.log("Datos del usuario reportado al abrir el modal:", recipient);
      setIsComplaintVisible(true);
    } catch (error) {
      console.error("Error al abrir el modal de denuncia:", error);
    }
  };



  const handleReportSubmit = async (reason, description) => {
    try {
      const chatRef = doc(database, "chats", chatId);
      const chatSnapshot = await getDoc(chatRef);

      if (!chatSnapshot.exists()) {
        console.error("El chat no existe.");
        Alert.alert("Error", "No se pudo encontrar el chat.");
        return;
      }

      const chatData = chatSnapshot.data();
      const participants = chatData.participants || [];

      const recipientId = participants.find((participant) => participant !== user.uid);

      if (!recipientId) {
        console.error("No se encontró un ID válido para el usuario reportado.");
        Alert.alert("Error", "No se pudo identificar al usuario reportado.");
        return;
      }

      console.log("Datos de la denuncia:", { reason, description, recipientId });

      const complaintsRef = collection(database, "complaints");
      const newComplaint = {
        reporterId: user.uid,
        reporterName: user.displayName || "Anónimo",
        reportedId: recipientId,
        reportedName: `${recipientUser?.firstName || "Usuario"} ${recipientUser?.lastName || "desconocido"}`,
        reason,
        description: description || "",
        timestamp: new Date(),
      };

      console.log("Enviando denuncia:", newComplaint);
      await addDoc(complaintsRef, newComplaint);

      Alert.alert("Gracias", "Tu denuncia ha sido enviada.");
      setIsComplaintVisible(false);
    } catch (error) {
      console.error("Error al enviar la denuncia:", error);
      Alert.alert("Error", "No se pudo enviar la denuncia.");
    }
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
    if (isUploading) {
        Alert.alert("Cargando", "Por favor espera a que termine la subida actual.");
        return;
    }

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

        // Añade la lógica para tipo de mensaje:
        if (messageType === "text") {
          messageData.text = message.trim();
      } else if (messageType === "image" || messageType === "video") {
          setIsUploading(true);
          const tempId = `temp-${new Date().getTime()}`;
          setMessages((prevMessages) => [
            ...prevMessages,
            { id: tempId, mediaType: messageType, isUploading: true },
          ]);
          const mediaUrl = await uploadMedia(mediaUri);
          if (!mediaUrl) return;
          messageData.mediaType = messageType;
          messageData.mediaUrl = mediaUrl;
          setIsUploading(false);
          setMessages((prevMessages) =>
            prevMessages.map((message) =>
              message.id === tempId ? { ...messageData, id: tempId } : message
            )
          );
      }
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
        setIsUploading(false);
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

    try {
      setIsUploading(true); // Inicia la carga
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(
        storage,
        `media/${user.uid}/${new Date().getTime()}`
      );
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      Alert.alert("Error", "No se pudo subir el archivo.");
      return null;
    } finally {
      setIsUploading(false); // Finaliza la carga
    }
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Se necesita permiso para acceder a la galería"
      );
      return;
    }

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

  const handleUserPress = async () => {
    try {
      if (!chatId) {
        Alert.alert("Error", "No se puede identificar el chat.");
        return;
      }

      const chatRef = doc(database, "chats", chatId);
      const chatSnapshot = await getDoc(chatRef);

      if (!chatSnapshot.exists()) {
        console.error("El documento del chat no existe.");
        Alert.alert("Error", "El chat no existe.");
        return;
      }

      const chatData = chatSnapshot.data();

      // Obtener el ID del destinatario desde los participantes
      const otherParticipantId = chatData.participants.find(
        (participantId) => participantId !== user.uid
      );

      if (!otherParticipantId) {
        console.error("No se encontró un ID válido para el destinatario.");
        Alert.alert("Error", "No se pudo identificar al destinatario.");
        return;
      }

      navigation.navigate("UserProfile", { selectedUser: { id: otherParticipantId, ...recipientUser } });
    } catch (error) {
      console.error("Error navegando al perfil del usuario:", error);
      Alert.alert("Error", "No se pudo navegar al perfil del usuario.");
    }
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
    const currentMessageDate = item.createdAt ? new Date(item.createdAt.seconds * 1000) : new Date();
    const previousMessageDate =
      previousMessage && previousMessage.createdAt ? new Date(previousMessage.createdAt.seconds * 1000) : null;

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
                    color="black"
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
                  color="black"
                  style={styles.seenIcon}
                />
              )}
            </View>
          </View>
        </>
      );
    }

    if (item.isUploading) {
      return (
        <View style={[styles.message, styles.sent, styles.uploadingMessage]}>
          <ActivityIndicator size="large" color="black" />
        </View>
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
                  color="black"
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
      <Complaints
  isVisible={isComplaintVisible}
  onClose={() => setIsComplaintVisible(false)}
  onSubmit={(reason, description) => {
    console.log("Razón y descripción enviadas:", { reason, description });
    handleReportSubmit(reason, description);
    setIsComplaintVisible(false);
  }}
/>


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
  uploadingMessage:{
    backgroundColor: "rgba(255, 255, 255, 0.8)",
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
    height: 200,
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
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    marginVertical: 8,
  },
  uploadingText: {
    marginTop: 10,
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
    width: 70,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Background color for view once images
  },
  imageNotViewed: {
    backgroundColor: "rgba(240, 240, 240, 1)",
  },
  imageViewed: {
    backgroundColor: "rgba(240, 240, 240, 1)",
  },

  viewOnceVideoPlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },

  imageStatusText: {
    color: "black",
    fontSize: 14,
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
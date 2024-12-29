import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { auth, database, storage } from "../../config/firebase";
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
  where,
  arrayUnion,
} from "firebase/firestore";

import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Video } from "expo-av";
import { Audio } from "expo-av";
import AudioPlayer from "../AudioPlayer";
import { useBlockedUsers } from "../../src/contexts/BlockContext";
import { ImageBackground } from "react-native";
import { Menu } from "react-native-paper";
import { Ionicons, FontAwesome, Feather } from "@expo/vector-icons";
import { styles } from "./styles";
import { muteChat, handleDeleteMessage  } from "./utils";

import Complaints from "../../Components/Complaints/Complaints";
import { useTranslation } from "react-i18next";

export default function Chat({ route }) {
  const { currentChatId, recipientUser, imageUri } = route.params; //a Params no le llega el initialchatId
  const [backgroundImage, setBackgroundImage] = useState(imageUri || null);
  const [chatId, setChatId] = useState(currentChatId || "");
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
  const [mutedChats, setMutedChats] = useState([]);
  const [isMuteModalVisible, setIsMuteModalVisible] = useState(false);

  const [noteText, setNoteText] = useState(""); // Estado para almacenar el texto de la nota
  const { t } = useTranslation();

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages.length]);

  const handleMuteChat = (hours) => {
    muteChat(user.uid, chatId, hours, setMutedChats);
  };

  // Verificación de usuarios bloqueados
  useEffect(() => {
    if (blockedUsers.includes(recipientUser.id)) {
      Alert.alert(t("chatUsers.error"), t("chatUsers.blockedUser"));
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
    if (chatId) {
      const messagesRef = collection(database, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));

      // Escuchar los mensajes en tiempo real
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesList);

        // Marcar los mensajes como leídos
        markMessagesAsRead(messagesList);
        
        // Scroll to the last message after messages are loaded
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      });

      return () => unsubscribe();
    }
  }, [chatId]);

  const markMessagesAsRead = async (messages) => {
    try {
      if (!chatId) {
        console.error("El chatId no está definido.");
        return;
      }

      const batch = writeBatch(database);

      messages.forEach((message) => {
        if (
          message.senderId !== user.uid &&
          (!Array.isArray(message.viewedBy) ||
            !message.viewedBy.includes(user.uid)) &&
          !message.isViewOnce // Ignorar mensajes de tipo "ver una vez"
        ) {
          const messageRef = doc(
            database,
            "chats",
            chatId,
            "messages",
            message.id
          );
          batch.update(messageRef, {
            viewedBy: arrayUnion(user.uid),
            seen: true,
          });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error("Error al marcar los mensajes como leídos:", error);
    }
  };

  const handleReport = async () => {
    try {
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
        Alert.alert(t("chatUsers.error"), t("chatUsers.chatNotFound"));
        return;
      }

      const chatData = chatSnapshot.data();
      const participants = chatData.participants || [];

      const recipientId = participants.find(
        (participant) => participant !== user.uid
      );

      if (!recipientId) {
        console.error("No se encontró un ID válido para el usuario reportado.");
        Alert.alert(t("chatUsers.error"), t("chatUsers.reportedUserNotFound"));
        return;
      }

      const complaintsRef = collection(database, "complaints");
      const newComplaint = {
        reporterId: user.uid,
        reporterName: user.displayName || "Anónimo",
        reportedId: recipientId,
        reportedName: `${recipientUser?.firstName || "Usuario"} ${
          recipientUser?.lastName || "desconocido"
        }`,
        reason,
        description: description || "",
        timestamp: new Date(),
      };

      await addDoc(complaintsRef, newComplaint);

      Alert.alert(t("chatUsers.thankYou"), t("chatUsers.reportSubmitted"));
      setIsComplaintVisible(false);
    } catch (error) {
      console.error("Error al enviar la denuncia:", error);
      Alert.alert(t("chatUsers.error"), t("chatUsers.reportError"));
    }
  };

  const createChatIfNotExists = async () => {
    if (!chatId) {
      try {
        const chatsRef = collection(database, "chats");
        const q = query(
          chatsRef,
          where("participants", "array-contains", user.uid)
        );

        const querySnapshot = await getDocs(q);
        let existingChatId = null;

        querySnapshot.forEach((doc) => {
          const chatData = doc.data();
          if (chatData.participants.includes(recipientUser.id)) {
            existingChatId = doc.id; // Encuentra el chat que coincide
          }
        });

        if (existingChatId) {
          setChatId(existingChatId); // Si el chat existe, usa su ID
          return existingChatId;
        }

        // Si no existe el chat, crearlo
        const chatRef = doc(chatsRef);
        const newChatId = chatRef.id;

        await setDoc(chatRef, {
          participants: [user.uid, recipientUser.id],
          createdAt: new Date(),
          lastMessage: "",
        });

        setChatId(newChatId);
        return newChatId;
      } catch (error) {
        console.error("Error al verificar o crear el chat:", error);
      }
    }

    return chatId; // Retorna el ID del chat actual si ya está definido
  };

  const handleSend = async (
    messageType = "text",
    mediaUri = null,
    isViewOnce = false // Este parámetro se pasará desde donde se llama a la función
  ) => {
    if (isUploading) {
      Alert.alert(t("chatUsers.uploading"), t("chatUsers.waitForUpload"));
      return;
    }

    if (!message.trim() && !mediaUri) {
      return;
    }

    try {
      const chatIdToUse = chatId || (await createChatIfNotExists());
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
        setMessage("");
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
          [`isHidden.${user.uid}`]: false,
          [`deletedFor.${user.uid}`]: false,
          [`isHidden.${otherParticipantId}`]: false,
        });
      }

      // Limpiar el campo de texto
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      Alert.alert(t("chatUsers.error"), t("chatUsers.sendMessageError"));
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
        [`deletedFor.${user.uid}`]: true,
      });

      // Mark all messages as deleted for the current user
      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.forEach((messageDoc) => {
        batch.update(messageDoc.ref, {
          [`deletedFor.${user.uid}`]: true,
        });
      });

      // Commit the batch
      await batch.commit();

      // Navigate back
      navigation.goBack();
      Alert.alert(t("chatUsers.success"), t("chatUsers.chatDeleted"));
    } catch (error) {
      console.error("Error al eliminar el chat:", error);
      Alert.alert(t("chatUsers.error"), t("chatUsers.deleteChatError"));
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
      Alert.alert(t("chatUsers.error"), t("chatUsers.uploadError"));
      return null;
    } finally {
      setIsUploading(false); // Finaliza la carga
    }
  };

  const handleCameraLaunch = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("chatUsers.permissionDenied"),
        t("chatUsers.cameraPermission")
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
        t("chatUsers.permissionDenied"),
        t("chatUsers.galleryPermission")
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

  const handleUserPress = async () => {
    try {
      if (!chatId) {
        Alert.alert(t("chatUsers.error"), t("chatUsers.chatNotFound"));
        return;
      }

      const chatRef = doc(database, "chats", chatId);
      const chatSnapshot = await getDoc(chatRef);

      if (!chatSnapshot.exists()) {
        console.error("El documento del chat no existe.");
        Alert.alert(t("chatUsers.error"), t("chatUsers.chatNotFound"));
        return;
      }

      const chatData = chatSnapshot.data();

      // Obtener el ID del destinatario desde los participantes
      const otherParticipantId = chatData.participants.find(
        (participantId) => participantId !== user.uid
      );

      if (!otherParticipantId) {
        console.error("No se encontró un ID válido para el destinatario.");
        Alert.alert(t("chatUsers.error"), t("chatUsers.recipientNotFound"));
        return;
      }

      navigation.navigate("UserProfile", {
        selectedUser: { id: otherParticipantId, ...recipientUser },
      });
    } catch (error) {
      console.error("Error navegando al perfil del usuario:", error);
      Alert.alert(t("chatUsers.error"), t("chatUsers.navigateToProfileError"));
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
        Alert.alert(t("chatUsers.error"), t("chatUsers.messageNotFound"));
        return;
      }

      const messageData = messageSnapshot.data();

      // Solo actualizar si es una imagen de "ver una vez"
      if (isViewOnce) {
        if (messageData.viewedBy?.includes(user.uid)) {
          Alert.alert("Imagen no disponible", "Esta imagen ya ha sido vista.");
          return;
        }

        // Marcar el mensaje como visto por el usuario actual
        await updateDoc(messageRef, {
          viewedBy: [...(messageData.viewedBy || []), user.uid],
          seen: true,
        });

        setSelectedImage(mediaUrl);
        setIsModalVisible(true);
      } else {
        setSelectedImage(mediaUrl);
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error("Error al abrir la imagen:", error);
      Alert.alert(t("chatUsers.error"), t("chatUsers.openImageError"));
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  const handleLongPressMessage = (message) => {
    if (message.senderId === user.uid) {
      // Allow deletion of messages sent by the current user
      Alert.alert(
        t("chatUsers.messageOptions"),
        t("chatUsers.messageOptionsPrompt"),
        [
          {
            text: t("chatUsers.cancel"),
            onPress: () => setSelectedMessageId(null),
            style: "cancel",
          },
          {
            text: t("chatUsers.delete"),
            onPress: () => onDeleteMessage(message.id),
            style: "destructive",
          },
        ]
      );
    }
  };

  const onDeleteMessage = (messageId) => {
    handleDeleteMessage(database, chatId, user, messageId, recipientUser, setMessages)
      .catch((error) => Alert.alert("Error", error.message));
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
    const currentMessageDate = item.createdAt
      ? new Date(item.createdAt.seconds * 1000)
      : new Date();
    const previousMessageDate =
      previousMessage && previousMessage.createdAt
        ? new Date(previousMessage.createdAt.seconds * 1000)
        : null;

    const isSameDay =
      previousMessageDate &&
      currentMessageDate.toDateString() === previousMessageDate.toDateString();

    const isOwnMessage = item.senderId === user.uid;

    const isDeleted = item.deletedFor?.[user.uid];
    if (isDeleted) {
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
                ? t("chatUsers.youAnswered")
                : t("chatUsers.Answered")}
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
              {isOwnMessage
                ? t("chatUsers.youAnsweredNote")
                : t("chatUsers.AnsweredNote")}
            </Text>

            <Image
              source={require("../../assets/flecha-curva.png")}
              style={[
                styles.arrowImage,
                isOwnMessage
                  ? styles.arrowImageSent
                  : styles.arrowImageReceived,
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

            {item.mediaType === "image" &&
              (item.isViewOnce ? (
                <TouchableOpacity
                  onPress={() =>
                    handleMediaPress(
                      item.mediaUrl,
                      "image",
                      item.id,
                      item.isViewOnce
                    )
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
                    {item.viewedBy?.includes(user.uid)
                      ? t("chatUsers.alreadyViewed")
                      : t("chatUsers.view")}
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
              ))}

            {item.mediaType === "video" && (
              <>
                <Video
                  source={{ uri: item.mediaUrl }}
                  style={styles.messageVideo}
                  useNativeControls
                  resizeMode="contain"
                />
                {item.senderId === user.uid &&
                  item.viewedBy?.includes(recipient.uid) && (
                    <Ionicons
                      name="checkmark-done-sharp"
                      size={16}
                      color="black"
                      style={styles.seenIcon}
                    />
                  )}
              </>
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
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
                  t("chatUsers.deleteChat"),
                  t("chatUsers.deleteChatConfirmation"),
                  [
                    {
                      text: t("chatUsers.cancel"),
                      style: "cancel",
                    },
                    {
                      text: t("chatUsers.delete"),
                      onPress: handleDeleteChat,
                    },
                  ]
                );
              }}
              title={t("chatUsers.deleteChat")}
              titleStyle={styles.menuItemText}
              style={styles.menuItemContainer}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setIsMuteModalVisible(true);
              }}
              title={t("chatUsers.mute")}
              titleStyle={styles.menuItemText}
            />
            <Menu.Item
              onPress={handleReport}
              title={t("chatUsers.report")}
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
          maxToRenderPerBatch={50}
          windowSize={21}
          removeClippedSubviews={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          initialNumToRender={messages.length}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10
          }}
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
            placeholder={t("chatUsers.writeMessage")}
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
          transparent={true}
          visible={isMuteModalVisible}
          animationType="fade"
          onRequestClose={() => setIsMuteModalVisible(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setIsMuteModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {t("chatUsers.selectMuteDuration")}
                </Text>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    handleMuteChat(1);
                    setIsMuteModalVisible(false);
                  }}
                >
                  <Text style={styles.modalText}>{t("chatUsers.oneHour")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    handleMuteChat(4);
                    setIsMuteModalVisible(false);
                  }}
                >
                  <Text style={styles.modalText}>
                    {t("chatUsers.fourHours")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    handleMuteChat(8);
                    setIsMuteModalVisible(false);
                  }}
                >
                  <Text style={styles.modalText}>
                    {t("chatUsers.eightHours")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    handleMuteChat(24);
                    setIsMuteModalVisible(false);
                  }}
                >
                  <Text style={styles.modalText}>
                    {t("chatUsers.twentyFourHours")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

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
            handleReportSubmit(reason, description);
            setIsComplaintVisible(false);
          }}
        />
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

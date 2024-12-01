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
import { addDoc, collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, database } from "../../config/firebase";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import AudioPlayer from "../AudioPlayer";
import { useBlockedUsers } from "../../src/contexts/BlockContext";
import { ImageBackground } from "react-native";
import { Menu } from "react-native-paper";
import { Ionicons, FontAwesome, Feather } from "@expo/vector-icons";
import { styles } from "./styles";
import { setupChat, handleReport, handleReportSubmit, handleCameraLaunch, pickMedia, handleHideChat, handleUserPress, handleMediaPress } from "./utils";


import Complaints from '../../Components/Complaints/Complaints';
import { storage } from "../../config/firebase";

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
    setupChat({chatId, setMessages});
  }, [chatId]);

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
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
              source={require("../../assets/flecha-curva.png")}
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
                    handleMediaPress(item.mediaUrl, "image", item.id, item.isViewOnce, params= {chatId, user, setSelectedImage, setIsModalVisible})
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

const handleSend = async (
  messageType = "text",
  mediaUri = null,
  isViewOnce = false
) => {
  if (isUploading) {
      Alert.alert("Cargando", "Por favor espera a que termine la subida actual.");
      return;
  }

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

  return (
    <ImageBackground source={{ uri: backgroundImage }} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleUserPress({chatId, user, navigation, recipientUser})} style={styles.userInfo}>
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
            onPress={() => handleHideChat({chatId, setIsChatHidden, setMenuVisible})}
            title="Silenciar"
            titleStyle={styles.menuItemText}
            style={styles.menuItemContainer}
          />
          <Menu.Item
            onPress={() => handleReport({recipient, setIsComplaintVisible})}
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
          onPress={() => handleCameraLaunch({ImagePicker, handleSend})}
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
            onPress={() => {console.log("está entrando"), handleSend("text")}}
            style={styles.sendButton}
          >
            <FontAwesome name="send" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => pickMedia({ImagePicker, handleSend})}
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
    handleReportSubmit({reason, description, chatId, recipientUser, setIsComplaintVisible, user});
    setIsComplaintVisible(false);
  }}
/>


    </ImageBackground>


  );
}


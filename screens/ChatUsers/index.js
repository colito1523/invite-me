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
  Dimensions,
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

import MessageItem from "./MessageItem";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Video } from "expo-av";
import ChatHeader from "./ChatHeader";
import { useBlockedUsers } from "../../src/contexts/BlockContext";
import { ImageBackground } from "react-native";
import { Ionicons, FontAwesome, Feather } from "@expo/vector-icons";
import { styles } from "./styles";
import { muteChat, handleDeleteMessage, handleMediaPress, pickMedia } from "./utils";

import Complaints from "../../Components/Complaints/Complaints";
import ReplyBox from "./ReplyBox";
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
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const user = auth.currentUser;
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const blockedUsers = useBlockedUsers();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isComplaintVisible, setIsComplaintVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const videoRef = useRef(null);
  const [modalImageLoading, setModalImageLoading] = useState(true);
  const [mutedChats, setMutedChats] = useState([]);
  const [isMuteModalVisible, setIsMuteModalVisible] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const scrollToMessage = (replyToId) => {
    const index = messages.findIndex((msg) => msg.id === replyToId);
    if (index >= 0) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    } else {
      Alert.alert(t("chatUsers.dontFind"), t("chatUsers.dontFindMessage"));
    }
  };
  

  const [noteText, setNoteText] = useState(""); // Estado para almacenar el texto de la nota
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

  const handleReply = (messageData) => {
    console.log("Replying to message:", messageData);
    setReplyMessage({
      text: messageData.text,
      mediaUrl: messageData.mediaUrl,
      isViewOnce: messageData.isViewOnce, // Asegúrate de incluir esta propiedad
      id: messageData.id,
    });
  };

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
            message.id,
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
        (participant) => participant !== user.uid,
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
          where("participants", "array-contains", user.uid),
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
    isViewOnce = false, // Este parámetro se pasará desde donde se llama a la función
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
        "messages",
      );

      let messageData = {
        senderId: user.uid,
        senderName: user.displayName || "Anónimo",
        createdAt: new Date(),
        seen: false,
        viewedBy: [],
        isViewOnce,
      };

      // Si hay un replyMessage, lo guardamos
      if (replyMessage) {
        messageData.replyTo = replyMessage.text || "Imagen"; // Muestra "Imagen" si no hay texto
        messageData.replyToMediaUrl = replyMessage.mediaUrl || null; // Guarda la URL de la imagen
        messageData.replyToIsViewOnce = replyMessage.isViewOnce || false; // Asegúrate de incluir esta propiedad
        messageData.replyToId = replyMessage.id;
        setReplyMessage(null);
      }

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
            message.id === tempId ? { ...messageData, id: tempId } : message,
          ),
        );
      }
      
      await addDoc(messagesRef, messageData);

      // Actualizar información del chat
      const chatDocRef = doc(database, "chats", chatIdToUse);
      const chatDoc = await getDoc(chatDocRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const otherParticipantId = chatData.participants.find(
          (participant) => participant !== user.uid,
        );

        // Establecer isHidden a false para el receptor
        await updateDoc(chatDocRef, {
          lastMessage: messageData.text || "Enviou uma foto",
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
        `media/${user.uid}/${new Date().getTime()}`,
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
        t("chatUsers.cameraPermission"),
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


  const closeModal = () => {
  setIsModalVisible(false);
  setSelectedImage(null);
  setModalImageLoading(true); // Reinicia el indicador para la próxima imagen
};

  const handleLongPressMessage = (message) => {
    // Allow deletion of messages sent by the current user or received from the other user
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
      ],
    );
  };

  const onDeleteMessage = (messageId) => {
    handleDeleteMessage(
      database,
      chatId,
      user,
      messageId,
      recipientUser,
      setMessages,
    ).catch((error) => Alert.alert("Error", error.message));
  };


  return (
    <ImageBackground source={require('../../assets/fondo chat.jpg')} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
       <ChatHeader
  recipient={recipient}
  chatId={chatId}
  handleDeleteChat={handleDeleteChat}
  handleReport={handleReport}
  handleMuteChat={handleMuteChat}
/>

        <FlatList
  ref={flatListRef}
  data={messages}
  keyExtractor={(item) => item.id}
  renderItem={({ item, index }) => (
    <MessageItem
      item={item}
      index={index}
      messages={messages}
      user={user}
      database={database}
      chatId={chatId}
      setSelectedImage={setSelectedImage}
      setIsModalVisible={setIsModalVisible}
      handleLongPressMessage={handleLongPressMessage}
      handleMediaPress={handleMediaPress}
      recipient={recipient}
      t={t}
      onReply={handleReply}
      onReferencePress={scrollToMessage} 
      replyMessage={replyMessage}
    />
  )}
  maxToRenderPerBatch={50}
  windowSize={21}
  removeClippedSubviews={false}
  onContentSizeChange={() =>
    flatListRef.current?.scrollToEnd({ animated: false })
  }
  onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
  initialNumToRender={messages.length}
  maintainVisibleContentPosition={{
    minIndexForVisible: 0,
    autoscrollToTopThreshold: 10,
  }}
/>


        <View style={{ paddingHorizontal: 8 }}>
        <ReplyBox
  text={replyMessage?.text}
  mediaUrl={replyMessage?.mediaUrl}
  isViewOnce={replyMessage?.isViewOnce}
  onClose={() => setReplyMessage(null)}
/>
        </View>

   

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
            multiline
            numberOfLines={1}
            textAlignVertical="center"
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
            onPress={() => pickMedia(handleSend, t)}
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
  <View style={styles.modalBackground}>
    <TouchableOpacity
      style={styles.closeModalButton}
      onPress={closeModal}
    >
      <Ionicons name="close" size={28} color="white" />
    </TouchableOpacity>
    <View style={styles.mediaContainer}>
      {selectedImage &&
        (typeof selectedImage === "object" &&
        selectedImage.mediaType === "video" ? (
          // Aquí va la lógica para video
          <View style={styles.videoContainer}>
                    <Video
                      source={{ uri: selectedImage.uri }}
                      style={styles.fullscreenMedia}
                      resizeMode="cover"
                      shouldPlay={true}
                      isLooping={false}
                      useNativeControls={false}
                      onPlaybackStatusUpdate={(status) => {
                        if (status.didJustFinish) {
                          videoRef.current.setPositionAsync(0);
                          setIsPlaying(false);
                          setControlsVisible(true);
                          videoRef.current.pauseAsync();
                        }
                        if (status.isLoaded) {
                          setDuration(status.durationMillis);
                          setCurrentTime(status.positionMillis);
                          setIsPlaying(status.isPlaying);
                        }
                      }}
                      ref={videoRef}
                    />
                    <TouchableWithoutFeedback
                      onPress={() => setControlsVisible((prev) => !prev)}
                    >
                      <View style={styles.fullScreenTouchable}>
                        {controlsVisible && (
                          <TouchableOpacity
                            style={styles.playButton}
                            onPress={() => {
                              if (videoRef.current) {
                                if (isPlaying) {
                                  videoRef.current.pauseAsync();
                                } else {
                                  videoRef.current.playAsync();
                                }
                                setIsPlaying(!isPlaying);
                              }
                            }}
                          >
                            <Ionicons
                              name={isPlaying ? "pause" : "play"}
                              size={50}
                              color="white"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableWithoutFeedback>
                    <View style={styles.videoControlsContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progress,
                            { width: `${(currentTime / duration) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
        ) : (
          <TouchableWithoutFeedback onPress={closeModal}>
          <View
            style={{
              width: windowWidth,
              height: windowHeight,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {modalImageLoading && (
              <ActivityIndicator
                size="large"
                color="#fff"
                style={{ position: "absolute", zIndex: 1 }}
              />
            )}
            <Image
              source={{
                uri:
                  typeof selectedImage === "object"
                    ? selectedImage.uri
                    : selectedImage,
              }}
              style={{
                width: windowWidth,
                height: windowHeight,
                resizeMode: "contain",
                opacity: modalImageLoading ? 0 : 1,
              }}
              onLoad={() => {
                console.log("Imagen cargada correctamente");
                setModalImageLoading(false);
              }}
              onError={(error) => {
                console.error("Error al cargar la imagen", error);
                setModalImageLoading(false);
              }}
            />
          </View>
        </TouchableWithoutFeedback>
        
        
        ))}
    </View>
  </View>
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
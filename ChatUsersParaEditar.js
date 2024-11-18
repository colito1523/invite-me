import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Menu } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { Feather, Ionicons, FontAwesome, MaterialIcons  } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  getDocs,
  where,
  Timestamp,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useBlockedUsers } from "../src/contexts/BlockContext";
import { auth, database, storage } from "../config/firebase";
import Complaints from "../Components/Complaints/Complaints";

export default function ChatScreen({ route }) {
  const { chatId, recipientUser, currentUserId, recipientUserId } = route.params;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(recipientUser);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isChatHidden, setIsChatHidden] = useState(false);
  const [storyResponses, setStoryResponses] = useState([]);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [viewedOnceImages, setViewedOnceImages] = useState(new Set());

  const user = auth.currentUser;
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const blockedUsers = useBlockedUsers();

  useEffect(() => {
    if (currentUserId) {
      const fetchNote = async () => {
        try {
          const noteRef = doc(database, "users", currentUserId, "note", "current");
          const noteSnapshot = await getDoc(noteRef);
          if (noteSnapshot.exists()) {
            setNoteText(noteSnapshot.data().text);
          } else {
            setNoteText("No hay nota disponible");
          }
        } catch (error) {
          console.error("Error al obtener la nota:", error);
          setNoteText("Error al obtener la nota");
        }
      };
      fetchNote();
    }
  }, [currentUserId]);

  const setupChat = async () => {
    if (chatId) {
      try {
        const messagesRef = collection(database, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));
  
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messagesList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          setMessages(messagesList);
  
          const batch = writeBatch(database);
  
          querySnapshot.docs.forEach((doc) => {
            const messageData = doc.data();
  
            if (
              messageData.senderId !== user.uid && // Solo mensajes recibidos
              (!messageData.seen || !messageData.seen.includes(user.uid)) // No marcado como visto
            ) {
              batch.update(doc.ref, {
                seen: arrayUnion(user.uid),
              });
            }
          });
  
          // Ejecutar la operación en batch
          batch.commit().catch((error) => {
            console.error("Error al marcar mensajes como vistos:", error);
          });
        });
  
        // Establecer la imagen de fondo del usuario destinatario
        if (
          recipientUser?.photoUrls &&
          recipientUser.photoUrls.length > 0
        ) {
          setBackgroundImage(recipientUser.photoUrls[0]);
        }
  
        // Opcional: Cargar respuestas a historias del destinatario
        const fetchStoryResponses = async () => {
          if (recipientUser?.id) {
            const userStoriesRef = collection(
              database,
              "users",
              recipientUser.id,
              "stories"
            );
            const userStoriesSnapshot = await getDocs(userStoriesRef);
  
            const responses = [];
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
                  isStoryResponse: true,
                }))
              );
            }
  
            setStoryResponses(responses);
          }
        };
  
        fetchStoryResponses();
  
        return () => unsubscribe();
      } catch (error) {
        console.error("Error en setupChat:", error);
      }
    }
  };
  

  useEffect(() => {
    setupChat();
  }, [chatId, blockedUsers, recipientUser, currentUserId, recipientUserId]);

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

      return newChatId;
    }

    return chatId;
  };

  const uploadMedia = async (uri, mediaType) => {
    if (!uri) return null;

    const uploadId = Date.now().toString();
    setUploadingMedia((prev) => [...prev, { id: uploadId, progress: 0 }]);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExtension =
        mediaType === "video"
          ? ".mp4"
          : mediaType === "audio"
          ? ".m4a"
          : ".jpg";
      const fileName = `${user.uid}_${new Date().getTime()}${fileExtension}`;
      const storageRef = ref(storage, `media/${user.uid}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadingMedia((prev) =>
              prev.map((item) =>
                item.id === uploadId ? { ...item, progress } : item
              )
            );
          },
          (error) => {
            console.error("Error uploading media:", error);
            setUploadingMedia((prev) =>
              prev.filter((item) => item.id !== uploadId)
            );
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadingMedia((prev) =>
              prev.filter((item) => item.id !== uploadId)
            );
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error("Error in uploadMedia:", error);
      setUploadingMedia((prev) => prev.filter((item) => item.id !== uploadId));
      return null;
    }
  };

  const handleSend = async (messageType = "text", mediaUri = null, isViewOnce = false) => {
    const chatIdToUse = await createChatIfNotExists();
    const messagesRef = collection(database, "chats", chatIdToUse, "messages");

    let messageData = {
        senderId: user.uid,
        senderName: user?.username || user.displayName || "Sin Nombre",
        createdAt: new Date(),
        seen: [user.uid],
        deletedFor: {},
        viewedBy: [],
    };

    if (messageType === "text") {
        messageData.text = message;
    } else if (["image", "video"].includes(messageType)) {
        try {
            const downloadURL = await uploadMedia(mediaUri, messageType);
            if (downloadURL) {
                messageData.mediaType = messageType;
                messageData.mediaUrl = downloadURL;
                messageData.isViewOnce = isViewOnce; // Usa el valor proporcionado de isViewOnce
            } else {
                throw new Error("Failed to upload media");
            }
        } catch (error) {
            console.error("Error uploading media:", error);
            Alert.alert(
                "Error",
                "No se pudo subir el archivo multimedia. Por favor, inténtalo de nuevo."
            );
            return;
        }
    }

    await addDoc(messagesRef, messageData);
    updateLastMessage(chatIdToUse, messageData);

    setMessage("");
    flatListRef.current?.scrollToEnd({ animated: true });
};



  const updateLastMessage = async (chatId, messageData) => {
    try {
      const chatDocRef = doc(database, "chats", chatId);
      await updateDoc(chatDocRef, {
        lastMessage: messageData.text || `${messageData.mediaType} enviado`,
        lastMessageTimestamp: messageData.createdAt,
        lastMessageSenderId: messageData.senderId,
        lastMessageSenderName: messageData.senderName,
      });
    } catch (error) {
      console.error("Error al actualizar el último mensaje:", error);
    }
  };

  const handleDeleteChat = async () => {
    try {
      const batch = writeBatch(database);
      const chatRef = doc(database, "chats", chatId);
      const messagesRef = collection(database, "chats", chatId, "messages");

      batch.update(chatRef, {
        [`deletedFor.${user.uid}`]: {
          timestamp: serverTimestamp(),
          deletedAt: new Date().toISOString(),
        },
      });

      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.forEach((messageDoc) => {
        batch.update(messageDoc.ref, {
          [`deletedFor.${user.uid}`]: {
            timestamp: serverTimestamp(),
            deletedAt: new Date().toISOString(),
          },
        });
      });

      await batch.commit();

      navigation.goBack();

      Alert.alert("Éxito", "El chat ha sido eliminado para ti.");
    } catch (error) {
      console.error("Error al eliminar el chat:", error);
      Alert.alert(
        "Error",
        "No se pudo eliminar el chat. Por favor, intenta nuevamente."
      );
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

  const handleMediaPress = async (mediaUrl, mediaType, messageId, isViewOnce) => {
    if (!isViewOnce) {
        setSelectedMedia({ url: mediaUrl, type: mediaType });
        setIsModalVisible(true);
        return;
    }

    try {
        const messageRef = doc(database, "chats", chatId, "messages", messageId);
        const messageSnapshot = await getDoc(messageRef);

        if (messageSnapshot.exists()) {
            const messageData = messageSnapshot.data();
            
            if (messageData.viewedBy?.includes(user.uid)) {
                Alert.alert("Imagen no disponible", "Esta imagen ya ha sido vista y no está disponible.");
            } else {
                // Permitir ver la imagen y añadir el usuario al campo viewedBy
                setSelectedMedia({ url: mediaUrl, type: mediaType });
                setIsModalVisible(true);
                await updateDoc(messageRef, {
                    viewedBy: arrayUnion(user.uid)
                });
            }
        }
    } catch (error) {
        console.error("Error al actualizar el estado de la visualización:", error);
    }
};

  const handleLongPressMessage = (message) => {
    const options = [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar para mí",
        onPress: () => handleDeleteMessageForMe(message),
      },
    ];

    if (message.senderId === user.uid) {
      options.push({
        text: "Eliminar para todos",
        onPress: () => handleDeleteMessageForEveryone(message),
      });
    }

    Alert.alert("Opciones de Mensaje", "¿Qué te gustaría hacer?", options);
  };

  const handleDeleteMessageForMe = async (message) => {
    try {
      const messageRef = doc(database, "chats", chatId, "messages", message.id);
      await updateDoc(messageRef, {
        [`deletedFor.${user.uid}`]: true,
      });
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== message.id)
      );
    } catch (error) {
      console.error("Error al eliminar el mensaje:", error);
    }
  };

  const handleDeleteMessageForEveryone = async (message) => {
    try {
      await deleteDoc(doc(database, "chats", chatId, "messages", message.id));

      if (message.mediaUrl) {
        const mediaRef = ref(storage, message.mediaUrl);
        try {
          await deleteObject(mediaRef);
        } catch (mediaError) {
          console.error("Error al eliminar el archivo multimedia:", mediaError);
        }
      }
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== message.id)
      );
    } catch (error) {
      console.error("Error al eliminar el mensaje para todos:", error);
      Alert.alert(
        "Error",
        "No se pudo eliminar el mensaje. Por favor, inténtalo de nuevo."
      );
    }
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const chatIdToUse = await createChatIfNotExists();
      const messagesRef = collection(
        database,
        "chats",
        chatIdToUse,
        "messages"
      );
      try {
        const userRef = doc(database, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        let senderName = "Sin Nombre";
        if (userSnapshot.exists()) {
          senderName =
            userSnapshot.data().username ||
            `${userSnapshot.data().firstName} ${
              userSnapshot.data().lastName
            }` ||
            "Sin Nombre";
        }

        const messageData = {
          text: message,
          senderId: user.uid,
          senderName: senderName,
          createdAt: new Date(),
          seen: [user.uid],
        };

        await addDoc(messagesRef, messageData);
        updateLastMessage(chatIdToUse, messageData);

        setMessage("");
      } catch (error) {
        console.error("Error al enviar el mensaje:", error);
        Alert.alert(
          "Error",
          "No se pudo enviar el mensaje. Por favor, inténtalo de nuevo."
        );
      }
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
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
    });

    if (!result.canceled) {
        const asset = result.assets[0];
        const mediaType = asset.type === "video" ? "video" : "image";
        handleSend(mediaType, asset.uri, true); // isViewOnce: true para cámara
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
        handleSend(mediaType, result.assets[0].uri, false); // isViewOnce: false para galería
    }
};

  const truncateNote = (note) => {
    return note && typeof note === "string"
      ? note.length > 15
        ? note.substring(0, 15) + "..."
        : note
      : "";
  };

  const renderMessage = ({ item }) => {
    const isEmoji = item.text && isOnlyEmojis(item.text);
    const isOwnMessage = item.senderId === user.uid;

    if (item.isStoryResponse) {
      return (
          <View
              style={[
                  styles.message,
                  isOwnMessage ? styles.sent : styles.received,
                  styles.storyResponseContainer,
              ]}
          >
              {/* Texto indicando la respuesta */}
              <Text style={styles.storyResponseText}>
                  {isOwnMessage ? "Respondiste a su historia" : `${item.senderName} respondió a tu historia`}
              </Text>
  
              {/* Imagen de la historia */}
              <Image
                  source={{ uri: item.storyUrl }}
                  style={styles.storyResponseImage}
                  cachePolicy="memory-disk"
              />
  
              {/* Mensaje de la respuesta */}
              <TouchableOpacity
                  onPress={() => navigation.navigate("FullStory", { storyUrl: item.storyUrl })}
              >
                  <Text style={styles.messageText}>{item.text}</Text>
              </TouchableOpacity>
          </View>
      );
  }
    if (item.isNoteResponse) {
      return (
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
            cachePolicy="memory-disk"
          />

          <View>
            <Text style={styles.originalNoteText}>{noteText}</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("FullNote", { note: item })}
          >
            <Text style={styles.messageTextNotas}>{item.text}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity onLongPress={() => handleLongPressMessage(item)}>
        <View
          style={[
            styles.message,
            item.senderId === user.uid ? styles.sent : styles.received,
            item.mediaType === "image" && styles.noBackground, // Aplica estilo sin fondo para imágenes
            isEmoji && styles.emojiMessage,
          ]}
        >
          {item.text && (
            <Text style={[styles.messageText, isEmoji && styles.emojiText]}>
              {item.text}
            </Text>
          )}
          {item.mediaType === "image" && (
    <TouchableOpacity
        onPress={() => handleMediaPress(item.mediaUrl, "image", item.id, item.isViewOnce)}
    >
        {item.isViewOnce ? (
            <View style={styles.viewOnceImagePlaceholder}>
                <MaterialIcons name="visibility-off" size={24} color="white" />
                <Text style={styles.viewOnceText}>
                    {item.viewedBy?.includes(user.uid) ? "Ya vista" : "Ver una vez"}
                </Text>
            </View>
        ) : (
            <Image
                source={{ uri: item.mediaUrl }}
                style={styles.messageImage}
                cachePolicy="memory-disk"
            />
        )}
    </TouchableOpacity>
)}
          {item.mediaType === "video" && (
            <TouchableOpacity
              onPress={() => handleMediaPress(item.mediaUrl, "video", item.id, item.isViewOnce)}
            >
              {item.isViewOnce ? (
                <View style={styles.viewOnceVideoPlaceholder}>
                  <MaterialIcons name="visibility-off" size={24} color="white" />
                  <Text style={styles.viewOnceText}>Video de una vez</Text>
                </View>
              ) : (
                <>
                  <Video
                    source={{ uri: item.mediaUrl }}
                    style={styles.messageVideo}
                    useNativeControls={false}
                    resizeMode="cover"
                  />
                  <View style={styles.playButtonOverlay}>
                    <Ionicons name="play" size={40} color="white" />
                  </View>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const isOnlyEmojis = (text) => {
    const emojiRegex =
      /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]){1,3}$/;
    return emojiRegex.test(text);
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
        data={[...messages, ...storyResponses].sort(
          (a, b) => a.createdAt - b.createdAt
        )}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onContentSizeChange={() =>
          flatListRef.current.scrollToEnd({ animated: true })
        }
      />

      {uploadingMedia.length > 0 && (
        <View style={styles.uploadingContainer}>
          {uploadingMedia.map((item) => (
            <View key={item.id} style={styles.uploadingItem}>
              <ActivityIndicator size={50} color="#0000ff" />
              <Text style={styles.uploadingText}>
                Subiendo... {item.progress.toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      )}

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
            onPress={handleSendMessage}
            style={styles.sendButton}
          >
            <FontAwesome name="send" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={pickMedia}
              style={styles.iconButtonGaleria}
            >
              <Ionicons name="image-outline" size={30} color="#000" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalBackground}>
            {selectedMedia && selectedMedia.type === "image" && (
              <Image
                source={{ uri: selectedMedia.url }}
                style={styles.fullscreenMedia}
                cachePolicy="memory-disk"
              />
            )}
            {selectedMedia && selectedMedia.type === "video" && (
              <Video
                source={{ uri: selectedMedia.url }}
                style={styles.fullscreenMedia}
                useNativeControls
                resizeMode="contain"
                shouldPlay
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Complaints
        isVisible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSubmit={handleReportSubmit}
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
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
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
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    fontWeight: "bold",
  },
  received: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    fontWeight: "bold",
  },
  emojiMessage: {
    backgroundColor: "transparent",
    padding: 0,
  },
  messageText: {
    marginTop:20,
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
  viewOnceImagePlaceholder: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  viewOnceVideoPlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  viewOnceText: {
    color: 'white',
    marginTop: 5,
    fontSize: 12,
  },
  noBackground: {
    backgroundColor: 'transparent', // Fondo transparente para imágenes
},
});

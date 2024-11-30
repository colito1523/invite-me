import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { database, ref } from "../../config/firebase";
import { Alert } from "react-native";
import { getDownloadURL, uploadBytes } from "firebase/storage";

export const setupChat = async ({chatId, setMessages}) => {
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

//   const markMessagesAsRead = async (messages) => {
//     const batch = writeBatch(database);
//     messages.forEach((message) => {
//       if (message.senderId !== user.uid && !message.viewedBy?.includes(user.uid)) {
//         const messageRef = doc(database, "chats", chatId, "messages", message.id);
//         batch.update(messageRef, {
//           viewedBy: [...(message.viewedBy || []), user.uid],
//         });
//       }
//     });
//     try {
//       await batch.commit();
//       console.log('Todos los mensajes visibles han sido marcados como leídos.');
//     } catch (error) {
//       console.error('Error al marcar los mensajes como leídos:', error);
//     }
//   };

export const handleReport = async ({recipient, setIsComplaintVisible}) => {
    try {
      console.log("Datos del usuario reportado al abrir el modal:", recipient);
      setIsComplaintVisible(true);
    } catch (error) {
      console.error("Error al abrir el modal de denuncia:", error);
    }
  };

export const handleReportSubmit = async ({reason, description, chatId, user, recipientUser, setIsComplaintVisible}) => {
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

export const handleCameraLaunch = async ({ImagePicker, handleSend}) => {
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

export const pickMedia = async ({ImagePicker, handleSend}) => {
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

export const handleHideChat = async ({chatId, setIsChatHidden, setMenuVisible}) => {
    try {
      await updateDoc(doc(database, "chats", chatId), { isHidden: true });
      setIsChatHidden(true);
      Alert.alert("Chat oculto", "Este chat ha sido ocultado.");
    } catch (error) {
      console.error("Error al ocultar el chat:", error);
    }

    setMenuVisible(false);
  };

export const handleUserPress = async ({chatId, user, navigation, recipientUser}) => {
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

export const handleMediaPress = async (
    mediaUrl,
    mediaType,
    messageId,
    isViewOnce,
    params
  ) => {
    const { chatId, user, setSelectedImage, setIsModalVisible } = params
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

export const handleLongPressMessage = ({message, user, setSelectedMessageId, setMessages}) => {
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
          onPress: () => handleDeleteMessage({messageId: message.id, setMessages, setSelectedMessageId}),
          style: "destructive",
        },
      ]);
    }
};

export const handleDeleteMessage = ({messageId, setMessages, setSelectedMessageId}) => {
    setMessages((prevMessages) =>
      prevMessages.filter((message) => message.id !== messageId)
    );
    setSelectedMessageId(null);
  };

export const handleDeleteChat = async ({chatId, user, navigation}) => {
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
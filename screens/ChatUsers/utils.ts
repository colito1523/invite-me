import { doc, updateDoc, getDoc, arrayUnion  } from "firebase/firestore";
import { database } from "../../config/firebase";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from 'expo-av';
import * as Haptics from "expo-haptics";



export const getLoggedInUserData = async (uid) => {
  try {
    const userRef = doc(database, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return null;
  }
};

export const handleDoubleTap = async ({ msg, database, chatId, user }) => {
  try {
    const messageRef = doc(database, "chats", chatId, "messages", msg.id);

    await updateDoc(messageRef, {
      likedBy: arrayUnion(user.uid)
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.error("Error al dar like:", error);
  }
};

export const configureAudioPlayback = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.warn("Error al configurar el modo de audio:", error);
  }
};

export const muteChat = async (
  userId: string,
  chatId: string,
  hours: number,
  setMutedChats: Function
) => {
  try {
    const userRef = doc(database, "users", userId);
    const userSnapshot = await getDoc(userRef);
    const muteUntil = new Date();
    muteUntil.setHours(muteUntil.getHours() + hours);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      const mutedChats = userData.mutedChats || [];

      // Buscar si ya existe el chatId
      const chatIndex = mutedChats.findIndex(
        (chat: any) => chat.chatId === chatId
      );

      if (chatIndex !== -1) {
        // Actualizar la entrada existente
        mutedChats[chatIndex].muteUntil = muteUntil;
      } else {
        // Agregar una nueva entrada si no existe
        mutedChats.push({ chatId, muteUntil });
      }

      // Actualizar en Firestore
      await updateDoc(userRef, {
        mutedChats,
      });

      setMutedChats(mutedChats);
    } else {
      console.error("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error al silenciar el chat:", error);
  }
};

export const handleMediaPress = async (
  database,
  chatId,
  user,
  mediaUrl,
  mediaType,
  messageId,
  isViewOnce,
  setSelectedImage,
  setIsModalVisible,
  t
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
      });
    }

    // Mostrar la imagen (o video) en el modal
    setSelectedImage(mediaUrl);
    setIsModalVisible(true);
  } catch (error) {
    console.error("Error al abrir la imagen:", error);
    Alert.alert(t("chatUsers.error"), t("chatUsers.openImageError"));
  }
};

export const handleDeleteMessage = async (database, chatId, user, messageId, recipientUser, setMessages) => {
  try {
    const messageRef = doc(database, "chats", chatId, "messages", messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      console.error("Mensaje no encontrado");
      return;
    }

    const messageData = messageDoc.data();

    // Get the chat document to retrieve participant IDs
    const chatRef = doc(database, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      console.error("Chat no encontrado");
      return;
    }

    const chatData = chatDoc.data();
    const participants = chatData.participants;

    if (!participants.includes(user.uid)) {
      console.error("Participantes no válidos");
      return;
    }

    const otherUserId = participants.find(participantId => participantId !== user.uid);

    if (messageData.senderId === user.uid) {
      // If it's our message, mark it as deleted for both users
      await updateDoc(messageRef, {
        deletedFor: {
          [user.uid]: true,
          [otherUserId]: true,
        },
      });
    } else {
      // If it's the other user's message, mark it as deleted only for us
      await updateDoc(messageRef, {
        [`deletedFor.${user.uid}`]: true,
      });
    }

    // Update local state
    setMessages((prevMessages) =>
      prevMessages.map((message) => {
        if (message.id === messageId) {
          return {
            ...message,
            deletedFor: {
              ...(message.deletedFor || {}),
              [user.uid]: true,
              ...(messageData.senderId === user.uid
                ? { [otherUserId]: true }
                : {}),
            },
          };
        }
        return message;
      })
    );
  } catch (error) {
    console.error("Error al eliminar el mensaje:", error);
    throw new Error("No se pudo eliminar el mensaje");
  }
};

export const pickMedia = async (handleSend, t) => {
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
    handleSend(mediaType, result.assets[0].uri);
  }
};
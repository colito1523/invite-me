import { collection, doc, getDoc, getDocs, onSnapshot, query, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { database } from "../../config/firebase";
import { Alert } from "react-native";


export const fetchChats = async (params) => {
    const user = params.user
    const setChats = params.setChats

    if (!user) return;
  
    try {
      const userRef = doc(database, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
      const blockedUsers = userSnapshot.data()?.blockedUsers || [];
  
      const chatsRef = collection(database, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid)
      );
  
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const chatList = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const chatData = docSnapshot.data();
  
            if (
              chatData.isHidden?.[user.uid] ||
              blockedUsers.some((blockedUid) =>
                chatData.participants.includes(blockedUid)
              )
            ) {
              return null;
            }
  
            const otherUserId = chatData.participants.find(
              (uid) => uid !== user.uid
            );
  
            const otherUserDoc = await getDoc(
              doc(database, "users", otherUserId)
            );
            if (!otherUserDoc.exists()) {
              return null;
            }
  
            const otherUserData = otherUserDoc.data();
  
            // Cálculo de mensajes no leídos
            const messagesRef = collection(
              database,
              "chats",
              docSnapshot.id,
              "messages"
            );
            const unseenMessagesQuery = query(
              messagesRef,
              where("seen", "==", false),
              where("senderId", "!=", user.uid)
            );
            const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);
  
            const unseenMessagesCount = unseenMessagesSnapshot.size;
  
            return {
              id: docSnapshot.id,
              user: otherUserData,
              unseenMessagesCount, // Agregar el conteo
              lastMessage: chatData.lastMessage || "", // Agregar el último mensaje
              lastMessageTimestamp: chatData.lastMessageTimestamp || null,
            };
          })
        );
  
        const sortedChats = chatList
        .filter((chat) => chat !== null)
        .sort((a, b) => {
          const dateA = a.lastMessageTimestamp
            ? a.lastMessageTimestamp.toDate().getTime()
            : 0;
          const dateB = b.lastMessageTimestamp
            ? b.lastMessageTimestamp.toDate().getTime()
            : 0;
          return dateB - dateA; // Orden descendente
        });
  
          setChats(sortedChats);
      });
  
      return () => unsubscribe();
    } catch (error) {
      console.error("Error al obtener los chats:", error);
    }
  };

export const handleDeleteChat = async ({chat, user, setChats}) => {
    try {
      const batch = writeBatch(database);
      const chatRef = doc(database, "chats", chat.id);
      const messagesRef = collection(database, "chats", chat.id, "messages");

      // Actualizar isHidden y deletedFor en el documento del chat
      batch.update(chatRef, {
        [`isHidden.${user.uid}`]: true,
        [`deletedFor.${user.uid}`]: true,
      });

      // Actualizar todos los mensajes como eliminados para el usuario actual
      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.forEach((messageDoc) => {
        batch.update(messageDoc.ref, {
          [`deletedFor.${user.uid}`]: true,
        });
      });

      // Confirmar los cambios en Firebase
      await batch.commit();

      // Actualizar el estado local para ocultar el chat
      setChats((prevChats) => prevChats.filter((c) => c.id !== chat.id));

      Alert.alert("Éxito", "El chat ha sido eliminado y ocultado para ti.");
    } catch (error) {
      console.error("Error al eliminar el chat:", error);
      Alert.alert(
        "Error",
        "No se pudo eliminar el chat. Por favor, intenta nuevamente."
      );
    }
};

const hideChat = async ({chat, password, setChats, setHiddenChats, chats, hiddenChats}) => {
if (password) {
    try {
    await updateDoc(doc(database, "chats", chat.id), {
        isHidden: true,
        password: password,
    });
    setChats(chats.filter((c) => c.id !== chat.id));
    setHiddenChats([...hiddenChats, { ...chat, isHidden: true, password }]);
    } catch (error) {
    console.error("Error al ocultar el chat:", error);
    Alert.alert("Error", "No se pudo ocultar el chat. Inténtalo de nuevo.");
    }
} else {
    Alert.alert("Error", "Debes ingresar una contraseña");
}
};

const handleHiddenChatPress = ({chat, setSelectedHiddenChat, setPasswordModalVisible}) => {
    setSelectedHiddenChat(chat);
    setPasswordModalVisible(true);
};

const handlePasswordSubmit = ({selectedHiddenChat, password, setChats, setHiddenChats, chats, hiddenChats, setPasswordModalVisible, setPassword, setSelectedHiddenChat}) => {
    if (selectedHiddenChat && password === selectedHiddenChat.password) {
      updateDoc(doc(database, "chats", selectedHiddenChat.id), {
        isHidden: false,
        password: "",
      });
      setChats([...chats, { ...selectedHiddenChat, isHidden: false }]);
      setHiddenChats(hiddenChats.filter((c) => c.id !== selectedHiddenChat.id));
      setPasswordModalVisible(false);
      setPassword("");
      setSelectedHiddenChat(null);
    } else {
      Alert.alert("Error", "Contraseña incorrecta");
    }
};

export const handleChatPress = async ({chat, user, navigation}) => {
    try {
      const messagesRef = collection(database, "chats", chat.id, "messages");
      const unseenMessagesQuery = query(
        messagesRef,
        where("seen", "==", false),
        where("senderId", "!=", user.uid)
      );
      const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);

      unseenMessagesSnapshot.forEach(async (messageDoc) => {
        await updateDoc(messageDoc.ref, { seen: true });
      });

      navigation.navigate("ChatUsers", {
        chatId: chat.id,
        recipientUser: chat.user,
      });
    } catch (error) {
      console.error("Error updating message seen status:", error);
    }
};


export const formatTime = (timestamp) => {
    if (!(timestamp instanceof Timestamp)) {
      console.error("Invalid timestamp:", timestamp);
      return "";
    }

    const now = new Date();
    const messageDate = timestamp.toDate();
    const diff = now.getTime() - messageDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);

    if (days === 0) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (days === 1) {
      return "Ayer";
    } else if (days < 7) {
      return `${days} días`;
    } else if (weeks === 1) {
      return "1 sem";
    } else {
      return `${weeks} sem`;
    }
};

export const truncateMessage = (message, maxLength = 10) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
};

export const handleSelectAll = ({setSelectAll, selectAll, setSelectedChats, chats}) => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedChats(chats.map((chat) => chat.id));
    } else {
      setSelectedChats([]);
    }
};

export const handleDeleteSelectedChats = async ({selectedChats, user, setChats, setSelectedChats, setIsSelectionMode}) => {
    try {
      const batch = writeBatch(database);

      for (const chatId of selectedChats) {
        const chatRef = doc(database, "chats", chatId);
        const messagesRef = collection(database, "chats", chatId, "messages");

        batch.update(chatRef, {
          [`deletedFor.${user.uid}`]: true,
          [`isHidden.${user.uid}`]: true,
        });

        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.forEach((messageDoc) => {
          batch.update(messageDoc.ref, { [`deletedFor.${user.uid}`]: true });
        });
      }

      await batch.commit();

      setChats((prevChats) =>
        prevChats.filter((chat) => !selectedChats.includes(chat.id))
      );
      setSelectedChats([]);
      setIsSelectionMode(false);

      Alert.alert("Éxito", "Los chats seleccionados han sido eliminados.");
    } catch (error) {
      console.error("Error al eliminar los chats seleccionados:", error);
      Alert.alert(
        "Error",
        "No se pudieron eliminar los chats seleccionados. Intenta de nuevo."
      );
    }
};

export const handleMuteSelectedChats = ({hours, selectedChats, setSelectedChats, setIsSelectionMode, setShowMuteOptions}) => {
    selectedChats.forEach((chatId) => {
      const chatRef = doc(database, "chats", chatId);
      const muteUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
      updateDoc(chatRef, { mutedUntil: muteUntil });
    });
    setSelectedChats([]);
    setIsSelectionMode(false);
    setShowMuteOptions(false);
};

export const toggleChatSelection = ({chatId, setSelectedChats}) => {
    setSelectedChats((prevSelected) =>
      prevSelected.includes(chatId)
        ? prevSelected.filter((id) => id !== chatId)
        : [...prevSelected, chatId]
    );
};


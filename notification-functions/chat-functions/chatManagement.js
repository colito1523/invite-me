import { collection, addDoc, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { database } from "../config/firebase";

export const createChatIfNotExists = async (user, recipientUser, chatId, setChatId) => {
  if (!chatId) {
    const chatRef = doc(collection(database, "chats"));
    const newChatId = chatRef.id;

    if (!user || !recipientUser || !newChatId) {
      console.error("Error: Datos del chat o los usuarios son indefinidos.");
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

export const handleSend = async (params) => {
  const { user, chatIdToUse, messageType, mediaUri, setMessage, flatListRef, uploadMedia } = params;
  try {
    const messagesRef = collection(database, "chats", chatIdToUse, "messages");

    let messageData = {
      senderId: user.uid,
      senderName: user.displayName || "Anónimo",
      createdAt: new Date(),
      seen: false,
      viewedBy: [],
    };

    if (messageType === "text") {
      messageData.text = params.message.trim();
    } else if (["image", "video"].includes(messageType)) {
      const mediaUrl = await uploadMedia(mediaUri);
      messageData.mediaType = messageType;
      messageData.mediaUrl = mediaUrl;
    }

    await addDoc(messagesRef, messageData);
    setMessage("");
    flatListRef.current?.scrollToEnd({ animated: true });
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
  }
};

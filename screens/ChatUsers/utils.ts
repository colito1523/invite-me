import { doc, updateDoc, getDoc,  } from "firebase/firestore";
import { database } from "../../config/firebase";

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
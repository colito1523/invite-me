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

    if (messageData.senderId === user.uid) {
      // Si es nuestro mensaje, marcarlo como eliminado para ambos usuarios
      await updateDoc(messageRef, {
        deletedFor: {
          [user.uid]: true,
          [recipientUser.id]: true,
        },
      });
    } else {
      // Si es mensaje del otro usuario, marcarlo como eliminado solo para nosotros
      await updateDoc(messageRef, {
        [`deletedFor.${user.uid}`]: true,
      });
    }

    // Actualizar el estado local
    setMessages((prevMessages) =>
      prevMessages.map((message) => {
        if (message.id === messageId) {
          return {
            ...message,
            deletedFor: {
              ...(message.deletedFor || {}),
              [user.uid]: true,
              ...(messageData.senderId === user.uid
                ? { [recipientUser.id]: true }
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
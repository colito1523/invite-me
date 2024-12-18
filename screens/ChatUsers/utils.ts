import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
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

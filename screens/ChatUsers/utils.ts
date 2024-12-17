import { doc, updateDoc, getDoc } from "firebase/firestore";
import { Alert } from "react-native";
import { database } from "../../config/firebase";

export const muteChat = async (userId, chatId, hours, setMutedChats) => {
  const muteUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

  try {
    const userRef = doc(database, "users", userId);
    const userSnapshot = await getDoc(userRef);
    const mutedChats = userSnapshot.data()?.mutedChats || [];

    const updatedMutedChats = [
      ...mutedChats,
      { chatId: chatId, muteUntil },
    ];

    await updateDoc(userRef, { mutedChats: updatedMutedChats });
    setMutedChats(updatedMutedChats);
    Alert.alert("Éxito", "El chat ha sido silenciado.");
  } catch (error) {
    console.error("Error al silenciar el chat:", error);
    Alert.alert("Error", "No se pudo silenciar el chat.");
  }
};
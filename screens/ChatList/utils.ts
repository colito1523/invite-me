import { Timestamp } from "firebase/firestore";
import { Alert } from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { database } from "../../config/firebase";

export const formatTime = (timestamp: Timestamp): string => {
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

export const truncateMessage = (message: string, maxLength: number = 10): string => {
  if (message === 'media') return 'Foto';
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + "...";
};

export const areChatsDifferent = (oldChats: any[], newChats: any[]): boolean => {
  return JSON.stringify(oldChats) !== JSON.stringify(newChats);
};

export const checkNightMode = (): boolean => {
  const currentHour = new Date().getHours();
  return currentHour >= 19 || currentHour < 6;
};

export const handleDeleteChat = async (chat: any, userId: string, t: any) => {
  try {
    const batch = writeBatch(database);
    const chatRef = doc(database, "chats", chat.id);
    const messagesRef = collection(database, "chats", chat.id, "messages");

    batch.update(chatRef, {
      [`isHidden.${userId}`]: true,
      [`deletedFor.${userId}`]: true,
    });

    const messagesSnapshot = await getDocs(messagesRef);
    messagesSnapshot.forEach((messageDoc) => {
      batch.update(messageDoc.ref, {
        [`deletedFor.${userId}`]: true,
        seen: true
      });
    });

    await batch.commit();
    Alert.alert(t("indexChatList.success"), t("indexChatList.chatsDeleted"));
    return true;
  } catch (error) {
    console.error("Error deleting chat:", error);
    Alert.alert(t("indexChatList.error"), t("indexChatList.chatDeleteError"));
    return false;
  }
};

export const handleMuteSelectedChats = async (
  selectedChats: string[],
  selectedMuteHours: number | null,
  mutedChats: any[],
  userId: string,
  t: any
) => {
  if (!selectedMuteHours) {
    Alert.alert(t("indexChatList.error"), t("indexChatList.muteDurationError"));
    return null;
  }

  const muteUntil = new Date(Date.now() + selectedMuteHours * 60 * 60 * 1000);
  try {
    let updatedMutedChats = [...mutedChats];
    
    selectedChats.forEach((chatId) => {
      updatedMutedChats = updatedMutedChats.filter(mute => mute.chatId !== chatId);
      updatedMutedChats.push({ chatId, muteUntil });
    });

    const userRef = doc(database, "users", userId);
    await updateDoc(userRef, { mutedChats: updatedMutedChats });

    return updatedMutedChats;
  } catch (error) {
    console.error("Error muting chats:", error);
    Alert.alert(t("indexChatList.error"), t("indexChatList.muteError"));
    return null;
  }
};

export const handleUnmuteChat = async (chatId: string, mutedChats: any[], userId: string, t: any) => {
  try {
    const updatedMutedChats = mutedChats.filter(
      (mute) => mute.chatId !== chatId
    );

    const userRef = doc(database, "users", userId);
    await updateDoc(userRef, { mutedChats: updatedMutedChats });

    Alert.alert(t("indexChatList.success"), t("indexChatList.unmuteSuccess"));
    return updatedMutedChats;
  } catch (error) {
    console.error("Error unmuting chat:", error);
    Alert.alert(t("indexChatList.error"), t("indexChatList.unmuteError"));
    return null;
  }
};

export const handleChatPress = async (chat: any, userId: string) => {
  try {
    const messagesRef = collection(database, "chats", chat.id, "messages");
    const unseenMessagesQuery = query(
      messagesRef,
      where("seen", "==", false),
      where("senderId", "!=", userId)
    );
    const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);

    unseenMessagesSnapshot.forEach(async (messageDoc) => {
      await updateDoc(messageDoc.ref, { seen: true });
    });

    return true;
  } catch (error) {
    console.error("Error updating message seen status:", error);
    return false;
  }
};

export const checkStories = async (chats: any[], userId: string) => {
  try {
    const updatedChats = [];

    for (const chat of chats) {
      const userRef = doc(database, "users", chat.user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      if (!userData) continue;

      const currentUserRef = doc(database, "users", userId);
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data();

      const isHidden = currentUserData?.hideStoriesFrom?.includes(chat.user.uid) || false;

      const friendsRef = collection(database, "users", userId, "friends");
      const friendQuery = query(friendsRef, where("friendId", "==", chat.user.uid));
      const friendSnapshot = await getDocs(friendQuery);
      const isFriend = !friendSnapshot.empty;

      const isPrivate = userData?.isPrivate || false;

      const storiesRef = collection(userRef, "stories");
      const storiesSnapshot = await getDocs(storiesRef);
      const now = new Date();

      const userStories =
        isPrivate && !isFriend
          ? []
          : isHidden
          ? []
          : storiesSnapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt instanceof Timestamp
                  ? doc.data().createdAt.toDate()
                  : new Date(0),
                expiresAt: doc.data().expiresAt instanceof Timestamp
                  ? doc.data().expiresAt.toDate()
                  : new Date(),
              }))
              .filter((story) => story.expiresAt > now);

      updatedChats.push({
        ...chat,
        user: {
          ...chat.user,
          hasStories: userStories.length > 0,
          userStories,
        },
      });
    }

    return updatedChats;
  } catch (error) {
    console.error("Error checking stories:", error);
    return null;
  }
};

export const handleDeleteSelectedChats = async (selectedChats: string[], userId: string, t: any) => {
  try {
    const batch = writeBatch(database);

    for (const chatId of selectedChats) {
      const chatRef = doc(database, "chats", chatId);
      const messagesRef = collection(database, "chats", chatId, "messages");

      batch.update(chatRef, {
        [`deletedFor.${userId}`]: true,
        [`isHidden.${userId}`]: true,
      });

      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.forEach((messageDoc) => {
        batch.update(messageDoc.ref, { [`deletedFor.${userId}`]: true });
      });
    }

    await batch.commit();
    Alert.alert(t("indexChatList.success"), t("indexChatList.chatsDeleted"));
    return true;
  } catch (error) {
    console.error("Error deleting selected chats:", error);
    Alert.alert(t("indexChatList.error"), t("indexChatList.chatsDontDeleted"));
    return false;
  }
};

export const handleChatPressLocal = async ({
  chat,
  setChats,
  navigation,
  handleChatPress,
  userId,
}) => {
  try {
    // Actualizar estado local
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === chat.id ? { ...c, unseenMessagesCount: 0 } : c
      )
    );

    // Navegar al chat
    navigation.navigate("ChatUsers", {
      currentChatId: chat.id,
      recipientUser: chat.user,
    });

    // Actualizar en backend
    await handleChatPress(chat, userId);
  } catch (error) {
    console.error("Error al procesar el chat:", error);
    Alert.alert("Error", "No se pudo abrir el chat.");
  }
};
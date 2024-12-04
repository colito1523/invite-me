import { collection, doc, getDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { auth, database } from "../../config/firebase";

export const fetchUnreadNotifications = async ({ setUnreadNotifications }) => {
  if (auth.currentUser) {
    const user = auth.currentUser;
    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const q = query(notificationsRef, where("seen", "==", false));
    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
    const friendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));

    const unsubscribeNotifications = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setUnreadNotifications(true);
      } else {
        setUnreadNotifications(false);
      }
    });

    const unsubscribeFriendRequests = onSnapshot(friendRequestsQuery, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setUnreadNotifications(true);
      } else {
        setUnreadNotifications(false);
      }
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeFriendRequests();
    };
  }
  return () => {}; // Return a no-op function if auth.currentUser is not set
};

export const fetchData = async ({setLoading, fetchBoxData, fetchPrivateEvents }) => {
    try {
      setLoading(true);
      await Promise.all([fetchBoxData(), fetchPrivateEvents()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
};

export const fetchProfileImage = async ({setProfileImage}) => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(database, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.photoUrls && data.photoUrls.length > 0) {
          setProfileImage(data.photoUrls[0]);
        }
      }
    }
};

// Verifica mensajes no leídos en chats no silenciados
export const fetchUnreadMessages = async ({ setUnreadMessages }) => {
  if (!auth.currentUser) return;

  const user = auth.currentUser;
  const userDocRef = doc(database, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    console.error("El documento del usuario no existe.");
    setUnreadMessages(false);
    return;
  }

  const userData = userDoc.data();
  const mutedChats = userData.mutedChats || [];

  const chatsRef = collection(database, "chats");
  const q = query(chatsRef, where("participants", "array-contains", user.uid));

  const unsubscribe = onSnapshot(q, async (querySnapshot) => {
    let hasUnreadMessages = false;

    for (const chatDoc of querySnapshot.docs) {
      const chatId = chatDoc.id;

      // Verificar si el chat está silenciado
      const isMuted = mutedChats.some((mutedChat) => mutedChat.chatId === chatId);
      if (isMuted) continue; // Ignorar chats silenciados

      // Consultar mensajes no leídos en el chat
      const messagesRef = collection(database, "chats", chatId, "messages");
      const unseenMessagesQuery = query(
        messagesRef,
        where("seen", "==", false),
        where("senderId", "!=", user.uid)
      );

      const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);

      if (!unseenMessagesSnapshot.empty) {
        hasUnreadMessages = true;
        break; // Salir del bucle si se encuentra un mensaje no leído
      }
    }

    setUnreadMessages(hasUnreadMessages);
  });

  return () => unsubscribe();
};

// Verifica si hay notificaciones o solicitudes de amistad no vistas
export const checkNotificationsSeenStatus = async (setNotificationIconState) => {
  if (auth.currentUser) {
    const user = auth.currentUser;
    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const q = query(notificationsRef, where("seen", "==", false));

    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
    const friendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));

    const notificationsSnapshot = await getDocs(q);
    const friendRequestsSnapshot = await getDocs(friendRequestsQuery);

    if (!notificationsSnapshot.empty || !friendRequestsSnapshot.empty) {
      setNotificationIconState(true);
    } else {
      setNotificationIconState(false);
    }
  }
};

// Escucha cambios en notificaciones y solicitudes de amistad no vistas
export const listenForNotificationChanges = (setNotificationIconState) => {
  if (auth.currentUser) {
    const user = auth.currentUser;
    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const q = query(notificationsRef, where("seen", "==", false));

    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
    const friendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));

    const unsubscribeNotifications = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setNotificationIconState(true);
      } else {
        setNotificationIconState(false);
      }
    });

    const unsubscribeFriendRequests = onSnapshot(friendRequestsQuery, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setNotificationIconState(true);
      } else {
        setNotificationIconState(false);
      }
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeFriendRequests();
    };
  }
};
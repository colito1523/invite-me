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

export const fetchUnreadMessages = async ({setUnreadMessages}) => {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    const chatsRef = collection(database, "chats");
    const q = query(chatsRef, where("participants", "array-contains", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let hasUnreadMessages = false;
      querySnapshot.forEach((docSnapshot) => {
        const chatData = docSnapshot.data();
        const messagesRef = collection(database, "chats", docSnapshot.id, "messages");
        const unseenMessagesQuery = query(
          messagesRef,
          where("seen", "==", false),
          where("senderId", "!=", user.uid)
        );
        onSnapshot(unseenMessagesQuery, (unseenMessagesSnapshot) => {
          if (!unseenMessagesSnapshot.empty) {
            hasUnreadMessages = true;
            setUnreadMessages(true);
          } else {
            setUnreadMessages(false);
          }
        });
      });
    });
    return () => unsubscribe();
};

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
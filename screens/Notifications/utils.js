import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";



export const markNotificationsAsSeen = async (params) => {
  const user = params.user
  const database = params.database
  const x = params.notifications
  const setNotifications = params.setNotifications

  
  // if (user) {
  //   const notificationsRef = collection(database, "users", user.uid, "notifications");
  //   const unseenQuery = query(notificationsRef, where("seen", "==", false));
  //   const snapshot = await getDocs(unseenQuery);

  //   const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
  //   const unseenFriendRequestsQuery = query(friendRequestsRef, where("seen", "==", false));
  //   const friendRequestsSnapshot = await getDocs(unseenFriendRequestsQuery);


  //   if (!snapshot.empty || !friendRequestsSnapshot.empty) {
  //     const batch = writeBatch(database);
  //     const updatedNotifications = [...notifications];

  //     snapshot.forEach((doc) => {
  //       batch.update(doc.ref, { seen: true });

  //       const index = updatedNotifications.findIndex((n) => n.id === doc.id);
  //       if (index !== -1) {
  //         updatedNotifications[index] = {
  //           ...updatedNotifications[index],
  //           seen: true,
  //         };
  //       }
  //     });

  //     friendRequestsSnapshot.forEach((doc) => {
  //       batch.update(doc.ref, { seen: true });
  //       const index = updatedNotifications.findIndex((n) => n.id === doc.id);
  //       if (index !== -1) {
  //         updatedNotifications[index] = {
  //           ...updatedNotifications[index],
  //           seen: true,
  //         };
  //       }
  //     });

  //     await batch.commit();

  //     setNotifications(updatedNotifications);
  //   }
  // }
};
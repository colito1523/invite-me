import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Image } from 'expo-image';
import { database, auth } from "../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
  setDoc,
  arrayUnion, 
} from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { format, isToday, isYesterday } from "date-fns";
import { Ionicons} from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

export default function NotificationsComponent() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: isNightMode ? "#1a1a1a" : "#fff",
        },
        headerTintColor: isNightMode ? "#fff" : "#000",
        headerTitleStyle: {
          color: isNightMode ? "#fff" : "#000",
          fontSize: 19,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginLeft: 15 }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={isNightMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        ),
      });
    }, [isNightMode, navigation])
  );

  const fetchNotifications = useCallback(async () => {
    if (user) {
      const userRef = doc(database, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const hiddenNotifications = userDoc.data()?.hiddenNotifications || [];
  
      const notificationsRef = collection(database, "users", user.uid, "notifications");
      const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
  
      const notificationsQuery = query(notificationsRef);
      const friendRequestsQuery = query(friendRequestsRef, where("status", "==", "pending"));
  
      const unsubscribeNotifications = onSnapshot(notificationsQuery, (querySnapshot) => {
        const notifList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: doc.data().type || "notification",
          }))
          .filter((notif) => !hiddenNotifications.includes(notif.id)); // Filtrar las ocultas
        updateNotifications(notifList);
      });
  
      const unsubscribeFriendRequests = onSnapshot(friendRequestsQuery, (querySnapshot) => {
        const requestList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: "friendRequest",
          }))
          .filter((notif) => !hiddenNotifications.includes(notif.id)); // Filtrar las ocultas
        updateNotifications(requestList);
      });
  
      setIsLoading(false);
  
      // Encapsula las funciones de limpieza en una sola función que se retorne correctamente
      return () => {
        unsubscribeNotifications();
        unsubscribeFriendRequests();
      };
    }
  }, [user]);
  
  

  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que deseas ocultar esta notificación?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Ocultar",
          style: "destructive",
          onPress: async () => {
            try {
              const userRef = doc(database, "users", auth.currentUser.uid);
              await updateDoc(userRef, {
                hiddenNotifications: arrayUnion(notificationId),
              });
              setNotifications((prevNotifications) =>
                prevNotifications.filter((notif) => notif.id !== notificationId)
              );
              Alert.alert("Notificación oculta", "La notificación ha sido oculta.");
            } catch (error) {
              console.error("Error al ocultar la notificación:", error);
              Alert.alert("Error", "No se pudo ocultar la notificación. Inténtalo de nuevo.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  

  useEffect(() => {
    const unsubscribe = fetchNotifications();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [fetchNotifications]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const updateNotifications = (newNotifications) => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = [...prevNotifications];
      newNotifications.forEach((newNotif) => {
        const index = updatedNotifications.findIndex(
          (n) => n.id === newNotif.id
        );
        if (index !== -1) {
          updatedNotifications[index] = {
            ...updatedNotifications[index],
            ...newNotif,
          };
        } else {
          updatedNotifications.push(newNotif);
        }
      });
      return updatedNotifications.sort((a, b) => b.timestamp - a.timestamp);
    });
  };

  const handleUserPress = async (uid) => {
    try {
      const userDoc = await getDoc(doc(database, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userData.id = uid;
        userData.profileImage =
          userData.photoUrls && userData.photoUrls.length > 0
            ? userData.photoUrls[0]
            : "https://via.placeholder.com/150";
        navigation.navigate("UserProfile", { selectedUser: userData });
      } else {
        Alert.alert(t('notifications.error'), t('notifications.userDetailsNotFound'));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert(
        t('notifications.error'),
        t('notifications.userDetailsFetchError')
      );
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      const user = auth.currentUser;
      const userFriendsRef = collection(database, "users", user.uid, "friends");
      const senderFriendsRef = collection(
        database,
        "users",
        request.fromId,
        "friends"
      );

      const friendImage =
        request.fromImage || "https://via.placeholder.com/150";

      // Add friend to the current user's friends collection
      await addDoc(userFriendsRef, {
        friendId: request.fromId,
        friendName: request.fromName,
        friendImage: friendImage,
      });

      const userDoc = await getDoc(doc(database, "users", user.uid));
      const userData = userDoc.data();
      const profileImage =
        userData.photoUrls && userData.photoUrls.length > 0
          ? userData.photoUrls[0]
          : "https://via.placeholder.com/150";

      // Add current user to the sender's friends collection
      await addDoc(senderFriendsRef, {
        friendId: user.uid,
        friendName: userData.firstName,
        friendImage: profileImage,
      });

      const requestRef = doc(
        database,
        "users",
        user.uid,
        "friendRequests",
        request.id
      );
      await updateDoc(requestRef, { status: "accepted" });

      const senderNotificationsRef = collection(
        database,
        "users",
        request.fromId,
        "notifications"
      );

      await addDoc(senderNotificationsRef, {
        type: "friendRequestResponse",
        response: "accepted",
        fromId: user.uid,
        fromName: userData.firstName,
        fromImage: profileImage,
        message: t('notifications.friendRequestAccepted', { name: userData.firstName }),
        timestamp: new Date(),
      });

      const userNotificationsRef = doc(
        database,
        "users",
        user.uid,
        "notifications",
        request.id
      );
      await setDoc(userNotificationsRef, {
        type: "friendRequestResponse",
        response: "accepted",
        fromId: request.fromId,
        fromName: request.fromName,
        fromImage: request.fromImage,
        message: t('notifications.youAreNowFriends', { name: request.fromName }),
        timestamp: new Date(),
      });

      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === request.id
            ? {
                ...notif,
                status: "accepted",
                type: "friendRequestResponse",
                response: "accepted",
              }
            : notif
        )
      );

      setTimeout(() => {
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notif) => notif.id !== request.id)
        );
      }, 5000);
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert(t('notifications.error'), t('notifications.acceptRequestError'));
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      const user = auth.currentUser;
      const requestRef = doc(
        database,
        "users",
        user.uid,
        "friendRequests",
        request.id
      );
      await deleteDoc(requestRef);

      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === request.id
            ? {
                ...notif,
                status: "rejected",
                type: "friendRequestResponse",
                response: "rejected",
              }
            : notif
        )
      );

      setTimeout(() => {
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notif) => notif.id !== request.id)
        );
      }, 5000);
    } catch (error) {
      console.error("Error rejecting request:", error);
      Alert.alert(t('notifications.error'), t('notifications.rejectRequestError'));
    }
  };

  const handleAcceptEventInvitation = async (notif) => {
    if (!notif.eventId) {
      console.error("Error: eventId is undefined");
      Alert.alert(t('notifications.error'), t('notifications.invalidEventId'));
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(t('notifications.error'), t('notifications.userAuthError'));
      return;
    }

    const notifRef = doc(database, "users", user.uid, "notifications", notif.id);
    const eventsRef = collection(database, "users", user.uid, "events");
    const eventRef = doc(database, "EventsPriv", notif.eventId);
  
    try {
      // 1. Get event data from `EventsPriv`
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) {
        console.error("Event not found in EventsPriv");
        Alert.alert(t('notifications.error'), t('notifications.eventNotFound'));
        return;
      }
  
      const eventData = eventDoc.data();
  
      // 2. Add the event to the user's `events` collection
      await addDoc(eventsRef, {
        title: eventData.title,
        imageUrl: eventData.image,
        date: eventData.date,
        status: "accepted",
        isPrivate: true,
        eventId: notif.eventId,
        category: eventData.category,
      });
  
      // 3. Get updated user data
      const userDoc = await getDoc(doc(database, "users", user.uid));
      const userData = userDoc.data();
      
      // 4. Add the user to the `attendees` list in `EventsPriv`
      await updateDoc(eventRef, {
        attendees: arrayUnion({
          uid: user.uid,
          username: userData.username || user.displayName,
          profileImage: userData.photoUrls && userData.photoUrls.length > 0 
            ? userData.photoUrls[0] 
            : "https://via.placeholder.com/150",
        }),
      });
  
      // 5. Update the notification status
      await updateDoc(notifRef, {
        status: "accepted",
        message: t('notifications.acceptedInvitation', { name: notif.fromName }),
      });
  
      // Update local notification state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notif.id
            ? { ...n, status: "accepted", message: t('notifications.acceptedInvitation', { name: notif.fromName }) }
            : n
        )
      );
  
      Alert.alert(t('notifications.invitationAccepted'), t('notifications.eventAddedToProfile'));
    } catch (error) {
      console.error("Error accepting invitation:", error);
      Alert.alert(t('notifications.error'), t('notifications.acceptInvitationError'));
    }
  };
  
  const handleRejectEventInvitation = async (notif) => {
    const notifRef = doc(
      database,
      "users",
      user.uid,
      "notifications",
      notif.id
    );

    try {
      await updateDoc(notifRef, { status: "rejected" });

      // Remove the notification directly, without a delay
      setNotifications((prevNotifications) =>
        prevNotifications.filter((n) => n.id !== notif.id)
      );

      Alert.alert(
        t('notifications.invitationRejected'),
        t('notifications.eventInvitationRejected')
      );
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      Alert.alert(
        t('notifications.error'),
        t('notifications.rejectInvitationError')
      );
    }
  };

  const renderNotificationItem = ({ item }) => {
    const isFriendRequest =
      item.type === "friendRequest" &&
      item.status !== "accepted" &&
      item.status !== "rejected";
    const isEventInvitation =
      item.type === "invitation" &&
      item.status !== "accepted" &&
      item.status !== "rejected";
    const isFriendRequestResponse = item.type === "friendRequestResponse";
    const isLikeNotification = item.type === "like";
    const isNoteLikeNotification = item.type === "noteLike";
  
    const timestamp = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
  
    let formattedTime = "";
  
    if (timestamp) {
      if (isToday(timestamp)) {
        formattedTime = format(timestamp, "HH:mm");
      } else if (isYesterday(timestamp)) {
        formattedTime = t('notifications.yesterday');
      } else {
        formattedTime = format(timestamp, "dd/MM/yyyy");
      }
    }
  
    const handleNotificationPress = () => {
      if (isEventInvitation) {
        if (item.eventCategory === "EventoParaAmigos" || item.isPrivate) {
          navigation.navigate("BoxDetails", {
            box: {
              title: item.eventTitle,
              imageUrl: item.eventImage,
              date: item.eventDate,
              location: item.eventLocation || t('notifications.noLocation'),
              coordinates: item.coordinates || { latitude: 0, longitude: 0 },
              hours: item.hours || {},
              number: item.phoneNumber || t('notifications.noNumber'),
              isPrivate: item.isPrivate || false,
            },
            selectedDate: item.eventDate,
          });
        } else {
          if (!item.coordinates || !item.coordinates.latitude || !item.coordinates.longitude) {
            Alert.alert(t('notifications.error'), t('notifications.coordinatesNotAvailable'));
            return;
          }
  
          navigation.navigate("BoxDetails", {
            box: {
              title: item.eventTitle,
              imageUrl: item.eventImage,
              date: item.eventDate,
              location: item.eventLocation || t('notifications.noLocation'),
              coordinates: item.coordinates || { latitude: 0, longitude: 0 },
              hours: item.hours || {},
              number: item.phoneNumber || t('notifications.noNumber'),
              isPrivate: item.isPrivate || false,
            },
            selectedDate: item.eventDate,
          });
        }
      } else {
        handleUserPress(item.fromId);
      }
    };
  
    return (
      item.status !== "rejected" && (
        <TouchableOpacity onPress={handleNotificationPress} onLongPress={() => handleDeleteNotification(item.id)} >
          <View style={[styles.notificationContainer, { borderColor: isNightMode ? '#444' : '#ccc' }]}>
            {item.status !== "rejected" && (
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: isNightMode ? '#888' : '#666' }]}>{formattedTime}</Text>
              </View>
            )}
            <View style={styles.notificationContent}>
              <Image
                source={{
                  uri: item.fromImage && item.fromImage.length > 0
                    ? item.fromImage
                    : "https://via.placeholder.com/150",
                }}
                cachePolicy="memory-disk"
                style={styles.profileImage}
              />
              <View style={styles.textContainer}>
                <Text style={[styles.notificationText, { color: isNightMode ? '#fff' : '#333' }]}>
                  {item.type === "invitation" && item.status === "accepted"
                    ? t('notifications.acceptedInvitation', { name: item.fromName })
                    : (
                      <>
                        <Text style={[styles.boldText, { color: isNightMode ? '#fff' : '#000' }]}>
                          {item.fromName} {item.fromLastName || ''}
                        </Text>{' '}
                        {isFriendRequest && t('notifications.wantsToBeFriend')}
                        {isEventInvitation && t('notifications.invitedToEvent', { eventTitle: item.eventTitle })}
                        {isFriendRequestResponse &&
                          (item.response === 'accepted'
                            ? t('notifications.nowFriends')
                            : t('notifications.rejectedFriendRequest'))}
                        {isLikeNotification && item.message} {/* Mostrar el mensaje de like */}
                        {item.type === 'storyLike' && t('notifications.likedYourStory')}
                        {isNoteLikeNotification && item.message}
                      </>
                    )}
                </Text>
                {(isFriendRequest || isEventInvitation) && (
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      onPress={() =>
                        isFriendRequest
                          ? handleAcceptRequest(item)
                          : handleAcceptEventInvitation(item)
                      }
                      style={[styles.acceptButton, { backgroundColor: isNightMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(128, 128, 128, 0.3)' }]}
                    >
                      <Text style={[styles.buttonText, { color: isNightMode ? '#fff' : '#000' }]}>{t('notifications.accept')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        isFriendRequest
                          ? handleRejectRequest(item)
                          : handleRejectEventInvitation(item)
                      }
                      style={[styles.rejectButton, { backgroundColor: isNightMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(128, 128, 128, 0.3)' }]}
                    >
                      <Text style={[styles.buttonText, { color: isNightMode ? '#fff' : '#000' }]}>{t('notifications.reject')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )
    );
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size={50} color="black" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={isNightMode ? ['#1a1a1a', '#000'] : ['#fff', '#f0f0f0']}
        style={styles.container}
      >
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["black"]}
              tintColor="black"
            />
          }
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  notificationContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderBottomWidth: 2,
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 10,
  },
  acceptButton: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  rejectButton: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  buttonText: {
    fontWeight: "bold",
    textAlign: "center",
  },
});
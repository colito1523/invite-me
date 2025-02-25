import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { database, auth } from "../../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  orderBy,
  limit,
  startAfter,
  getDocs
} from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { format, isToday, isYesterday } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import boxInfo from "../../src/data/boxInfo";
import {
  markNotificationsAsSeen,
  handleDeleteNotification,
  updateNotifications,
  handleUserPress,
  handleAcceptRequest,
  handleRejectRequest,
  handleAcceptEventInvitation,
  handleRejectEventInvitation,
  handleAcceptPrivateEvent,
  handleRejectPrivateEvent,
  handleAcceptGeneralEvent,
  handleRejectGeneralEvent,
} from "./utils";
import { styles } from "./styles";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added import for AsyncStorage


const NOTIFICATION_CACHE_KEY = '@notifications:key';

const loadNotificationsFromCache = async () => {
  try {
    const cachedData = await AsyncStorage.getItem(NOTIFICATION_CACHE_KEY);
    if (cachedData !== null) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error("Error loading notifications from cache:", error);
    return null;
  }
};


const saveNotificationsToCache = async (notifications) => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error("Error saving notifications to cache:", error);
  }
};


export default function NotificationsComponent() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingEventId, setLoadingEventId] = useState(null);
  const [notificationList, setNotificationList] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [lastNotificationDoc, setLastNotificationDoc] = useState(null);
  const [fetchingMore, setFetchingMore] = useState(false);
  const user = auth.currentUser;


  const loadInitialNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Cargar desde caché primero
      const cachedNotifications = await loadNotificationsFromCache();
      if (cachedNotifications) {
        setNotificationList(cachedNotifications);
        setIsLoading(false);
      }

      const userDocSnap = await getDoc(doc(database, "users", user.uid));
      const hidden = userDocSnap.data()?.hiddenNotifications || [];
      const blocked = userDocSnap.data()?.blockedUsers || [];
      const notificationsRef = collection(database, "users", user.uid, "notifications");
      
      // Consulta sin filtro de tipo para obtener todas las notificaciones
      const q = query(
        notificationsRef,
        orderBy("timestamp", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const notifs = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            type: data.type || "notification",
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp
          };
        })
        .filter(n => !hidden.includes(n.id) && !blocked.includes(n.fromId));

      setNotificationList(notifs);
      await saveNotificationsToCache(notifs);

      if (snapshot.docs.length > 0) {
        setLastNotificationDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastNotificationDoc(null);
      }
    } catch (error) {
      console.log("Error loading initial notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const subscribeFriendRequests = useCallback(() => {
    if (!user) return () => {};
    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");
    const friendRequestsQuery = query(friendRequestsRef, where("status", "==", "pending"));
    const unsubscribe = onSnapshot(friendRequestsQuery, async (snapshot) => {
      try {
        const userDoc = await getDoc(doc(database, "users", user.uid));
        const hidden = userDoc.data()?.hiddenNotifications || [];
        const blocked = userDoc.data()?.blockedUsers || [];
        const reqs = snapshot.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data(), type: "friendRequest" }))
          .filter(item => !hidden.includes(item.id) && !blocked.includes(item.fromId));
        setFriendRequests(reqs);
      } catch (err) {
        console.log("Error in friendRequests subscription:", err);
      }
    });
    return unsubscribe;
  }, [user]);

  const combinedNotifications = [...notificationList, ...friendRequests].sort((a, b) => {
    const at = a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp;
    const bt = b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp;
    return bt - at;
  });

  const loadMoreNotifications = useCallback(async () => {
    if (!lastNotificationDoc || fetchingMore || !user) return;
    setFetchingMore(true);
    try {
      const userDocSnap = await getDoc(doc(database, "users", user.uid));
      const hidden = userDocSnap.data()?.hiddenNotifications || [];
      const blocked = userDocSnap.data()?.blockedUsers || [];
      const notificationsRef = collection(database, "users", user.uid, "notifications");
      const q = query(
        notificationsRef,
        orderBy("timestamp", "desc"),
        startAfter(lastNotificationDoc),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const moreNotifs = snapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          type: docSnap.data().type || "notification"
        }))
        .filter(n => !hidden.includes(n.id) && !blocked.includes(n.fromId));
      setNotificationList(prev => {
        const merged = [...prev, ...moreNotifs];
        const unique = {};
        merged.forEach(item => { unique[item.id] = item; });
        return Object.values(unique).sort((a, b) => b.timestamp - a.timestamp);
      });
      if (snapshot.docs.length > 0) {
        setLastNotificationDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastNotificationDoc(null);
      }
    } catch (error) {
      console.log("Error loading more notifications:", error);
    } finally {
      setFetchingMore(false);
    }
  }, [user, lastNotificationDoc, fetchingMore]);


  const refreshNewNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const userDocSnap = await getDoc(doc(database, "users", user.uid));
      const hidden = userDocSnap.data()?.hiddenNotifications || [];
      const blocked = userDocSnap.data()?.blockedUsers || [];
      const notificationsRef = collection(database, "users", user.uid, "notifications");
      // Tomamos el timestamp de la notificación más reciente, o new Date(0) si no hay ninguna
      const latestTimestamp = notificationList.length > 0 
        ? (notificationList[0].timestamp?.toDate ? notificationList[0].timestamp.toDate() : notificationList[0].timestamp)
        : new Date(0);
      // Consulta para obtener las notificaciones nuevas (en orden ascendente para traer las más antiguas primero)
      const q = query(
        notificationsRef, 
        where("timestamp", ">", latestTimestamp),
        orderBy("timestamp", "asc")
      );
      const snapshot = await getDocs(q);
      const newNotifs = snapshot.docs
        .map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            type: docSnap.data().type || "notification"
        }))
        .filter(n => !hidden.includes(n.id) && !blocked.includes(n.fromId));
      if (newNotifs.length > 0) {
        // Ordenamos de forma descendente (más reciente primero)
        newNotifs.sort((a, b) => b.timestamp - a.timestamp);
        const updatedNotifications = [...newNotifs, ...notificationList];
        setNotificationList(updatedNotifications);
        await saveNotificationsToCache(updatedNotifications);
      }
    } catch (error) {
      console.log("Error refreshing new notifications:", error);
    }
  }, [user, notificationList]);

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    // Lo ejecutas al montar
    checkTime(); 

    // Llamas a las notificaciones
    loadInitialNotifications();

    // Sin interval, así que el return puede ser vacío o no hacer nada.
    return () => {};
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: isNightMode ? "black" : "#fff",
        },
        headerTintColor: isNightMode ? "#fff" : "#000",
        headerTitle: "", // Elimina el título por defecto
        headerLeft: () => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 10,
            }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={isNightMode ? "#fff" : "#000"}
              onPress={() => navigation.goBack()}
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                color: isNightMode ? "#fff" : "#000",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {t("notifications.title")}
            </Text>
          </View>
        ),
      });
    }, [isNightMode, navigation])
  );

  useFocusEffect(
    useCallback(() => {
      markNotificationsAsSeen({ user, database, notifications, setNotifications });
    }, [user, notifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNewNotifications();
    setRefreshing(false);
  }, [refreshNewNotifications]);


  useEffect(() => {
    if (!user) return;
    const currentHour = new Date().getHours();
    setIsNightMode(currentHour >= 19 || currentHour < 6);
    const unsubscribeFR = subscribeFriendRequests();
    loadInitialNotifications();
    return () => {
      if (unsubscribeFR) unsubscribeFR();
    };
  }, [user]);

  const renderPrivateEventNotification = ({ item }) => {
    const eventDate = item.date; // Use the date field instead of timestamp
    return (
      <TouchableOpacity
        onPress={() => {
          console.log("Navegando a BoxDetails con los siguientes datos:", {
            title: item.eventTitle,
            imageUrl: item.eventImage,
            date: eventDate,
            isPrivate: true,
            description: item.description,
            day: item.day,
            hour: item.hour,
            address: item.address,
            phoneNumber: item.phoneNumber,
            eventId: item.eventId,
            Admin: item.Admin, // Agregar Admin
            category: item.eventCategory, // Agregar eventCategory
          });
          navigation.navigate("BoxDetails", {
            box: {
              title: item.eventTitle,
              imageUrl: item.eventImage,
              date: eventDate,
              isPrivate: true,
              description: item.description,
              day: item.day,
              hour: item.hour,
              address: item.address,
              phoneNumber: item.phoneNumber,
              eventId: item.eventId,
              category: "EventoParaAmigos", // Agregar la categoría aquí
              Admin: item.Admin, // Agregar Admin
            },
            selectedDate: eventDate,
            isFromNotification: true,
          });
        }}
        style={[styles.notificationContainer]}
      >
        <View style={styles.notificationContent}>
          <Image source={{ uri: item.fromImage }} style={styles.profileImage} />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.notificationText,
                { color: isNightMode ? "#fff" : "#000" },
              ]}
            >
              <Text style={[styles.boldText]}>{item.fromName}</Text>{" "}
              {t("notifications.invitedToEvent", {
                eventTitle: item.eventTitle,
              })}{" "}
              {t("notifications.on")}{" "}
              <Text style={[styles.boldText]}>{eventDate}</Text>
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() =>
                  handleAcceptPrivateEvent({
                    item,
                    setNotifications,
                    setLoadingEventId,
                    t,
                  })
                }
                disabled={loadingEventId === item.id}
              >
                {loadingEventId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("notifications.accept")}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() =>
                  handleRejectPrivateEvent({
                    item,
                    setNotifications,
                    t, // Pass the t function here
                  })
                }
              >
                <Text style={styles.buttonText}>
                  {t("notifications.reject")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGeneralEventNotification = ({ item }) => {
    const eventDate =
      typeof item.eventDate === "object" && item.eventDate.seconds
        ? new Date(item.eventDate.seconds * 1000).toLocaleString()
        : item.eventDate; // Convert timestamp to string if necessary
    const matchedBox = boxInfo.find((box) => box.title === item.eventTitle);
    const eventImage = matchedBox
      ? matchedBox.path
      : "https://via.placeholder.com/150";
    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("BoxDetails", {
            box: {
              title: item.eventTitle,
              imageUrl: eventImage,
              date: eventDate,
              isPrivate: false,
              hours: item.hours,
              number: item.number,
              coordinates: item.coordinates,
            },
            selectedDate: eventDate,
            isFromNotification: true,
          });
        }}
        style={[styles.notificationContainer]}
      >
        <View style={styles.notificationContent}>
          <Image source={{ uri: item.fromImage }} style={styles.profileImage} />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.notificationText,
                { color: isNightMode ? "#fff" : "#000" },
              ]}
            >
              <Text style={[styles.boldText]}>{item.fromName}</Text>{" "}
              {t("notifications.invitedToEvent", {
                eventTitle: item.eventTitle,
              })}{" "}
              {t("notifications.on")}{" "}
              <Text style={[styles.boldText]}>{eventDate}</Text>
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() =>
                  handleAcceptGeneralEvent({
                    item,
                    setNotifications,
                    setLoadingEventId,
                    t,
                  })
                }
                disabled={loadingEventId === item.id}
              >
                {loadingEventId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("notifications.accept")}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() =>
                  handleRejectGeneralEvent({
                    item,
                    setNotifications,
                  })
                }
              >
                <Text style={styles.buttonText}>
                  {t("notifications.reject")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotificationItem = ({ item }) => {
    // Skip rendering friend_request type notifications
    if (item.type === "friend_request") {
      return null;
    }

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

    let timestamp;
    let formattedTime = item.formattedTime || "";

    try {
      if (item.timestamp?.toDate) {
        timestamp = item.timestamp.toDate();
      } else if (item.timestamp && typeof item.timestamp === 'object' && item.timestamp.seconds) {
        timestamp = new Date(item.timestamp.seconds * 1000);
      } else if (item.timestamp) {
        timestamp = new Date(item.timestamp);
      }

      if (!formattedTime && timestamp && timestamp instanceof Date && !isNaN(timestamp)) {
        if (isToday(timestamp)) {
          formattedTime = format(timestamp, "HH:mm");
        } else if (isYesterday(timestamp)) {
          formattedTime = `${t("notifications.yesterday")} ${format(
            timestamp,
            "HH:mm"
          )}`;
        } else {
          formattedTime = format(timestamp, "dd/MM/yyyy HH:mm");
        }
      }
    } catch (error) {
      console.warn("Error formatting timestamp:", error);
      formattedTime = "";
    }

    const handleNotificationPress = () => {
      if (isEventInvitation) {
        if (item.eventCategory === "EventoParaAmigos" || item.isPrivate) {
          navigation.navigate("BoxDetails", {
            box: {
              title: item.eventTitle,
              imageUrl: item.eventImage,
              date: item.eventDate,
              day: item.day,
              description: item.description, // Asegúrate de pasar esto
              hour: item.hour, // Agrega la hora
              address: item.address, // Pasar dirección
              location: item.eventLocation || t("notifications.noLocation"),
              coordinates: item.coordinates || { latitude: 0, longitude: 0 },
              hours: item.hours || {},
              number: item.phoneNumber || t("notifications.noNumber"),
              isPrivate: item.isPrivate || false,
            },
            selectedDate: item.eventDate,
            isFromNotification: true, // Indicamos que es desde la notificación
          });
        } else {
          if (
            !item.coordinates ||
            !item.coordinates.latitude ||
            !item.coordinates.longitude
          ) {
            Alert.alert(
              t("notifications.error"),
              t("notifications.coordinatesNotAvailable")
            );

            return;
          }

          navigation.navigate("BoxDetails", {
            box: {
              title: item.eventTitle,
              imageUrl: item.eventImage,
              date: item.eventDate,
              location: item.eventLocation || t("notifications.noLocation"),
              coordinates: item.coordinates || { latitude: 0, longitude: 0 },
              hours: item.hours || {},
              number: item.phoneNumber || t("notifications.noNumber"),
              isPrivate: item.isPrivate || false,
            },
            selectedDate: item.eventDate,
          });
        }
      } else if (isFriendRequestResponse) {
        handleUserPress({
          uid: item.fromId,
          navigation,
          t,
        });
      } else {
        handleUserPress({
          uid: item.fromId,
          navigation,
          t,
        });
      }
    };

    if (item.type === "generalEventInvitation") {
      return renderGeneralEventNotification({ item });
    }

    if (item.type === "invitation") {
      return renderPrivateEventNotification({ item });
    }

    return (
      item.status !== "rejected" && (
        <TouchableOpacity
          onLongPress={() =>
            handleDeleteNotification({
              notificationId: item.id,
              setNotifications,
              setNotificationList,
              t,
            })
          }
          onPress={handleNotificationPress}
        >
          <View
            style={[
              styles.notificationContainer,
              { borderColor: isNightMode ? "white" : "#ccc" },
            ]}
          >
            {item.status !== "rejected" && (
              <View style={styles.timeContainer}>
                <Text
                  style={[
                    styles.timeText,
                    { color: isNightMode ? "#888" : "#666" },
                  ]}
                >
                  {formattedTime}
                </Text>
              </View>
            )}
            <View style={styles.notificationContent}>
              <Image
                source={{
                  uri:
                    item.fromImage && item.fromImage.length > 0
                      ? item.fromImage
                      : "https://via.placeholder.com/150",
                }}
                cachePolicy="memory-disk"
                style={styles.profileImage}
              />
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.notificationText,
                    { color: isNightMode ? "#fff" : "#333" },
                  ]}
                >
                  {(item.type === "invitation" ||
                    item.type === "eventConfirmation") &&
                  (item.status === "accepted" ||
                    item.status === "confirmed") ? (
                    item.message ||
                    t("notifications.acceptedInvitation", {
                      name: item.fromName,
                    })
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.boldText,
                          { color: isNightMode ? "#fff" : "#000" },
                        ]}
                      >
                        {item.fromName} {item.fromLastName || ""}
                      </Text>{" "}
                      {isFriendRequest && t("notifications.wantsToBeFriend")}
                      {isEventInvitation &&
                        t("notifications.invitedToEvent", {
                          eventTitle: item.eventTitle,
                        })}
                      {isFriendRequestResponse &&
                        (item.response === "accepted"
                          ? t("notifications.nowFriends")
                          : t("notifications.rejectedFriendRequest"))}
                      {isLikeNotification && t("userProfile.likedYourProfile")}
                      {item.type === "storyLike" &&
                        t("notifications.likedYourStory")}
                      {isNoteLikeNotification && t("notes.likedYourNote")}
                    </>
                  )}
                </Text>
                {(isFriendRequest || isEventInvitation) && (
                  <View style={[styles.buttonContainer, styles.acceptButton]}>
                    <TouchableOpacity
                      disabled={loadingEventId === item.id}
                      onPress={() =>
                        isFriendRequest
                          ? handleAcceptRequest({
                              request: item,
                              setLoadingEventId,
                              setNotifications,
                              t,
                            })
                          : handleAcceptEventInvitation({
                              notif: item,
                              setNotifications,
                              t,
                            })
                      }
                      style={[
                        styles.acceptButton,
                        {
                          backgroundColor: isNightMode
                            ? "rgba(255, 255, 255, 0.2)"
                            : "rgba(128, 128, 128, 0.3)",
                        },
                      ]}
                    >
                      {loadingEventId === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text
                          style={[
                            styles.buttonText,
                            { color: isNightMode ? "white" : "white" },
                          ]}
                        >
                          {t("notifications.accept")}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={loadingEventId === item.id}
                      onPress={() =>
                        isFriendRequest
                          ? handleRejectRequest({
                              request: item,
                              setLoadingEventId,
                              setNotifications,
                              t,
                            })
                          : handleRejectEventInvitation({
                              notif: item,
                              setNotifications,
                              t,
                            })
                      }
                      style={[
                        styles.rejectButton,
                        {
                          backgroundColor: isNightMode
                            ? "rgba(255, 255, 255, 0.2)"
                            : "rgba(128, 128, 128, 0.3)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: isNightMode ? "white" : "white" },
                        ]}
                      >
                        {t("notifications.reject")}
                      </Text>
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

  return (
      <LinearGradient
        colors={isNightMode ? ["black", "black"] : ["#fff", "#f0f0f0"]}
        style={styles.container}
      >
       <FlatList
  data={combinedNotifications}
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
  onEndReachedThreshold={0.2}
  onEndReached={loadMoreNotifications}
  ListFooterComponent={fetchingMore ? <ActivityIndicator style={{ marginVertical: 16 }} size="small" /> : null}
/>

      </LinearGradient>
  );
}
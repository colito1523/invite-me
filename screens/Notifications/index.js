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
import { InteractionManager } from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  limit,
  orderBy,
  startAfter
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

export default function NotificationsComponent() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingEventId, setLoadingEventId] = useState(null);
  const user = auth.currentUser;
  const [lastVisible, setLastVisible] = useState(null);
const [loadingMore, setLoadingMore] = useState(false);


 // Carga inicial de notificaciones (y solicitudes de amistad)
 const fetchNotifications = useCallback(async () => {
  if (!user) return;

  try {
    const userRef = doc(database, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const hiddenNotifications = userDoc.data()?.hiddenNotifications || [];
    const blockedUsers = userDoc.data()?.blockedUsers || [];

    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const friendRequestsRef = collection(database, "users", user.uid, "friendRequests");

    const notificationsQuery = query(
      notificationsRef,
      orderBy("timestamp", "desc"),
      limit(8)
    );
    const friendRequestsQuery = query(
      friendRequestsRef,
      where("status", "==", "pending"),
      limit(8)
    );

    const [notificationsSnapshot, friendRequestsSnapshot] = await Promise.all([
      getDocs(notificationsQuery),
      getDocs(friendRequestsQuery)
    ]);

    const notificationsData = notificationsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: doc.data().type || "notification",
      }))
      .filter(notif => 
        !hiddenNotifications.includes(notif.id) &&
        !blockedUsers.includes(notif.fromId)
      );

    const friendRequestsData = friendRequestsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: "friendRequest",
      }))
      .filter(notif => 
        !hiddenNotifications.includes(notif.id) &&
        !blockedUsers.includes(notif.fromId)
      );

    let combined = [...notificationsData, ...friendRequestsData];
    combined.sort((a, b) => b.timestamp - a.timestamp);

    if (!notificationsSnapshot.empty) {
      setLastVisible(notificationsSnapshot.docs[notificationsSnapshot.docs.length - 1]);
    }

    setNotifications(combined);
    setIsLoading(false);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    setIsLoading(false);
  }
}, [user]);


const loadMoreNotifications = async () => {
  if (!lastVisible || loadingMore || !user) return;
  setLoadingMore(true);

  try {
    const notificationsRef = collection(database, "users", user.uid, "notifications");
    const nextQuery = query(
      notificationsRef,
      orderBy("timestamp", "desc"),
      startAfter(lastVisible),
      limit(10)
    );
    const snapshot = await getDocs(nextQuery);
    if (!snapshot.empty) {
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      const moreNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: doc.data().type || "notification",
      }));
      setNotifications(prev => [...prev, ...moreNotifications]);
    } else {
      // Si no hay datos, indicamos que no hay más datos
      setLastVisible(null);
    }
  } catch (error) {
    console.error("Error loading more notifications:", error);
  } finally {
    setLoadingMore(false);
  }
};



  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);

    fetchNotifications();

    return () => clearInterval(interval);
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
      const task = InteractionManager.runAfterInteractions(() => {
        if (notifications.some((notif) => !notif.seen)) {
          markNotificationsAsSeen({
            user,
            database,
            notifications,
            setNotifications,
          });
        }
      });
  
      return () => task.cancel();
    }, [user, notifications])
  );
  
  

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

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

    const timestamp = item.timestamp?.toDate
      ? item.timestamp.toDate()
      : new Date(item.timestamp);

    let formattedTime = item.formattedTime || "";

    if (!formattedTime && timestamp) {
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

    const handleNotificationPress = (item) => {
      if (!item) return; // ✅ Evita errores si item es undefined
    
      // 1️⃣ Primero navegamos inmediatamente
      if (item.type === "generalEventInvitation") {
        navigation.navigate("BoxDetails", {
          box: {
            title: item.eventTitle,
            imageUrl: item.eventImage,
            date: item.eventDate,
            isPrivate: false,
            hours: item.hours,
            number: item.number,
            coordinates: item.coordinates,
          },
          selectedDate: item.eventDate,
          isFromNotification: true,
        });
      } else if (item.type === "invitation") {
        navigation.navigate("BoxDetails", {
          box: {
            title: item.eventTitle,
            imageUrl: item.eventImage,
            date: item.eventDate,
            isPrivate: true,
            description: item.description,
            day: item.day,
            hour: item.hour,
            address: item.address,
            phoneNumber: item.phoneNumber,
            eventId: item.eventId,
            category: "EventoParaAmigos",
            Admin: item.Admin,
          },
          selectedDate: item.eventDate,
          isFromNotification: true,
        });
      } else {
        handleUserPress({
          uid: item.fromId,
          navigation,
          t,
        });
      }
    
      // 2️⃣ Luego ejecutamos validaciones en segundo plano
      setTimeout(() => {
        if (item.type === "invitation" || item.type === "generalEventInvitation") {
          if (!item.coordinates || !item.coordinates.latitude || !item.coordinates.longitude) {
            Alert.alert(
              t("notifications.error"),
              t("notifications.coordinatesNotAvailable")
            );
          }
        }
      }, 500);
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
              notificationId: item.id, // Asegúrate de pasar el ID de la notificación
              setNotifications,
              t,
            })
          }
          onPress={() => handleNotificationPress(item)}
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
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={renderNotificationItem}
      contentContainerStyle={styles.listContent}
      initialNumToRender={6}
      maxToRenderPerBatch={5}
      removeClippedSubviews={true}
      onEndReached={loadMoreNotifications}
      onEndReachedThreshold={0.1}
      ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="black" /> : null}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["black"]} tintColor="black" />
      }
    />
  </LinearGradient>
);
}

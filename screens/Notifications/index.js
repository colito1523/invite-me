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
import { Image } from "expo-image";
import { database, auth } from "../../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { format, isToday, isYesterday } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import boxInfo from "../../src/data/boxInfo"
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
  handleRejectGeneralEvent
} from "./utils";

export default function NotificationsComponent() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingEventId, setLoadingEventId] = useState(null);
  const user = auth.currentUser;

  const fetchNotifications = useCallback(async () => {
    if (user) {
      const userRef = doc(database, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const hiddenNotifications = userDoc.data()?.hiddenNotifications || [];
      const blockedUsers = userDoc.data()?.blockedUsers || [];

      const notificationsRef = collection(
        database,
        "users",
        user.uid,
        "notifications"
      );

      const friendRequestsRef = collection(
        database,
        "users",
        user.uid,
        "friendRequests"
      );

      const notificationsQuery = query(notificationsRef);

      const friendRequestsQuery = query(
        friendRequestsRef,
        where("status", "==", "pending")
      );

      const unsubscribeNotifications = onSnapshot(
        notificationsQuery,
        (querySnapshot) => {
          const notifList = querySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              type: doc.data().type || "notification",
            }))
            .filter(
              (notif) =>
                !hiddenNotifications.includes(notif.id) &&
                !blockedUsers.includes(notif.fromId) &&
                notif.status !== "accepted" &&
                notif.status !== "rejected"
            );
          setNotifications(notifList);
        }
      );

      const unsubscribeFriendRequests = onSnapshot(
        friendRequestsQuery,
        (querySnapshot) => {
          const requestList = querySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              type: "friendRequest",
            }))
            .filter(
              (notif) =>
                !hiddenNotifications.includes(notif.id) &&
                !blockedUsers.includes(notif.fromId) &&
                notif.status !== "accepted" &&
                notif.status !== "rejected"
            );

          updateNotifications({
            newNotifications: requestList,
            setNotifications
          });
        }
      );

      setIsLoading(false);

      return () => {
        unsubscribeNotifications();
        unsubscribeFriendRequests();
      };
    }
  }, [user]);

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

  useFocusEffect(
    useCallback(() => {

      markNotificationsAsSeen({
        user,
        database,
        notifications,
        setNotifications
      });
    }, [user])
  );

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

  const renderPrivateEventNotification = ({ item }) => {
    const eventDate = item.date; // Use the date field instead of timestamp
    return (
      <TouchableOpacity
        onPress={() => {
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
            },
            selectedDate: eventDate,
            isFromNotification: true,
          });
        }}
        style={[styles.notificationContainer]}
      >
        <View style={styles.notificationContent}>
          <Image
            source={{ uri: item.fromImage }}
            style={styles.profileImage}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.notificationText, { color: isNightMode ? "#fff" : "#000" }]}>
              <Text style={[styles.boldText]}>{item.fromName}</Text> te ha invitado a{" "}
              <Text style={[styles.boldText]}>{item.eventTitle}</Text> el día{" "}
              <Text style={[styles.boldText]}>{eventDate}</Text>
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAcceptPrivateEvent({
                  item,
                  setNotifications,
                  setLoadingEventId
                })}
                disabled={loadingEventId === item.id}
              >
                {loadingEventId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Aceptar</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleRejectPrivateEvent({
                  item,
                  setNotifications
                })}
              >
                <Text style={styles.buttonText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGeneralEventNotification = ({ item }) => {
    const eventDate = typeof item.eventDate === 'object' && item.eventDate.seconds
      ? new Date(item.eventDate.seconds * 1000).toLocaleString()
      : item.eventDate; // Convert timestamp to string if necessary
    const matchedBox = boxInfo.find((box) => box.title === item.eventTitle);
    const eventImage = matchedBox ? matchedBox.path : "https://via.placeholder.com/150";
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
          <Image
            source={{ uri: item.fromImage }}
            style={styles.profileImage}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.notificationText, { color: isNightMode ? "#fff" : "#000" }]}>
              <Text style={[styles.boldText]}>{item.fromName}</Text> te ha invitado a{" "}
              <Text style={[styles.boldText]}>{item.eventTitle}</Text> el día{" "}
              <Text style={[styles.boldText]}>{eventDate}</Text>
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAcceptGeneralEvent({
                  item,
                  setNotifications,
                  setLoadingEventId
                })}
                disabled={loadingEventId === item.id}
              >
                {loadingEventId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Aceptar</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleRejectGeneralEvent({
                  item,
                  setNotifications
                })}
              >
                <Text style={styles.buttonText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
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

    const timestamp = item.timestamp?.toDate
      ? item.timestamp.toDate()
      : new Date(item.timestamp);

    let formattedTime = "";

    if (timestamp) {
      if (isToday(timestamp)) {
        formattedTime = format(timestamp, "HH:mm"); // Hora y minutos para hoy
      } else if (isYesterday(timestamp)) {
        formattedTime = `${t("notifications.yesterday")} ${format(
          timestamp,
          "HH:mm"
        )}`; // Ayer con hora
      } else {
        formattedTime = format(timestamp, "dd/MM/yyyy HH:mm"); // Fecha completa con hora
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
      } else {
        handleUserPress({
          uid: item.fromId,
          navigation
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
          onPress={handleNotificationPress}
          onLongPress={() => handleDeleteNotification({
            notificationId: item.id,
            setNotifications
          })}
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
                  {item.type === "invitation" && item.status === "accepted" ? (
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
                      {isLikeNotification && item.message}{" "}
                      {/* Mostrar el mensaje de like */}
                      {item.type === "storyLike" &&
                        t("notifications.likedYourStory")}
                      {isNoteLikeNotification && item.message}
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
                            setNotifications
                          })
                          : handleAcceptEventInvitation({
                            notif: item,
                            setNotifications
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
                      {loadingEventId === item.id ? (<ActivityIndicator size="small" color="#fff" />) : (<Text
                        style={[
                          styles.buttonText,
                          { color: isNightMode ? "#fff" : "#000" },
                        ]}
                      >
                        {t("notifications.accept")}
                      </Text>)}
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={loadingEventId === item.id}
                      onPress={() =>
                        isFriendRequest
                          ? handleRejectRequest({
                            request: item,
                            setLoadingEventId,
                            setNotifications
                          })
                          : handleRejectEventInvitation({
                            notif: item,
                            setNotifications
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
                          { color: isNightMode ? "#fff" : "#000" },
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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size={50} color="black" />
      </View>
    );
  }
  console.log("las notis del render", notifications)
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={isNightMode ? ["#1a1a1a", "#000"] : ["#fff", "#f0f0f0"]}
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
    borderBottomColor: "#ccc",
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
    marginBottom: 4,
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
  notificationImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  eventDateText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 10,
  },
  button: {
    backgroundColor: "#d3d3d3",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
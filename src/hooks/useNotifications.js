import React, { useState, useEffect } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { auth, database } from "../../config/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";

// Configuración de notificaciones push
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Error: No se pudo obtener permiso para notificaciones push");
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId
    })).data;
  } else {
    alert("Debes usar un dispositivo físico para recibir notificaciones push");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("chat-messages", {
      name: "Chat Messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync("events", {
      name: "Events",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#32CD32",
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync("default", {
      name: "General Notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

const useNotifications = (navigation) => { 
  const { t } = useTranslation();
  const [expoPushToken, setExpoPushToken] = useState("");

  useEffect(() => {
    // Nos suscribimos a los cambios en la autenticación
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(database, "users", user.uid);
        const userDoc = await getDoc(userRef);

        // Si no existe token en Firestore, se registra y guarda
        if (!userDoc.exists() || !userDoc.data().expoPushToken) {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            setExpoPushToken(token);
            await setDoc(userRef, { expoPushToken: token }, { merge: true });
            console.log("Expo Push Token guardado en Firestore.");
          }
        } else {
          // Si ya existe, se utiliza el token existente
          setExpoPushToken(userDoc.data().expoPushToken);
        }
      }
    });

    // Listener para notificaciones recibidas mientras la app está abierta
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      const { data } = notification.request.content;
      if (data?.type === 'chat') {
        // Manejar notificación de chat
      } else if (data?.type === 'event') {
        // Manejar notificación de evento
      }
    });

    // Listener para acciones al interactuar con la notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const { data } = response.notification.request.content;
      if (data?.type === 'chat' && data.chatId) {
        navigation.navigate('ChatUsers', { chatId: data.chatId });
      } else if (data?.type === 'event' && data.eventId) {
        navigation.navigate('BoxDetails', { eventId: data.eventId });
      }
    });

    return () => {
      unsubscribeAuth();
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [navigation]);

  return expoPushToken;
};

export default useNotifications;

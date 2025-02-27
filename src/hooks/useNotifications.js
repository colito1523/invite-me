import React, { useState, useEffect } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { auth, database } from "../../config/firebase"; // Asegúrate de tener configurado Firebase
import { doc, setDoc, getDoc } from "firebase/firestore"; // Para guardar en Firestore
import Constants from "expo-constants";
import { Platform } from "react-native";

// Configuración de notificaciones push
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Función para registrar el dispositivo y obtener el token de Expo
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
      alert("No se pudo obtener el token para notificaciones push!");
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId
    })).data;
  } else {
    alert("Debes usar un dispositivo físico para recibir notificaciones push");
  }

  if (Platform.OS === "android") {
    // Canal para mensajes de chat
    await Notifications.setNotificationChannelAsync("chat-messages", {
      name: "Chat Messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: 'default',
    });

    // Canal para eventos
    await Notifications.setNotificationChannelAsync("events", {
      name: "Events",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#32CD32",
      sound: 'default',
    });

    // Canal para notificaciones generales
    await Notifications.setNotificationChannelAsync("default", {
      name: "General Notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

const useNotifications = (navigation) => { // Added navigation prop
  const [expoPushToken, setExpoPushToken] = useState("");

  useEffect(() => {
    // Registrar el token de notificaciones push
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);

        // Guardar el token en Firestore solo si el usuario está autenticado
        if (auth.currentUser) {
          const userRef = doc(database, "users", auth.currentUser.uid);

          // Almacenar el token de forma segura y evitar reemplazar datos no relacionados
          setDoc(userRef, { expoPushToken: token }, { merge: true })
            .then(() => console.log("Expo Push Token guardado en Firestore."))
            .catch((error) => console.error("Error al guardar el token:", error));
        }
      }
    });

    // Listener para manejar notificaciones recibidas mientras la app está abierta
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      // Puedes manejar la notificación según el tipo de datos recibidos
      if (data?.type === 'chat') {
        // Manejar notificación de chat
      } else if (data?.type === 'event') {
        // Manejar notificación de evento
      }
    });

    // Listener para manejar acciones cuando se interactúa con la notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const { data } = response.notification.request.content;

      // Navegación basada en el tipo de notificación
      if (data?.type === 'chat' && data.chatId) {
        navigation.navigate('ChatUsers', { chatId: data.chatId });
      } else if (data?.type === 'event' && data.eventId) {
        navigation.navigate('BoxDetails', { eventId: data.eventId });
      }
    });

    // Limpiar los listeners cuando el componente se desmonte
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [navigation]); // Added navigation to dependency array

  return expoPushToken;
};

export default useNotifications;
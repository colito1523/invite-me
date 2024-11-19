import React, { useState, useEffect } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { auth, database } from "../../config/firebase"; // Asegúrate de tener configurado Firebase
import { doc, setDoc } from "firebase/firestore"; // Para guardar en Firestore
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

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Push Token:", token);
  } else {
    alert("Debes usar un dispositivo físico para recibir notificaciones push");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

const useNotifications = () => {
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
  // Extrae el título y el cuerpo del contenido de la notificación
  const { title, body } = notification.request.content;
  console.log("Notificación recibida:", title, body);
});

// Listener para manejar acciones cuando se interactúa con la notificación (tocar la notificación)
const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
  const { title, body } = response.notification.request.content;
  console.log("Respuesta a la notificación:", title, body);
});

    // Limpiar los listeners cuando el componente se desmonte
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return expoPushToken;
};

export default useNotifications;

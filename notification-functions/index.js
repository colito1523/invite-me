// Importa las librerías necesarias
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

// Inicializa Firebase Admin y Expo SDK
admin.initializeApp();
const db = admin.firestore();
const expo = new Expo();

// Define la función para enviar notificaciones cuando se crea un nuevo documento en la colección 'notifications'
exports.sendNotificationOnEvent = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    try {
      // Extrae el userId del contexto
      const { userId } = context.params;

      // Obtiene la información del usuario que tiene el token Expo
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        console.error(`User ${userId} does not exist.`);
        return;
      }

      const expoPushToken = userDoc.data().expoPushToken;

      // Verifica si el token de Expo es válido
      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) {
        console.error(`Invalid push notification token for user ${userId}`);
        return;
      }

      // Datos de la notificación desde el snapshot
      const notificationData = snapshot.data();
      console.log("Datos de la notificación recibidos:", notificationData);

      // Personaliza los textos de la notificación según el tipo de evento
      let title = 'Nueva Notificación';
      let body = 'Tienes una nueva actividad en Invite Me.';

      switch (notificationData.type) {
        case 'friend_request':
          title = 'Solicitud de Amistad';
          body = `${notificationData.fromName} te ha enviado una solicitud de amistad.`;
          break;

        case 'like':
          title = 'Nuevo Like';
          body = `${notificationData.fromName} le ha dado like a tu perfil.`;
          break;

        case 'event_invitation':
          title = 'Invitación a un Evento';
          body = `Has sido invitado al evento "${notificationData.eventTitle}".`;
          break;

        default:
          title = notificationData.title || 'Notificación de Invite Me';
          body = notificationData.body || 'Tienes una nueva actividad en Invite Me.';
      }

      console.log(`Título de la notificación: ${title}`);
      console.log(`Cuerpo de la notificación: ${body}`);

      // Crear el mensaje de notificación
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: {
          title: title,
          body: body,
          ...notificationData
        }
      };

      // Envía la notificación utilizando el SDK de Expo
      let receipt = await expo.sendPushNotificationsAsync([message]);
      console.log(`Notification sent to ${userId}, receipt:`, receipt);
    } catch (error) {
      console.error(`Error sending notification: ${error}`);
    }
  });

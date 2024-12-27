
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const expo = new Expo();

exports.sendEventNotification = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const notificationData = snapshot.data();

    if (!notificationData) return;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const expoPushToken = userDoc.data()?.expoPushToken;

      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) {
        console.log('Token inválido o no encontrado:', expoPushToken);
        return;
      }

      // Verifica si es una invitación a un evento privado y el campo eventTitle tiene valor válido
      let title = '¡Nueva Notificación!';
      let body = '';

      if (notificationData.type === 'invitation' && notificationData.eventTitle) {
        title = '¡Nueva Invitación a Evento Privado!';
        body = `${notificationData.fromName} te ha invitado a ${notificationData.eventTitle}`;
      } else if (notificationData.type === 'like') {
        title = 'Nuevo Like';
        body = `${notificationData.fromName} le gustó tu perfil.`;
      } else {
        console.log('Tipo de notificación desconocido o datos incompletos:', notificationData);
        return;
      }

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: {
          type: notificationData.type,
          eventTitle: notificationData.eventTitle || '',
          eventDate: notificationData.eventDate || '',
          fromName: notificationData.fromName || '',
          _displayInNotificationScreen: true
        },
        priority: 'high'
      };

      const chunks = expo.chunkPushNotifications([message]);
      for (let chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }
    } catch (error) {
      console.error('Error en notificación:', error);
    }
  });


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

        return;
      }

      const getNotificationText = (lang) => {
        const texts = {
          'es': {
            defaultTitle: '¡Nueva Notificación!',
            privateEventTitle: '¡Nueva Invitación a Evento Privado!',
            generalEventTitle: '¡Nueva Invitación a Evento!',
            inviteText: (from, event) => `${from} te ha invitado a ${event}`
          },
          'en': {
            defaultTitle: 'New Notification!',
            privateEventTitle: 'New Private Event Invitation!',
            generalEventTitle: 'New Event Invitation!',
            inviteText: (from, event) => `${from} invited you to ${event}`
          },
          'pt': {
            defaultTitle: 'Nova Notificação!',
            privateEventTitle: 'Novo Convite para Evento Privado!',
            generalEventTitle: 'Novo Convite para Evento!',
            inviteText: (from, event) => `${from} convidou você para ${event}`
          }
        };
        return texts[lang] || texts['en'];
      };

      const preferredLanguage = userDoc.data()?.preferredLanguage || 'en';
      const texts = getNotificationText(preferredLanguage);
      
      let title = texts.defaultTitle;
      let body = '';

      if (notificationData.type === 'invitation' && notificationData.eventTitle) {
        title = texts.privateEventTitle;
        body = texts.inviteText(notificationData.fromName, notificationData.eventTitle);
      } else if (notificationData.type === 'generalEventInvitation' && notificationData.eventTitle) {
        title = texts.generalEventTitle;
        body = texts.inviteText(notificationData.fromName, notificationData.eventTitle);
      } else {

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
          coordinates: notificationData.coordinates || null,
          hours: notificationData.hours || {},
          number: notificationData.number || '',
          imageUrl: notificationData.imageUrl || '',
          _displayInNotificationScreen: true,
          screen: 'Notifications' // Agregamos esta línea
        },
        priority: 'high',
        image: 'https://firebasestorage.googleapis.com/v0/b/invite-me-32a07.appspot.com/o/FCMImages%2Fnuevo%20icono.png?alt=media&token=057d3468-1996-439c-869e-ed09f99344bb'
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
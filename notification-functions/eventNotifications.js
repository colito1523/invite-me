const functions = require('firebase-functions/v1');
const admin = require('./firebaseAdmin'); // ⬅️ Cambio clave
const { Expo } = require('expo-server-sdk');

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
      const tokens = userDoc.data()?.expoPushTokens || [];
      const preferredLanguage = userDoc.data()?.preferredLanguage || 'en';

      const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
      if (validTokens.length === 0) return;

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

      const messages = validTokens.map((token) => ({
        to: token,
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
          screen: 'Notifications'
        },
        priority: 'high',
        image: 'https://firebasestorage.googleapis.com/v0/b/invite-me-32a07.appspot.com/o/FCMImages%2Fnuevo_logo.png?alt=media&token=1803b6b5-e77b-4b6e-81eb-9a978604ad6a'
      }));

      const chunks = expo.chunkPushNotifications(messages);
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

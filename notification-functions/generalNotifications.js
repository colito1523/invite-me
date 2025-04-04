const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const expo = new Expo();

exports.sendGeneralNotification = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const notificationData = snapshot.data();

    if (
      ['friend_request', 'like', 'event_invitation', 'noteLike', 'generalEventInvitation', 'invitation']
        .includes(notificationData.type)
    ) return;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const tokens = userDoc.data()?.expoPushTokens || [];
      const preferredLanguage = userDoc.data()?.preferredLanguage || 'en';

      const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
      if (validTokens.length === 0) return;

      const getNotificationText = (lang) => {
        const texts = {
          'es': {
            title: 'Notificación General',
            defaultMessage: 'Tienes una nueva notificación.'
          },
          'en': {
            title: 'General Notification',
            defaultMessage: 'You have a new notification.'
          },
          'pt': {
            title: 'Notificação Geral',
            defaultMessage: 'Você tem uma nova notificação.'
          }
        };
        return texts[lang] || texts['en'];
      };

      const texts = getNotificationText(preferredLanguage);

      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: texts.title,
        body: notificationData.message || texts.defaultMessage,
        data: {
          ...notificationData,
          screen: 'Notifications'
        },
        image: 'https://firebasestorage.googleapis.com/v0/b/invite-me-32a07.appspot.com/o/FCMImages%2Fnuevo_logo.png?alt=media&token=1803b6b5-e77b-4b6e-81eb-9a978604ad6a'
      }));

      await expo.sendPushNotificationsAsync(messages);
    } catch (error) {
      console.error('Error sending general notification:', error);
    }
  });

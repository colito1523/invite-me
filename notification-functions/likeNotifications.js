const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const expo = new Expo();

exports.sendLikeNotification = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const notificationData = snapshot.data();

    if (notificationData.type !== 'like' && notificationData.type !== 'noteLike') return; //Added condition for noteLike

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const expoPushToken = userDoc.data()?.expoPushToken;

      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) return;

      const getNotificationText = (lang) => {
        const texts = {
          'es': {
            title: 'Nuevo Like',
            noteLikeBody: (name) => `A ${name} le gustó tu estado de ánimo`,
            profileLikeBody: (name) => `A ${name} le gustó tu perfil`
          },
          'en': {
            title: 'New Like',
            noteLikeBody: (name) => `${name} liked your mood`,
            profileLikeBody: (name) => `${name} liked your profile`
          },
          'pt': {
            title: 'Novo Like',
            noteLikeBody: (name) => `${name} curtiu seu humor`,
            profileLikeBody: (name) => `${name} curtiu seu perfil`
          }
        };
        return texts[lang] || texts['en'];
      };

      const preferredLanguage = userDoc.data()?.preferredLanguage || 'en';
      const texts = getNotificationText(preferredLanguage);

      let message;
      if (notificationData.type === 'noteLike') {
        message = {
          to: expoPushToken,
          sound: 'default',
          title: texts.title,
          body: texts.noteLikeBody(notificationData.fromName),
          data: notificationData,
        };
      } else if (notificationData.type === 'like') {
        message = {
          to: expoPushToken,
          sound: 'default',
          title: texts.title,
          body: texts.profileLikeBody(notificationData.fromName),
          data: notificationData,
        };
      }


      await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending like notification:', error);
    }
  });
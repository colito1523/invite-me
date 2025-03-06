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

    if (!['like', 'noteLike', 'storyLike'].includes(notificationData.type)) return; // Agregamos storyLike

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const expoPushToken = userDoc.data()?.expoPushToken;
      const preferredLanguage = userDoc.data()?.preferredLanguage || 'en';

      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) return;

      const getNotificationText = (lang) => {
        const texts = {
          'es': {
            title: 'Nuevo Like',
            noteLikeBody: (name) => `A ${name} le gustó tu estado de ánimo.`,
            profileLikeBody: (name) => `A ${name} le gustó tu perfil.`,
            storyLikeBody: (name) => `A ${name} le gustó tu historia.`
          },
          'en': {
            title: 'New Like',
            noteLikeBody: (name) => `${name} liked your mood.`,
            profileLikeBody: (name) => `${name} liked your profile.`,
            storyLikeBody: (name) => `${name} liked your story.`
          },
          'pt': {
            title: 'Novo Like',
            noteLikeBody: (name) => `${name} curtiu seu humor.`,
            profileLikeBody: (name) => `${name} curtiu seu perfil.`,
            storyLikeBody: (name) => `${name} curtiu sua história.`
          }
        };
        return texts[lang] || texts['en'];
      };

      const texts = getNotificationText(preferredLanguage);

      let message;
      if (notificationData.type === 'noteLike') {
        message = {
          to: expoPushToken,
          sound: 'default',
          title: texts.title,
          body: texts.noteLikeBody(notificationData.fromName),
          data: { ...notificationData, screen: 'Notifications' },
          image: 'https://firebasestorage.googleapis.com/v0/b/invite-me-32a07.appspot.com/o/FCMImages%2Fnuevo%20icono.png?alt=media&token=057d3468-1996-439c-869e-ed09f99344bb'
        };
      } else if (notificationData.type === 'like') {
        message = {
          to: expoPushToken,
          sound: 'default',
          title: texts.title,
          body: texts.profileLikeBody(notificationData.fromName),
          data: { ...notificationData, screen: 'Notifications' },
          image: 'https://firebasestorage.googleapis.com/v0/b/invite-me-32a07.appspot.com/o/FCMImages%2Fnuevo%20icono.png?alt=media&token=057d3468-1996-439c-869e-ed09f99344bb'
        };
      } else if (notificationData.type === 'storyLike') {
        message = {
          to: expoPushToken,
          sound: 'default',
          title: texts.title,
          body: texts.storyLikeBody(notificationData.fromName),
          data: { ...notificationData, screen: 'Notifications' },
          image: 'https://firebasestorage.googleapis.com/v0/b/invite-me-32a07.appspot.com/o/FCMImages%2Fnuevo%20icono.png?alt=media&token=057d3468-1996-439c-869e-ed09f99344bb'
        };
      }

      await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending like notification:', error);
    }
  });

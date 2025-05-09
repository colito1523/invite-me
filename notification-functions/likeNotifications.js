const functions = require('firebase-functions/v1');
const admin = require('./firebaseAdmin'); // ⬅️ Cambio clave
const { Expo } = require('expo-server-sdk');

const db = admin.firestore();
const expo = new Expo();

exports.sendLikeNotification = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const notificationData = snapshot.data();

    if (!['like', 'noteLike', 'storyLike'].includes(notificationData.type)) return;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const tokens = userDoc.data()?.expoPushTokens || [];
      const preferredLanguage = userDoc.data()?.preferredLanguage || 'en';

      const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
      if (validTokens.length === 0) return;

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

      const bodyText =
        notificationData.type === 'noteLike'
          ? texts.noteLikeBody(notificationData.fromName)
          : notificationData.type === 'like'
          ? texts.profileLikeBody(notificationData.fromName)
          : texts.storyLikeBody(notificationData.fromName);

      const messages = validTokens.map((token) => ({
        to: token,
        sound: 'default',
        title: texts.title,
        body: bodyText,
        data: { ...notificationData, screen: 'Notifications' },
        image: 'https://firebasestorage.googleapis.com/v0/b/invite-me-32a07.appspot.com/o/FCMImages%2Fnuevo_logo.png?alt=media&token=1803b6b5-e77b-4b6e-81eb-9a978604ad6a',
      }));

      await expo.sendPushNotificationsAsync(messages);
    } catch (error) {
      console.error('Error sending like notification:', error);
    }
  });

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

      let message;
      if (notificationData.type === 'noteLike') {
        message = {
          to: expoPushToken,
          sound: 'default',
          title: 'Nuevo Like',
          body: `A ${notificationData.fromName} le gustó tu estado de ánimo`,
          data: notificationData,
        };
      } else if (notificationData.type === 'like') {
        message = {
          to: expoPushToken,
          sound: 'default',
          title: 'Nuevo Like',
          body: `A ${notificationData.fromName} le gustó tu perfil`,
          data: notificationData,
        };
      }


      await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending like notification:', error);
    }
  });
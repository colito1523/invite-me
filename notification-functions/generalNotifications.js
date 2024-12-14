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

    if (['friend_request', 'like', 'event_invitation'].includes(notificationData.type)) return;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const expoPushToken = userDoc.data()?.expoPushToken;

      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) return;

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'Notificación General',
        body: notificationData.message || 'Tienes una nueva notificación.',
        data: notificationData,
      };

      await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending general notification:', error);
    }
  });

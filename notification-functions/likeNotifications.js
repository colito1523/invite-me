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

    if (notificationData.type !== 'like') return;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const expoPushToken = userDoc.data()?.expoPushToken;

      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) return;

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'Te han dado un Like',
        body: `${notificationData.fromName} ha dado like a tu publicación.`,
        data: notificationData,
      };

      await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending like notification:', error);
    }
  });

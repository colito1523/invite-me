const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

const db = admin.firestore();
const expo = new Expo();

exports.sendFriendRequestNotification = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const notificationData = snapshot.data();

    if (notificationData.type !== 'friend_request') return;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const expoPushToken = userDoc.data()?.expoPushToken;

      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) return;

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'Solicitud de Amistad',
        body: `${notificationData.fromName} te ha enviado una solicitud de amistad.`,
        data: notificationData,
      };

      await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending friend request notification:', error);
    }
  });

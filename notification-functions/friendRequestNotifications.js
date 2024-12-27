
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const expo = new Expo();

exports.sendFriendRequestNotification = functions.firestore
  .document('users/{userId}/friendRequests/{requestId}')
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const requestData = snapshot.data();

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const expoPushToken = userDoc.data()?.expoPushToken;

      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) return;

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'Nueva solicitud de amistad',
        body: `${requestData.fromName} te ha enviado una solicitud de amistad`,
        data: {
          type: 'friend_request',
          fromId: requestData.fromId,
          fromName: requestData.fromName,
          fromImage: requestData.fromImage,
        },
      };

      await expo.sendPushNotificationsAsync([message]);

      // Create notification record
      const notificationRef = db.collection('users').doc(userId).collection('notifications');
      await notificationRef.add({
        type: 'friend_request',
        fromId: requestData.fromId,
        fromName: requestData.fromName,
        fromImage: requestData.fromImage,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        seen: false,
      });
    } catch (error) {
      console.error('Error sending friend request notification:', error);
    }
  });

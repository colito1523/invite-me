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

      const getNotificationText = (lang) => {
        const texts = {
          'es': {
            title: 'Nueva solicitud de amistad',
            body: (name) => `${name} te ha enviado una solicitud de amistad`
          },
          'en': {
            title: 'New friend request',
            body: (name) => `${name} sent you a friend request`
          },
          'pt': {
            title: 'Nova solicitação de amizade',
            body: (name) => `${name} enviou uma solicitação de amizade`
          }
        };
        return texts[lang] || texts['en'];
      };

      const preferredLanguage = userDoc.data()?.preferredLanguage || 'en';
      const texts = getNotificationText(preferredLanguage);

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: texts.title,
        body: texts.body(requestData.fromName),
        data: {
          type: 'friend_request',
          fromId: requestData.fromId,
          fromName: requestData.fromName,
          fromImage: requestData.fromImage,
          screen: 'Notifications' // Agregamos esta línea
        },
        image: 'https://firebasestorage.googleapis.com/v0/b/invite-me-32a07.appspot.com/o/FCMImages%2Fnuevo_logo.png?alt=media&token=1803b6b5-e77b-4b6e-81eb-9a978604ad6a'
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
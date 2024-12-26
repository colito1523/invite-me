
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const expo = new Expo();

exports.sendChatNotification = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const chatId = context.params.chatId;

    try {
      const chatDoc = await db.collection('chats').doc(chatId).get();
      const chatData = chatDoc.data();
      
      // Get sender data
      const senderDoc = await db.collection('users').doc(messageData.senderId).get();
      const senderData = senderDoc.data();
      
      // Get recipient (the user who didn't send the message)
      const recipientId = chatData.participants.find(id => id !== messageData.senderId);
      
      // Get recipient's push token
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      const expoPushToken = recipientDoc.data()?.expoPushToken;

      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) return;

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: `${senderData.firstName} ${senderData.lastName}`,
        body: messageData.text || 'Nuevo mensaje recibido',
        data: { 
          chatId, 
          messageId: snapshot.id,
          senderName: `${senderData.firstName} ${senderData.lastName}`,
          senderPhoto: senderData.photoUrls?.[0]
        },
        icon: senderData.photoUrls?.[0],
        channelId: 'chat-messages'
      };

      await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending chat notification:', error);
    }
  });

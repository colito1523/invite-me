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
      
      // Get recipient's push token and muted chats
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      const recipientData = recipientDoc.data();
      const expoPushToken = recipientData?.expoPushToken;
      const mutedChats = recipientData?.mutedChats || [];

      // Check if chat is muted and mute time hasn't expired
      const isChatMuted = mutedChats.some(mute => 
        mute.chatId === chatId && 
        mute.muteUntil.toDate() > new Date()
      );

      if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken) || isChatMuted) return;

      const getMessageBody = (lang, isImage) => {
        if (isImage) {
          return {
            'es': '📷 Imagen',
            'en': '📷 Image',
            'pt': '📷 Imagem'
          }[lang] || '📷 Image';
        }
        return {
          'es': 'Nuevo mensaje recibido',
          'en': 'New message received',
          'pt': 'Nova mensagem recebida'
        }[lang] || 'New message received';
      };

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: `${senderData.firstName} ${senderData.lastName}`,
        body: messageData.image ? getMessageBody(recipientData.preferredLanguage, true) : (messageData.text || getMessageBody(recipientData.preferredLanguage, false)),
        data: { 
          chatId, 
          messageId: snapshot.id,
          senderName: `${senderData.firstName} ${senderData.lastName}`,
          senderPhoto: senderData.photoUrls?.[0]
        },
        channelId: 'chat-messages'
      };

      await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending chat notification:', error);
    }
  });
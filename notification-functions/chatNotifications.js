const functions = require('firebase-functions/v1');
const admin = require('./firebaseAdmin'); // ⬅️ Cambio clave
const { Expo } = require('expo-server-sdk');

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

      const senderDoc = await db.collection('users').doc(messageData.senderId).get();
      const senderData = senderDoc.data();

      const recipientId = chatData.participants.find(id => id !== messageData.senderId);
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      const recipientData = recipientDoc.data();
      const tokens = recipientData?.expoPushTokens || [];
      const mutedChats = recipientData?.mutedChats || [];

      const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
      if (validTokens.length === 0) return;

      // Verificar si el chat está silenciado
      const isChatMuted = mutedChats.some(mute =>
        mute.chatId === chatId &&
        mute.muteUntil.toDate() > new Date()
      );
      if (isChatMuted) return;

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

      const lang = recipientData.preferredLanguage || 'en';
      const isImage = !!messageData.image;

      const bodyText = messageData.text || getMessageBody(lang, isImage);
      const senderName = `${senderData.firstName} ${senderData.lastName}`;

      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: senderName,
        body: bodyText,
        data: {
          chatId,
          messageId: snapshot.id,
          senderId: messageData.senderId,
          senderName,
          senderPhoto: senderData.photoUrls?.[0],
          screen: 'ChatUsers'
        },
        channelId: 'chat-messages',
        image: 'https://firebasestorage.googleapis.com/v0/b/invite-me-32a07.appspot.com/o/FCMImages%2Fnuevo_logo.png?alt=media&token=1803b6b5-e77b-4b6e-81eb-9a978604ad6a'
      }));

      await expo.sendPushNotificationsAsync(messages);
    } catch (error) {
      console.error('Error sending chat notification:', error);
    }
  });

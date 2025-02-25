const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { sendFriendRequestNotification } = require('./friendRequestNotifications');
const { sendLikeNotification } = require('./likeNotifications');
const { sendEventNotification } = require('./eventNotifications');
const { sendGeneralNotification } = require('./generalNotifications');
const { sendChatNotification } = require('./chatNotifications');

if (!admin.apps.length) {
    admin.initializeApp();
  }
  
  exports.sendFriendRequest = functions.https.onCall(sendFriendRequestNotification);
  exports.sendLike = functions.https.onCall(sendLikeNotification);
  exports.sendEvent = functions.https.onCall(sendEventNotification);
  exports.sendGeneral = functions.https.onCall(sendGeneralNotification);
  exports.sendChat = functions.https.onCall(sendChatNotification);
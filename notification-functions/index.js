const { sendFriendRequestNotification } = require('./friendRequestNotifications');
const { sendLikeNotification } = require('./likeNotifications');
const { sendEventNotification } = require('./eventNotifications');
const { sendGeneralNotification } = require('./generalNotifications');

exports.sendFriendRequestNotification = sendFriendRequestNotification;
exports.sendLikeNotification = sendLikeNotification;
exports.sendEventNotification = sendEventNotification;
exports.sendGeneralNotification = sendGeneralNotification;
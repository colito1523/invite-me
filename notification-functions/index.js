const { sendFriendRequestNotification } = require('./notifications-functions/friendRequestNotifications');
const { sendLikeNotification } = require('./notifications-functions/likeNotifications');
const { sendEventNotification } = require('./notifications-functions/eventNotifications');
const { sendGeneralNotification } = require('./notifications-functions/generalNotifications');

exports.sendFriendRequestNotification = sendFriendRequestNotification;
exports.sendLikeNotification = sendLikeNotification;
exports.sendEventNotification = sendEventNotification;
exports.sendGeneralNotification = sendGeneralNotification;

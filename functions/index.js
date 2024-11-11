const functions = require('firebase-functions'); // Esta línea ya la tienes
const admin = require('firebase-admin');
admin.initializeApp();

// Definir la función para enviar notificaciones push
exports.sendPushNotification = functions.firestore
    .document('messages/{messageId}') // Cambia 'messages' al nombre de tu colección en Firestore que quieras escuchar
    .onCreate(async (snapshot, context) => {
        const messageData = snapshot.data();

        // Obtenemos el token del destinatario del mensaje
        const recipientToken = messageData.token; // Asegúrate de que 'token' sea el campo donde guardas el expo push token del destinatario

        if (!recipientToken) {
            console.log('No se encontró un token para el destinatario.');
            return null;
        }

        // Configurar el mensaje de notificación
        const payload = {
            notification: {
                title: messageData.title || 'Nuevo mensaje',
                body: messageData.body || 'Tienes un nuevo mensaje',
                sound: 'default',
            },
            token: recipientToken,
        };

        try {
            // Enviar la notificación usando Firebase Admin
            await admin.messaging().send(payload);
            console.log('Notificación enviada exitosamente a:', recipientToken);
        } catch (error) {
            console.error('Error al enviar la notificación:', error);
        }

        return null;
    });

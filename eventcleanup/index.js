const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.deleteExpiredEvents = functions.runWith({
    timeoutSeconds: 540,
    memory: "2GB",
}).pubsub.schedule("0 * * * *").onRun(async (context) => {
    try {
        // Convertimos el timestamp actual a milisegundos
        const now = admin.firestore.Timestamp.now().toDate().getTime();

        // Procesar eventos en la colección "users"
        const usersSnapshot = await db.collection("users").get();
        for (const userDoc of usersSnapshot.docs) {
            const eventsRef = userDoc.ref.collection("events");
            const eventsSnapshot = await eventsRef.get();

            for (const eventDoc of eventsSnapshot.docs) {
                const eventData = eventDoc.data();
                const eventDate = eventData.day ? new Date(eventData.day.split('/').reverse().join('-')) : null;

                let dynamicEventDate = null;
                if (eventData.date) {
                    const currentYear = new Date().getFullYear();
                    const currentDate = new Date();
                    const eventWithoutYear = new Date(`${eventData.date} ${currentYear}`);

                    if (eventWithoutYear < currentDate) {
                        dynamicEventDate = new Date(`${eventData.date} ${currentYear + 1}`).getTime();
                    } else {
                        dynamicEventDate = eventWithoutYear.getTime();
                    }
                }

                // 🔴 Aquí estaba el error: Se debe usar .toDate().getTime() en expirationDate
                if (
                    (eventData.expirationDate && eventData.expirationDate.toDate().getTime() < now) || 
                    (eventDate && eventDate.getTime() < now) ||
                    (dynamicEventDate && dynamicEventDate < now)
                ) {
                    await eventDoc.ref.delete();
                }
            }

            // Procesar notificaciones en la subcolección "notifications"
            const notificationsRef = userDoc.ref.collection("notifications");
            const notificationsSnapshot = await notificationsRef.get();

            for (const notificationDoc of notificationsSnapshot.docs) {
                const notificationData = notificationDoc.data();
                const notificationDate = notificationData.expirationDate;

                // 🔴 También corregimos el uso de expirationDate en notificaciones
                if (notificationDate && notificationDate.toDate().getTime() < now) {
                    await notificationDoc.ref.delete();
                }
            }
        }

        // Procesar eventos en la colección "EventsPriv"
        const eventsPrivSnapshot = await db.collection("EventsPriv").get();
        for (const eventDoc of eventsPrivSnapshot.docs) {
            const eventData = eventDoc.data();
            const eventDate = eventData.day ? new Date(eventData.day.split('/').reverse().join('-')) : null;

            if (
                (eventData.expirationDate && eventData.expirationDate.toDate().getTime() < now) ||
                (eventDate && eventDate.getTime() < now)
            ) {
                await eventDoc.ref.delete();
            }
        }

        return null;
    } catch (error) {
        console.error("Error al eliminar eventos y notificaciones expirados:", error);
        return null;
    }
});

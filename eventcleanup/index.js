const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.deleteExpiredEvents = functions.runWith({
    timeoutSeconds: 540,
    memory: "2GB",
}).pubsub.schedule("every 1 minutes").onRun(async (context) => {
    try {
        const now = admin.firestore.Timestamp.now();

        // Procesar eventos en la colección "users"
        const usersSnapshot = await db.collection("users").get();
        for (const userDoc of usersSnapshot.docs) {
            const eventsRef = userDoc.ref.collection("events");
            const eventsSnapshot = await eventsRef.get();

            for (const eventDoc of eventsSnapshot.docs) {
                const eventData = eventDoc.data();
                const eventDate = eventData.day ? new Date(eventData.day.split('/').reverse().join('-')) : null;

                // Manejo dinámico del año para el campo 'date'
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

                // Depuración
                console.log(`Procesando evento: ${eventDoc.id}`);
                console.log(`date: ${eventData.date}, dynamicEventDate: ${dynamicEventDate}`);
                console.log(`expirationDate: ${eventData.expirationDate}`);
                console.log(`day: ${eventData.day}`);

                if (
                    (eventData.expirationDate && eventData.expirationDate.toMillis() < now.toMillis()) ||
                    (eventDate && eventDate.getTime() < now.getTime()) ||
                    (dynamicEventDate && dynamicEventDate < now.toMillis())
                ) {
                    await eventDoc.ref.delete();
                    console.log(`Evento eliminado (usuarios): ${eventDoc.id}`);
                } else {
                    console.log(`Evento NO eliminado: ${eventDoc.id}`);
                }
            }

            // Procesar notificaciones en la subcolección "notifications"
            const notificationsRef = userDoc.ref.collection("notifications");
            const notificationsSnapshot = await notificationsRef.get();

            for (const notificationDoc of notificationsSnapshot.docs) {
                const notificationData = notificationDoc.data();
                const notificationDate = notificationData.expirationDate;

                console.log(`Procesando notificación: ${notificationDoc.id}`);
                console.log(`expirationDate: ${notificationDate}`);

                if (notificationDate && notificationDate.toMillis() < now.toMillis()) {
                    await notificationDoc.ref.delete();
                    console.log(`Notificación eliminada: ${notificationDoc.id}`);
                } else {
                    console.log(`Notificación NO eliminada: ${notificationDoc.id}`);
                }
            }
        }

        // Procesar eventos en la colección "EventsPriv"
        const eventsPrivSnapshot = await db.collection("EventsPriv").get();
        for (const eventDoc of eventsPrivSnapshot.docs) {
            const eventData = eventDoc.data();
            const eventDate = eventData.day ? new Date(eventData.day.split('/').reverse().join('-')) : null;

            console.log(`Procesando evento (EventsPriv): ${eventDoc.id}`);
            console.log(`expirationDate: ${eventData.expirationDate}`);
            console.log(`day: ${eventData.day}`);

            if (
                (eventData.expirationDate && eventData.expirationDate.toMillis() < now.toMillis()) ||
                (eventDate && eventDate.getTime() < now.getTime())
            ) {
                await eventDoc.ref.delete();
                console.log(`Evento eliminado (EventsPriv): ${eventDoc.id}`);
            } else {
                console.log(`Evento NO eliminado (EventsPriv): ${eventDoc.id}`);
            }
        }

        console.log("Eliminación de eventos y notificaciones expirados completada.");
        return null;
    } catch (error) {
        console.error("Error al eliminar eventos y notificaciones expirados:", error);
        return null;
    }
});

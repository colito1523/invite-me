
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.deleteExpiredEvents = functions.runWith({
  timeoutSeconds: 540,
  memory: "2GB",
}).pubsub.schedule("every 24 hours").onRun(async (context) => {
  try {
    const now = admin.firestore.Timestamp.now();
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const eventsRef = userDoc.ref.collection("events");
      const eventsSnapshot = await eventsRef.get();

      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        if (eventData.expirationDate && eventData.expirationDate.toMillis() < now.toMillis()) {
          await eventDoc.ref.delete();
          console.log(`Evento eliminado: ${eventDoc.id}`);
        }
      }
    }

    console.log("Eliminación de eventos expirados completada.");
    return null;
  } catch (error) {
    console.error("Error al eliminar eventos expirados:", error);
    return null;
  }
});

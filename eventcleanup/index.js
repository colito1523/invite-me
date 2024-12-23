// Importar Firebase Admin SDK
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializar la aplicación de Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Función programada para eliminar eventos expirados
exports.deleteExpiredEvents = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  try {
    const now = admin.firestore.Timestamp.now();

    // Referencia a la colección principal de usuarios
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const eventsRef = userDoc.ref.collection("events");
      const eventsSnapshot = await eventsRef.get();

      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();

        // Comprobar si el evento tiene la clave expirationDate
        if (eventData.expirationDate && eventData.expirationDate.toMillis() < now.toMillis()) {
          // Eliminar el evento si está expirado
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

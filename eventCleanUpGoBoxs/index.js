// eventCleanUpGoBoxs/index.js
const functions = require("firebase-functions/v1");
const admin = require("./firebaseAdmin");
const db = admin.firestore();

exports.deleteExpiredGoBoxEvents = functions.runWith({
  timeoutSeconds: 540,
  memory: "2GB",
}).pubsub.schedule("0 6 * * *").onRun(async () => {
  try {
    const now = new Date();
    const today = now.toLocaleDateString("en-GB", { day: '2-digit', month: 'short' });

    const goboxsSnapshot = await db.collection("GoBoxs").get();

    for (const doc of goboxsSnapshot.docs) {
      const goboxData = doc.data();

      // Recorremos todas las fechas dentro del documento (ej: "8 Apr")
      for (const dateKey of Object.keys(goboxData)) {
        // Convertimos la fecha del documento a formato Date
        const eventDate = new Date(`${dateKey} ${now.getFullYear()}`);
        const expirationDate = new Date(eventDate.getTime());
        expirationDate.setDate(expirationDate.getDate() + 1);
        expirationDate.setHours(6, 0, 0, 0); // 6 AM del día siguiente

        if (now.getTime() > expirationDate.getTime()) {
          console.log(`Eliminando evento del GoBox "${doc.id}" para la fecha ${dateKey}`);

          const updateData = { ...goboxData };
          delete updateData[dateKey];

          await doc.ref.set(updateData);
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error al eliminar eventos expirados de GoBoxs:", error);
    return null;
  }
});

const functions = require("firebase-functions");
const admin = require('./firebaseAdmin'); // ⬅️ Cambio clave

const db = admin.firestore();

const normalizeText = (text) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const generatePrefixes = (text) => {
  const normalized = normalizeText(text);
  const prefixes = [];
  for (let i = 1; i <= normalized.length; i++) {
    prefixes.push(normalized.substring(0, i));
  }
  return prefixes;
};

// 🚀 Función manual para actualizar usuarios existentes
exports.addSearchIndexToAllUsers = functions.https.onRequest(async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const batch = db.batch();
    let updatedCount = 0;

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const username = data.username || "";
      const firstName = data.firstName || "";
      const lastName = data.lastName || "";
      const currentIndex = data.searchIndex || [];

      if (currentIndex.length > 0) return; // Ya tiene searchIndex

      const searchIndex = [
        ...generatePrefixes(username),
        ...generatePrefixes(firstName),
        ...generatePrefixes(lastName),
      ];

      batch.update(doc.ref, { searchIndex });
      updatedCount++;
    });

    await batch.commit();

    res.send(`✅ ${updatedCount} usuarios actualizados con searchIndex.`);
  } catch (error) {
    console.error("❌ Error al actualizar usuarios:", error);
    res.status(500).send("Error al actualizar usuarios.");
  }
});

// 🚀 Función automática para nuevos usuarios
exports.addSearchIndexToUser = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const username = data.username || "";
    const firstName = data.firstName || "";
    const lastName = data.lastName || "";

    const searchIndex = [
      ...generatePrefixes(username),
      ...generatePrefixes(firstName),
      ...generatePrefixes(lastName),
    ];

    try {
      await snap.ref.update({ searchIndex });
      console.log(`✅ searchIndex generado para ${context.params.userId}`);
    } catch (error) {
      console.error("❌ Error generando searchIndex:", error);
    }
  });


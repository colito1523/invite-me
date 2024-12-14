const functions = require('firebase-functions');
const admin = require('firebase-admin');
const moment = require('moment');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.deleteExpiredEvents = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const usersRef = db.collection('users');

    try {
      const usersSnapshot = await usersRef.get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const eventsRef = usersRef.doc(userId).collection('events');
        const eventsSnapshot = await eventsRef.get();

        for (const eventDoc of eventsSnapshot.docs) {
          const eventId = eventDoc.id;
          const eventData = eventDoc.data();

          let expirationDate;

          // Determinar la fecha de expiración
          if (eventData.expirationDate) {
            expirationDate = moment(eventData.expirationDate);
          } else if (eventData.dateArray && eventData.dateArray[0]) {
            expirationDate = moment(eventData.dateArray[0], 'D MMM');
          } else if (eventData.day) {
            expirationDate = moment(eventData.day, 'D/MM/YYYY');
          } else {
            console.log(`Evento ${eventId} no tiene una fecha válida.`);
            continue;
          }

          // Verificar si el evento ha expirado
          if (moment().isAfter(expirationDate)) {
            console.log(`Eliminando evento: ${eventId}`);
            await eventsRef.doc(eventId).delete();
          }
        }
      }
      console.log('Eliminación completada.');
      return null;
    } catch (error) {
      console.error('Error al eliminar eventos:', error);
      return null;
    }
  });
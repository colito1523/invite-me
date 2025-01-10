import { initializeApp } from 'firebase/app';
import { getCrashlytics, log } from 'firebase/crashlytics';

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
};

const app = initializeApp(firebaseConfig);
const crashlytics = getCrashlytics(app);

// Opcional: log para verificar que Crashlytics está activo
log(crashlytics, 'Crashlytics configurado correctamente');

export { app, crashlytics };

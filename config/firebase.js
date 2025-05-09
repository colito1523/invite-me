import { initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import Constants from "expo-constants";

const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.apiKey,
  authDomain: Constants.expoConfig.extra.authDomain,
  projectId: Constants.expoConfig.extra.projectId,
  storageBucket: Constants.expoConfig.extra.storageBucket,
  messagingSenderId: Constants.expoConfig.extra.messagingSenderId,
  appId: Constants.expoConfig.extra.appId,
  databaseURL: Constants.expoConfig.extra.databaseURL,
};

const app = initializeApp(firebaseConfig);

// ✅ Usa initializeAuth SOLO una vez
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const database = getFirestore(app);
const storage = getStorage(app);

export { auth, database, storage };

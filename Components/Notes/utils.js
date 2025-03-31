import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from "firebase/firestore";
import { database } from "../../config/firebase"; // ajustá la ruta si es necesario

export const getLoggedInUserData = async (uid) => {
  try {
    const userRef = doc(database, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return null;
  }
};


export const saveUserNoteToCache = async (note) => {
  try {
    await AsyncStorage.setItem('@cached_user_note', JSON.stringify(note));
  } catch (error) {
    console.error("Error saving user note to cache:", error);
  }
};

export const getUserNoteFromCache = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@cached_user_note');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error("Error getting user note from cache:", error);
    return null;
  }
};

export const saveFriendsNotesToCache = async (notes) => {
  try {
    await AsyncStorage.setItem('@cached_friends_notes', JSON.stringify(notes));
  } catch (error) {
    console.error("Error saving friends notes to cache:", error);
  }
};

export const getFriendsNotesFromCache = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@cached_friends_notes');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error("Error getting friends notes from cache:", error);
    return [];
  }
};

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

export const uploadMedia = async (uri, user) => {
  if (!uri) return null;
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `media/${user.uid}/${new Date().getTime()}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error al subir el archivo:", error);
    return null;
  }
};

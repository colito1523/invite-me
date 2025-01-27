// Archivo: loadExistingStories.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, database, storage } from "../../../config/firebase";
import { Alert, Image } from "react-native";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Función para obtener la lista de amigos
const getFriendsList = async (userId) => {
  const friendsRef = collection(database, "users", userId, "friends");
  const friendsSnapshot = await getDocs(friendsRef);
  return friendsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

const validateStory = async (story) => {
  try {
    const response = await fetch(story.storyUrl);
    return response.ok; // Devuelve true si la URL es accesible
  } catch {
    return false; // Maneja errores de conexión o URLs inválidas
  }
};


// Función para cargar historias existentes
export const loadExistingStories = async (
  t,
  setStories,
  setUnseenStories,
  isUploading
) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Carga del caché si existe
    const cachedStoriesString = await AsyncStorage.getItem("cachedStories");
    let cachedStories = null;
    if (cachedStoriesString) {
      cachedStories = JSON.parse(cachedStoriesString);
      setStories(cachedStories);
    }

    const userDoc = await getDoc(doc(database, "users", user.uid));
    const userData = userDoc.data();
    const hiddenStories = userData.hiddenStories || [];
    const hideStoriesFrom = userData.hideStoriesFrom || [];
    const blockedUsers = userData.blockedUsers || [];

    const friendsList = await getFriendsList(user.uid);
    const loadedStories = [];
    const unseenStoriesTemp = {};
    const now = new Date();

    // Cargar historias propias
    const userStoriesRef = collection(database, "users", user.uid, "stories");
    const userStoriesSnapshot = await getDocs(userStoriesRef);
    const userStories = userStoriesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((story) => new Date(story.expiresAt.toDate()) > now);

    if (userStories.length > 0 || isUploading) {
      loadedStories.unshift({
        uid: user.uid,
        username: userData.firstName || t("storySlider.currentUser"),
        lastName: userData.lastName || "",
        profileImage:
          userData.photoUrls?.[0] || "https://via.placeholder.com/150",
        userStories: userStories,
      });

      unseenStoriesTemp[user.uid] = userStories.filter(
        (story) =>
          !story.viewers?.some(
            (viewer) => viewer.uid === auth.currentUser.uid
          )
      );
    }

    // Cargar historias de amigos
    for (let friend of friendsList) {
      if (
        hiddenStories.includes(friend.friendId) ||
        hideStoriesFrom.includes(friend.friendId) ||
        blockedUsers.includes(friend.friendId)
      ) {
        continue;
      }

      const friendStoriesRef = collection(
        database,
        "users",
        friend.friendId,
        "stories"
      );
      const friendStoriesSnapshot = await getDocs(friendStoriesRef);
      const friendStories = friendStoriesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((story) => new Date(story.expiresAt.toDate()) > now);

      if (friendStories.length > 0) {
        const friendDocRef = doc(database, "users", friend.friendId);
        const friendDoc = await getDoc(friendDocRef);

        if (friendDoc.exists()) {
          const friendData = friendDoc.data();

          unseenStoriesTemp[friend.friendId] = friendStories.filter(
            (story) =>
              !story.viewers?.some(
                (viewer) => viewer.uid === auth.currentUser.uid
              )
          );

          loadedStories.push({
            uid: friend.friendId,
            username: friendData.firstName || t("storySlider.friend"),
            lastName: friendData.lastName || "",
            profileImage:
              friendData.photoUrls?.[0] || "https://via.placeholder.com/150",
            userStories: friendStories,
          });
        }
      }
    }

    // Filtrar y validar historias
    const validateStory = async (story) => {
      try {
        const response = await fetch(story.storyUrl);
        return response.ok;
      } catch {
        return false;
      }
    };

    const validStories = await Promise.all(
      loadedStories.map(async (story) => {
        const isValid = await validateStory(story.userStories[0]);
        return isValid ? story : null;
      })
    ).then((results) => results.filter(Boolean)); // Filtra historias válidas

    // Ordenar las historias según el criterio especificado
    const sortedStories = validStories.sort((a, b) => {
      // Si es nuestra historia, va primero
      if (a.uid === user.uid) return -1;
      if (b.uid === user.uid) return 1;

      // Después las historias no vistas
      const aHasUnseen = unseenStoriesTemp[a.uid]?.length > 0;
      const bHasUnseen = unseenStoriesTemp[b.uid]?.length > 0;

      if (aHasUnseen && !bHasUnseen) return -1;
      if (!aHasUnseen && bHasUnseen) return 1;

      // Por último las historias ya vistas
      return 0;
    });

    // Actualizar caché y estado
    await AsyncStorage.setItem("cachedStories", JSON.stringify(sortedStories));
    setStories(sortedStories);
    setUnseenStories(unseenStoriesTemp);
  } catch (error) {
    console.error(t("storySlider.loadStoriesError"), error);
  }
};


export const uploadStory = async (
  imageUri,
  t,
  setIsUploading,
  setUploadProgress,
  setStories,
  setUnseenStories
) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(t("storySlider.error"), t("storySlider.userAuthError"));
      return;
    }

    const userDocRef = doc(database, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      Alert.alert(t("storySlider.error"), t("storySlider.userDataNotFound"));
      return;
    }

    const userData = userDoc.data();
    const username = userData.firstName || t("storySlider.unknownUser");
    const profileImage = userData.photoUrls?.[0] || "default-image-url";

    const storyId = Date.now().toString();
    const storyRef = storageRef(storage, `historias/${user.uid}/${storyId}`);
    const response = await fetch(imageUri);
    const blob = await response.blob();

    setIsUploading(true);
    setUploadProgress(0);

    const uploadTask = uploadBytesResumable(storyRef, blob);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error(t("storySlider.uploadError"), error);
        Alert.alert(t("storySlider.error"), t("storySlider.storyUploadError"));
        setIsUploading(false);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        const storiesRef = collection(database, "users", user.uid, "stories");
        const timestamp = serverTimestamp();
        const newStory = {
          uid: user.uid,
          username: username,
          profileImage: profileImage,
          storyUrl: downloadUrl,
          createdAt: timestamp,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          id: storyId,
          viewers: [],
          likes: []
        };

        await setDoc(doc(storiesRef, storyId), newStory);

        loadExistingStories(t, setStories, setUnseenStories, false);
        setIsUploading(false);
      }
    );
  } catch (error) {
    console.error(t("storySlider.uploadError"), error);
    Alert.alert(t("storySlider.error"), t("storySlider.storyUploadError"));
    setIsUploading(false);
  }
};

export const compressImage = async (uri, quality = 0.6, width = 1080) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error("Error al comprimir la imagen:", error);
      throw error;
    }
  };
  
  export const loadStoriesInBatches = async (stories, batchSize = 3) => {
    try {
      const storyBatches = [];
      for (let i = 0; i < stories.length; i += batchSize) {
        const batch = stories.slice(i, i + batchSize);
        const validBatch = await Promise.all(
          batch.map(async (story) => {
            const isValid = await validateStory(story.userStories[0]);
            return isValid ? story : null;
          })
        );
        storyBatches.push(validBatch.filter(Boolean)); // Solo historias válidas
      }
      return storyBatches.flat(); // Devuelve una lista plana de historias válidas
    } catch (error) {
      console.error("Error al cargar historias en lotes:", error);
      return [];
    }
  };

export const openCustomCamera = async (navigation) => {
  navigation.navigate("CustomCamera");
};
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { auth, database } from "../../config/firebase";
import { Alert } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localEventImages } from "../../src/constants/localEventImages"; // o la ruta que uses


export const compressImage = async (uri, isLowQuality = false) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: isLowQuality ? 50 : 1080 } }], // 50px para ultra baja calidad, 1080px para normal
        { compress: isLowQuality ? 0.2 : 0.6, format: ImageManipulator.SaveFormat.JPEG } // 20% de calidad para ultra baja
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error("Error al comprimir la imagen:", error);
      return uri;
    }
  };

export const fetchUserData = async (params) => {
    const setBlockedUsers = params.setBlockedUsers
    const setUserData = params.setUserData

    try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(database, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();

            // Otros estados relevantes
            setBlockedUsers(data.blockedUsers || []); // Asegúrate de que blockedUsers se actualice
            setUserData(data);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
};

export const setFetchUserData = async (params) => {
    const { 
      setName, setSurname, setIsPrivate, setPhotoUrls, setUsername, 
      setFriendCount, setFirstInterest, setSecondInterest, setThirdInterest, setFourthInterest 
    } = params;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const [userDoc, friendsSnapshot] = await Promise.all([
        getDoc(doc(database, "users", user.uid)),
        getDocs(collection(database, "users", user.uid, "friends"))
      ]);

      if (userDoc.exists()) {
        const data = userDoc.data();

        // Agrupar estados en un solo `setState`
        setName(data.firstName || "");
        setSurname(data.lastName || "");
        setIsPrivate(data.isPrivate || false);
        setPhotoUrls(data.photoUrls || []);
        setUsername(data.username || "");
        setFriendCount(friendsSnapshot.size);
        setFirstInterest(data.firstInterest || "");
        setSecondInterest(data.secondInterest || "");
        setThirdInterest(data.thirdInterest || "");
        setFourthInterest(data.fourthInterest || "");
      }
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
    }
  };



export const handleTogglePrivacy = async (params) => {
    const isPrivate = params.isPrivate
    const setIsPrivate = params.setIsPrivate
    const t = params.t

    const user = auth.currentUser;
    if (user) {
        try {
            const newPrivacyState = !isPrivate;
            await updateDoc(doc(database, "users", user.uid), {
                isPrivate: newPrivacyState,
            });
            setIsPrivate(newPrivacyState);
            Alert.alert(
                t("profile.privacyChangeSuccess"),
                t("profile.privacyChangeMessage", {
                    state: newPrivacyState ? t("profile.private") : t("profile.public"),
                })
            );
        } catch (error) {
            console.error("Error updating privacy state:", error);
            Alert.alert(t("profile.error"), t("profile.privacyUpdateError"));
        }
    }
};

export const handleHeartPress = async (params) => {
    const isHearted = params.isHearted
    const heartCount = params.heartCount
    const setIsHearted = params.setIsHearted
    const setHeartCount = params.setHeartCount

    const user = auth.currentUser;
    if (!user) return;

    // Actualización optimista del estado local
    const newIsHearted = !isHearted;
    const newHeartCount = isHearted ? heartCount - 1 : heartCount + 1;
    setIsHearted(newIsHearted);
    setHeartCount(newHeartCount);

    try {
        const likesRef = collection(database, "users", user.uid, "likes");
        const likeQuery = query(likesRef, where("userId", "==", user.uid));
        const likeSnapshot = await getDocs(likeQuery);

        const batch = writeBatch(database);

        if (likeSnapshot.empty) {
            // Añadir un nuevo "like"
            const userDoc = await getDoc(doc(database, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const profileImage =
                    userData.photoUrls && userData.photoUrls.length > 0
                        ? userData.photoUrls[0]
                        : "https://via.placeholder.com/150";

                // Añadir "like" al usuario
                const newLikeRef = doc(collection(database, "users", user.uid, "likes"));
                batch.set(newLikeRef, {
                    userId: user.uid,
                    username: userData.username || "Usuario",
                    profileImage,
                    likedAt: serverTimestamp(),
                });

                // Actualizar contador de "likes"
                const userRef = doc(database, "users", user.uid);
                batch.update(userRef, {
                    likeCount: newHeartCount,
                });
            }
        } else {
            // Eliminar "like" existente
            const likeDoc = likeSnapshot.docs[0];

            // Eliminar el "like"
            batch.delete(doc(database, "users", user.uid, "likes", likeDoc.id));

            // Actualizar contador de "likes"
            const userRef = doc(database, "users", user.uid);
            batch.update(userRef, {
                likeCount: newHeartCount,
            });
        }

        await batch.commit();
    } catch (error) {
        console.error("Error handling heart press:", error);

        // Revertir el estado local si ocurre un error
        setIsHearted(!newIsHearted);
        setHeartCount(isHearted ? heartCount + 1 : heartCount - 1);

        Alert.alert("Error", "Ocurrió un error al procesar tu acción. Intenta de nuevo.");
    }
};

export const checkLikeStatus = async (params) => {
    const setIsHearted = params.setIsHearted

    try {
        const user = auth.currentUser;
        if (user) {
            const likesRef = collection(database, "users", user.uid, "likes");
            const likeQuery = query(likesRef, where("userId", "==", user.uid));
            const likeSnapshot = await getDocs(likeQuery);

            if (!likeSnapshot.empty) {
                setIsHearted(true);
            } else {
                setIsHearted(false);
            }
        }
    } catch (error) {
        console.error("Error verificando el estado del like:", error);
    }
};

export const fetchHeartCount = async (params) => {
    const setHeartCount = params.setHeartCount

    try {
        const user = auth.currentUser;
        if (user) {
            const likesRef = collection(database, "users", user.uid, "likes");
            const likeSnapshot = await getDocs(likesRef);
            setHeartCount(likeSnapshot.size);
        }
    } catch (error) {
        console.error("Error obteniendo la cantidad de likes:", error);
    }
};

export const pickImage = async (index, ImagePicker, photoUrls, setPhotoUrls, setLowQualityProfileImage) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Se necesita acceso a la galería para subir fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const compressedUri = await compressImage(result.assets[0].uri, false); // Compresión normal
      const newPhotoUrls = [...photoUrls];
      newPhotoUrls[index] = compressedUri;
      setPhotoUrls(newPhotoUrls);

      // Si es la primera imagen, también crear versión en ultra baja calidad
      if (index === 0) {
        const lowQualityUri = await compressImage(result.assets[0].uri, true);
        setLowQualityProfileImage(lowQualityUri);
      }
    }
  };



  export const handleBoxPress = ({ event, navigation, t }) => {
    const isPrivateEvent = event.category === "EventoParaAmigos";
  
    const image =
      isPrivateEvent
        ? event.imageUrl // una URL de Firebase
        : localEventImages[event.imageUrl] ;
  
    const box = {
      ...event,
      imageUrl: image,
      category: event.category || "General",
      title: event.title || t("profile.noTitle"),
      dateArray: event.dateArray || [],
      hours: event.hours || {},
      phoneNumber: event.phoneNumber || t("profile.noNumber"),
      locationLink: event.locationLink || t("profile.noLocation"),
      coordinates: event.coordinates || { latitude: 0, longitude: 0 },
      description: event.description || "",
      details: event.details || "",
      isPrivate: isPrivateEvent,
    };
  
    navigation.navigate("BoxDetails", {
      box,
      collectionType: isPrivateEvent ? "EventsPriv" : "GoBoxs",
      selectedDate: event.date || t("profile.noDate"),
    });
  };
  

export const fetchProfileImage = async ({setProfileImage}) => {
    const user = auth.currentUser;
    if (user) {
      try {
        // Primero intentar cargar desde el caché
        const cachedImage = await AsyncStorage.getItem(`profileImage_${user.uid}`);
        if (cachedImage) {
          setProfileImage(cachedImage);
          return; // Si hay imagen en caché, no continuar
        }

        // Luego obtener la imagen de baja calidad
        const userDoc = await getDoc(doc(database, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.lowQualityProfileImage) {
            setProfileImage(data.lowQualityProfileImage);
            return; // Si hay imagen de baja calidad, no continuar
          }

          // Finalmente cargar la imagen de alta calidad
          if (data.photoUrls && data.photoUrls.length > 0) {
            const highQualityImage = data.photoUrls[0];
            setProfileImage(highQualityImage);
            // Actualizar el caché
            await AsyncStorage.setItem(`profileImage_${user.uid}`, highQualityImage);
          }
        }
      } catch (error) {
        console.error("Error loading profile image:", error);
      }
    }
};
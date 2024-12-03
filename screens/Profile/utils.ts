import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { auth, database } from "../../config/firebase";
import { Alert } from "react-native";


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
    const setName = params.setName
    const setSurname = params.setSurname
    const setIsPrivate = params.setIsPrivate
    const setPhotoUrls = params.setPhotoUrls
    const setUsername = params.setUsername
    const setFriendCount = params.setFriendCount
    const setFirstHobby = params.setFirstHobby
    const setSecondHobby = params.setSecondHobby
    const setRelationshipStatus = params.setRelationshipStatus
    const setFirstInterest = params.setFirstInterest
    const setSecondInterest = params.setSecondInterest

    const user = auth.currentUser;
    if (user) {
        const userDoc = await getDoc(doc(database, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            setName(data.firstName || "");
            setSurname(data.lastName || "");
            setIsPrivate(data.isPrivate || false);
            if (data.photoUrls && data.photoUrls.length > 0) {
                setPhotoUrls(data.photoUrls);
            }
            if (data.username) setUsername(data.username);
            const friendsSnapshot = await getDocs(
                collection(database, "users", user.uid, "friends")
            );
            setFriendCount(friendsSnapshot.size);
            setFirstHobby(data.firstHobby || "");
            setSecondHobby(data.secondHobby || "");
            setRelationshipStatus(data.relationshipStatus || "");
            setFirstInterest(data.firstInterest || "");
            setSecondInterest(data.secondInterest || "");
        }
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

export const fetchFriendCount = async (params) => {
    const setFriendCount = params.setFriendCount

    console.log("fetchFriendCount running");
    try {
        const user = auth.currentUser;
        if (user) {
            const friendsSnapshot = await getDocs(
                collection(database, "users", user.uid, "friends")
            );
            console.log("Number of friends:", friendsSnapshot.size);
            setFriendCount(friendsSnapshot.size);
        } else {
            console.log("No user is currently signed in");
        }
    } catch (error) {
        console.error("Error fetching friend count:", error);
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

export const pickImage = async (index, ImagePicker, photoUrls, setPhotoUrls) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
        Alert.alert(
            "Permiso denegado",
            "Se necesita acceso a la galería para subir fotos."
        );
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
    });

    if (!result.canceled) {
        const newPhotoUrls = [...photoUrls];
        newPhotoUrls[index] = result.assets[0].uri;
        setPhotoUrls(newPhotoUrls);
        console.log("Nueva URL de imagen:", result.assets[0].uri);
    }
};

export const handleBoxPress = ({ event, navigation, t }) => {
    const isPrivateEvent = event.category === "EventoParaAmigos";
  
    // Definir el objeto `box` dependiendo del tipo de evento
    const box = isPrivateEvent
      ? event
      : {
          category: event.category || "General",
          title: event.title || t("profile.noTitle"),
          imageUrl: event.imageUrl || "https://via.placeholder.com/150",
          dateArray: event.dateArray || [],
          hours: event.hours || {},
          phoneNumber: event.phoneNumber || t("profile.noNumber"),
          locationLink: event.locationLink || t("profile.noLocation"),
          coordinates: event.coordinates || { latitude: 0, longitude: 0 },
          description: event.description || t("profile.noDescription"),
      
        };
  
    // Navegar al componente `BoxDetails`
    navigation.navigate("BoxDetails", {
      box: box,
      collectionType: isPrivateEvent ? "EventsPriv" : "GoBoxs",
      selectedDate: event.date || t("profile.noDate"),
    });
  };
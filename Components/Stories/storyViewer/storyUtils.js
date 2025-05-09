import { PanResponder, Alert, Image, Platform } from "react-native";
import { Image as ExpoImage } from "expo-image";
import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  addDoc,
  collection,
  deleteDoc,
  query,
  getDocs,
  where,
  setDoc,
} from "firebase/firestore";
import { useEffect } from "react";
import { ref, deleteObject} from "firebase/storage";
import { database } from "../../../config/firebase";
import { logInfo, } from "./logger"; // ajustá el path si es necesario



export const createStoryPanResponder = ({
  handleCloseViewer,
  handleOpenViewersModal,
  handleNextUser,
  handlePreviousUser,
  isCurrentUserStory,
}) => {
  const swipeThreshold = 0; // Umbral de distancia (menor valor = más sensible)
  const velocityThreshold = 0; // Umbral de velocidad (menor valor = más sensible)

  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 0;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Aquí puedes añadir lógica de previsualización si es necesario
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
        // Gesto horizontal
        if (
          gestureState.dx > swipeThreshold ||
          gestureState.vx > velocityThreshold
        ) {
          handlePreviousUser(); // Deslizar a la derecha
        } else if (
          gestureState.dx < -swipeThreshold ||
          gestureState.vx < -velocityThreshold
        ) {
          handleNextUser(); // Deslizar a la izquierda
        }
      } else {
        // Gesto vertical
        if (gestureState.dy > swipeThreshold) {
          handleCloseViewer(); // Deslizar hacia abajo
        } else if (gestureState.dy < -swipeThreshold && isCurrentUserStory) {
          handleOpenViewersModal(); // Deslizar hacia arriba
        }
      }
    },
  });
};

export const fetchLoggedInUserData = async (user) => {
  try {
    const userRef = doc(database, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);
  }
  return null;
};

export const handleNextUser = ({
  currentIndex,
  setCurrentIndex,
  setStoryIndex,
  setProgress,
  stories,
  onClose,
  localUnseenStories,
}) => {
  if (currentIndex < stories.length - 1) {
    setCurrentIndex((prev) => prev + 1);
    setStoryIndex(0); // Reinicia al primer índice de la siguiente historia
    setProgress(0);
  } else {
    onClose(localUnseenStories); // Cierra si no hay más usuarios
  }
};

export const handlePreviousUser = ({
  currentIndex,
  setCurrentIndex,
  setStoryIndex,
  setProgress,
}) => {
  if (currentIndex > 0) {
    setCurrentIndex((prev) => prev - 1);
    setStoryIndex(0);
    setProgress(0);
  }
};

export const handleLikeStory = async ({
  auth,
  stories,
  currentIndex,
  storyIndex,
  likedStories,
  setLikedStories,
  database,
  t,
}) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const currentStory = stories[currentIndex]?.userStories[storyIndex];
    if (!currentStory) return;

    const storyRef = doc(
      database,
      "users",
      currentStory.uid,
      "stories",
      currentStory.id,
    );

    const userRef = doc(database, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const hasLiked = likedStories[currentStory?.id];

    if (hasLiked) {
      // Eliminar el like
      const storySnap = await getDoc(storyRef);
      const storyData = storySnap.data();

      if (storyData?.likes) {
        const updatedLikes = storyData.likes.filter(
          (like) => like.uid !== currentUser.uid,
        );
        await updateDoc(storyRef, { likes: updatedLikes });
      }
      setLikedStories((prev) => ({ ...prev, [currentStory.id]: false }));
    } else {
      // Agregar el like
      const likeData = {
        uid: currentUser.uid,
        firstName: userData.firstName || "Usuario",
        lastName: userData.lastName || "",
        profileImage: userData.photoUrls?.[0] || "default-image-url",
        timestamp: new Date(),
      };

      await updateDoc(storyRef, {
        likes: arrayUnion(likeData),
      });

      // Enviar notificación al propietario de la historia
      const notificationRef = collection(
        database,
        "users",
        currentStory.uid,
        "notifications",
      );

      await addDoc(notificationRef, {
        type: "storyLike",
        fromId: currentUser.uid,
        fromName: `${userData.username} `.trim(),
        fromImage: userData.photoUrls?.[0] || "default-image-url",
        storyId: currentStory.id,
        timestamp: new Date(),
        seen: false, // Marcamos la notificación como no vista
      });

      setLikedStories((prev) => ({ ...prev, [currentStory.id]: true }));
    }
  } catch (error) {
    console.error("Error al gestionar el like:", error);
    Alert.alert(t("storyViewer.error"), t("storyViewer.errorLike"));
  }
};

export const deleteStory = async ({
  auth,
  stories,
  currentIndex,
  storyIndex,
  setStories,
  onClose,
  database,
  storage,
  t,
}) => {
  try {
    if (!auth || !auth.currentUser) {
      console.error("No auth or user available");
      Alert.alert(t("storyViewer.error"), t("storyViewer.dontAuthentication"));
      return;
    }

    const user = auth.currentUser;
    const currentStory = stories[currentIndex]?.userStories[storyIndex];
    if (!currentStory) {
      console.error("Story not found");
      Alert.alert(t("storyViewer.error"), t("storyViewer.storyNotFound"));
      return;
    }

    // Elimina la historia de Firebase Storage
    const storyImageRef = ref(storage, currentStory.storyUrl);
    await deleteObject(storyImageRef).catch(() => {
      console.warn("Story image already deleted in Firebase Storage.");
    });

    // Elimina la historia de Firestore
    const storyDocRef = doc(
      database,
      "users",
      user.uid,
      "stories",
      currentStory.id,
    );
    await deleteDoc(storyDocRef);

    // Actualizar localmente
    const updatedUserStories = stories[currentIndex].userStories.filter(
      (story) => story.id !== currentStory.id,
    );

    if (updatedUserStories.length === 0) {
      // Si no hay más historias, elimina el grupo de historias
      const updatedStories = stories.filter(
        (_, index) => index !== currentIndex,
      );
      setStories(updatedStories);
      onClose(updatedStories); // Llama a `onClose` con las historias actualizadas
    } else {
      // Si hay más historias en el grupo
      const updatedStories = [...stories];
      updatedStories[currentIndex].userStories = updatedUserStories;
      setStories(updatedStories);
      onClose(updatedStories); // Llama a `onClose` con las historias actualizadas
    }
  } catch (error) {
    console.error("Error deleting story:", error);
    Alert.alert(t("storyViewer.error"), t("storyViewer.deleteError"));
  }
};

export const handleSendMessage = async ({
  auth,
  database,
  t,
  stories,
  currentIndex,
  storyIndex,
  message,
  setMessage,
  Keyboard,
  setIsPaused,
  setShowSendConfirmation,
}) => {
  const loggedInUserData = await fetchLoggedInUserData(auth.currentUser);
  if (message.trim()) {
    const currentStory = stories[currentIndex]?.userStories[storyIndex];
    if (currentStory) {
      try {
        // Obtener los IDs de usuario
        const senderId = auth.currentUser.uid;
        const receiverId = currentStory.uid;

        // Verificar si ya existe un chat entre estos dos usuarios
        const chatsRef = collection(database, "chats");
        const q = query(
          chatsRef,
          where("participants", "array-contains", senderId),
        );
        const querySnapshot = await getDocs(q);

        let chatId = null;

        for (const doc of querySnapshot.docs) {
          const chatParticipants = doc.data().participants;
          if (chatParticipants.includes(receiverId)) {
            chatId = doc.id; // Return existing chat ID
            break;
          }
        }

        if (!chatId) {
          // Crear un nuevo chat si no existe
          const chatRef = doc(database, "chats", `${senderId}_${receiverId}`);
          await setDoc(chatRef, {
            participants: [senderId, receiverId],
            createdAt: new Date(),
            lastMessage: "",
          });
          chatId = chatRef.id;
        }

        // Crear el mensaje de respuesta a la historia
        const messagesRef = collection(database, "chats", chatId, "messages");
        const newMessage = {
          text: message,
          senderId: senderId,
         senderName: loggedInUserData?.username || "Anónimo",
          createdAt: new Date(),
          seen: false, // Cambiar de array a boolean
          storyUrl: currentStory.storyUrl,
          isStoryResponse: true, // Indicar que es una respuesta a una historia
        };

        // Guardar el mensaje en la colección de chats
        await addDoc(messagesRef, newMessage);

        // Actualizar el último mensaje en la referencia del chat
        const chatRef = doc(database, "chats", chatId);
        await updateDoc(chatRef, {
          lastMessage: message,
          lastMessageSenderId: senderId,
          lastMessageTimestamp: new Date(),
        });

        // Vaciar el campo de mensaje, cerrar el teclado y continuar la historia
        setMessage("");
        Keyboard.dismiss(); // Cerrar el teclado
        setIsPaused(false); // Continuar la historia
        setShowSendConfirmation(true); // Mostrar mensaje de confirmación
        setTimeout(() => setShowSendConfirmation(false), 2000);
      } catch (error) {
        console.error("Error sending response:", error);
        Alert.alert(t("storyViewer.error"), t("storyViewer.sendResponseError"));
      }
    }
  }
};

export const loadViewers = async ({
  auth,
  database,
  stories,
  currentIndex,
  storyIndex,
  setViewers,
  setPinnedViewers,
  t,
}) => {
  const currentStory = stories[currentIndex]?.userStories[storyIndex];
  if (currentStory) {
    try {
      const storyRef = doc(
        database,
        "users",
        stories[currentIndex].uid,
        "stories",
        currentStory.id,
      );
      const storySnap = await getDoc(storyRef);
      if (storySnap.exists()) {
        const storyData = storySnap.data();

        // Obtener los espectadores fijados desde el documento del usuario
        const userRef = doc(database, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const pinnedViewers = userData?.pinnedViewers || [];

        // Obtener viewers y likes
        const viewers = storyData.viewers || [];
        const likes = storyData.likes || [];

        // Combinar viewers y likes eliminando duplicados
        const allViewers = [...viewers, ...likes].filter(
          (viewer, index, self) =>
            index === self.findIndex((t) => t.uid === viewer.uid) &&
            viewer.uid !== stories[currentIndex].uid,
        );

        // Separar viewers en tres grupos: pinneados, likes y otros
        const pinnedViewersWithActivity = allViewers.filter((viewer) =>
          pinnedViewers.some((pv) => pv.uid === viewer.uid),
        );

        const nonPinnedViewers = allViewers.filter(
          (viewer) => !pinnedViewers.some((pv) => pv.uid === viewer.uid),
        );

        // Separar los no pinneados en likes y otros
        const likeViewers = nonPinnedViewers.filter((viewer) =>
          currentStory.likes?.some((like) => like.uid === viewer.uid)
        );

        const otherViewers = nonPinnedViewers.filter((viewer) =>
          !currentStory.likes?.some((like) => like.uid === viewer.uid)
        );

        // Ordenar cada grupo por timestamp
        const sortByTimestamp = (a, b) => b.timestamp - a.timestamp;
        pinnedViewersWithActivity.sort(sortByTimestamp);
        likeViewers.sort(sortByTimestamp);
        otherViewers.sort(sortByTimestamp);

        // Combinar los grupos en el orden deseado: pinneados, likes y otros
        const sortedViewers = [
          ...pinnedViewersWithActivity,
          ...likeViewers,
          ...otherViewers,
        ];

        setViewers(sortedViewers);
      }
    } catch (error) {
      console.error("Error loading viewers:", error);
      Alert.alert(t("storyViewer.error"), t("storyViewer.loadViewersError"));
    }
  }
};

export const handlePinViewer = async ({
  viewer,
  auth,
  database,
  setPinnedViewers,
  t,
}) => {
  try {
    const userRef = doc(database, "users", auth.currentUser.uid);

    // Carga los espectadores fijados actuales
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    let updatedPinnedViewers = userData?.pinnedViewers || [];

    // Encuentra el índice del espectador en la lista actual
    const viewerIndex = updatedPinnedViewers.findIndex(
      (v) => v.uid === viewer.uid,
    );

    if (viewerIndex !== -1) {
      // Desfijar si ya está en la lista
      updatedPinnedViewers.splice(viewerIndex, 1);
    } else {
      // Fijar al espectador
      if (updatedPinnedViewers.length >= 7) {
        return;
      }
      updatedPinnedViewers.push({
        uid: viewer.uid,
        firstName: viewer.firstName,
        lastName: viewer.lastName,
        profileImage: viewer.profileImage,
      });
    }

    // Actualiza Firestore con la lista de espectadores fijados
    await updateDoc(userRef, { pinnedViewers: updatedPinnedViewers });

    // Actualiza el estado local
    setPinnedViewers(updatedPinnedViewers);
  } catch (error) {
    console.error("Error al fijar/desfijar espectador:", error);
    Alert.alert(t("storyViewer.error"), t("storyViewer.pinUnpinError"));
  }
};

export const fetchPinnedViewers = async ({
  auth,
  database,
  setPinnedViewers,
}) => {
  try {
    const userRef = doc(database, "users", auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    setPinnedViewers(userData?.pinnedViewers || []);
  } catch (error) {
    console.error("Error fetching pinned viewers:", error);
  }
};

export const handleUserPress = async ({
  selectedUser,
  database,
  navigation,
  t,
}) => {
  if (selectedUser.hasStories) {
    try {
      const storiesRef = collection(
        database,
        "users",
        selectedUser.id,
        "stories",
      );
      const storiesSnapshot = await getDocs(storiesRef);

      const now = new Date();
      const userStories = storiesSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((story) => new Date(story.expiresAt?.toDate()) > now);

      if (userStories.length > 0) {
        navigation.navigate("StoryViewer", {
          stories: [
            {
              uid: selectedUser.id,
              username: selectedUser.username,
              userStories: userStories.map(story => ({
                ...story,
                hoursAgo: calculateHoursAgo(story.createdAt), // ⬅ agregamos esto
              })),
            },
          ],
          initialIndex: 0,
        });
        return;
      }
    } catch (error) {
      console.error("Error loading stories:", error);
      Alert.alert(t("storyViewer.error"), t("storyViewer.userDetailsNotFound"));
    }
  }

  // Si no tiene historias, proceder a su perfil
  navigation.navigate("UserProfile", { selectedUser });
};

export const handleThreeDotsPress = async ({
  viewer,
  database,
  setSelectedViewer,
  setIsHideStoryModalVisible,
  user,
}) => {
  try {
    // Obtener los datos del espectador desde Firestore
    const viewerRef = doc(database, "users", viewer.uid);
    const viewerDoc = await getDoc(viewerRef);

    if (viewerDoc.exists()) {
      const viewerData = viewerDoc.data();

      // Actualizar el estado de `selectedViewer` con los datos más recientes
      setSelectedViewer({ ...viewer, ...viewerData });

      // Verificar si el campo `hideStoriesFrom` incluye el UID del usuario actual
      if (
        viewerData.hideStoriesFrom &&
        viewerData.hideStoriesFrom.includes(user.uid)
      ) {
        // Otras acciones pueden agregarse aquí si es necesario
      }

      // Mostrar el modal para ocultar o mostrar historias
      setIsHideStoryModalVisible(true);
    } else {
      console.error("No se encontró el documento del espectador.");
    }
  } catch (error) {
    console.error("Error al obtener el documento del espectador:", error);
  }
};

export const toggleHideStories = async ({
  user,
  currentStory,
  database,
  onClose,
  localUnseenStories,
  t,
}) => {
  if (!user || !currentStory) return;

  const userRef = doc(database, "users", user.uid);

  try {
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const hiddenStories = userData.hiddenStories || [];

    if (hiddenStories.includes(currentStory.uid)) {
      Alert.alert(t("storyViewer.info"), t("storyViewer.alreadyHidden"));
      return;
    }

    await updateDoc(userRef, {
      hiddenStories: arrayUnion(currentStory.uid),
    });

    // Actualizar el estado local antes de cerrar
    const updatedUnseenStories = { ...localUnseenStories };
    if (updatedUnseenStories[currentStory.uid]) {
      delete updatedUnseenStories[currentStory.uid];
    }

    Alert.alert(t("storyViewer.success"), t("storyViewer.hiddenSuccessfully"), [
      {
        text: "OK",
        onPress: () => {
          // Cerrar el visor solo después de que el usuario confirme
          onClose(updatedUnseenStories);
        },
      },
    ]);
  } catch (error) {
    console.error("Error updating hidden stories:", error);
    Alert.alert(t("storyViewer.error"), t("storyViewer.hideError"));
  }
};

export const addViewerToStory = async ({
  storyId,
  storyOwnerId,
  auth,
  database,
}) => {
  try {
    if (!auth || !auth.currentUser) {
      console.error("Usuario no autenticado o referencia a auth inválida.");
      return;
    }

    const currentUser = auth.currentUser;
    if (currentUser.uid === storyOwnerId) return;

    const userRef = doc(database, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const viewerData = {
      uid: currentUser.uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImage:
        userData.photoUrls?.[0] || "https://via.placeholder.com/150",
      timestamp: new Date(),
    };

    const storyRef = doc(database, "users", storyOwnerId, "stories", storyId);
    const storySnap = await getDoc(storyRef);
    const storyData = storySnap.data();

    if (!storyData.viewers?.some((v) => v.uid === currentUser.uid)) {
      await updateDoc(storyRef, {
        viewers: arrayUnion(viewerData),
      });
    }
  } catch (error) {
    console.error("Error adding viewer to story:", error);
  }
};

export const handleSearch = ({ query, setSearchQuery }) => {
  if (typeof query === "string") {
    setSearchQuery(query);
  } else {
    console.warn("El valor proporcionado no es una cadena válida.");
  }
};

export const handleOpenViewersModal = async ({
  setIsPaused,
  loadViewers,
  auth,
  database,
  stories,
  currentIndex,
  storyIndex,
  setViewers,
  setPinnedViewers,
  setViewersModalVisible,
  t,
}) => {
  try {
    setIsPaused(true);
    await loadViewers({
      auth,
      database,
      stories,
      currentIndex,
      storyIndex,
      setViewers,
      setPinnedViewers,
      t,
    });
    setViewersModalVisible(true);
  } catch (error) {
    console.error("Error al abrir el modal de espectadores:", error);
  }
};

export const handleLongPressIn = ({
  longPressTimeout,
  setIsPaused,
  setIsLongPressActive,
  setIsUIVisible,
}) => {
  longPressTimeout.current = setTimeout(() => {
    setIsPaused(true);
    setIsLongPressActive(true);
    setIsUIVisible(false);
  }, 200);
};

export const handleLongPressOut = ({
  longPressTimeout,
  setIsPaused,
  setIsLongPressActive,
  setIsUIVisible,
}) => {
  clearTimeout(longPressTimeout.current);
  setIsPaused(false);
  setIsLongPressActive(false);
  setIsUIVisible(true);
};

export const handleTap = ({
  event,
  width,
  isLongPressActive,
  handleNext,
  handlePrevious,
  onClose,
  stories,
  currentIndex,
  storyIndex,
  setStoryIndex, // Ensure setStoryIndex is included
  setCurrentIndex,
  setProgress,
}) => {
  if (isLongPressActive) return;

  const { locationX } = event.nativeEvent;
  const currentStory = stories[currentIndex]?.userStories[storyIndex];

  if (!currentStory) {
    console.error("Historia actual no válida:", currentStory);
    onClose?.();
    return;
  }

  if (locationX > width / 2) {
    handleNext();
  } else {
    handlePrevious({
      storyIndex,
      setStoryIndex,
      currentIndex,
      setCurrentIndex,
      stories,
      setProgress,
    });
  }
};

export const handlePrevious = ({
  storyIndex,
  setStoryIndex,
  currentIndex,
  setCurrentIndex,
  stories,
  setProgress,
}) => {
  if (storyIndex > 0) {
    // Navegar a la historia anterior del mismo usuario
    setStoryIndex((prev) => prev - 1);
    setProgress(0);
  } else if (currentIndex > 0) {
    // Navegar al último índice del usuario anterior
    setCurrentIndex((prev) => prev - 1);
    const previousUserStories = stories[currentIndex - 1]?.userStories || [];
    setStoryIndex(previousUserStories.length - 1); // Última historia del usuario anterior
    setProgress(0);
  }
};

export const handleNext = ({
  stories,
  currentIndex,
  setCurrentIndex,
  storyIndex,
  setStoryIndex,
  setProgress,
  onClose,
  localUnseenStories,
  setLocalUnseenStories,
}) => {
  try {
    // Verificar que existan historias y el índice sea válido
    if (!stories || !Array.isArray(stories) || stories.length === 0) {
      onClose(localUnseenStories);
      return;
    }

    // Verificar que el índice actual sea válido
    if (currentIndex >= stories.length) {
      onClose(localUnseenStories);
      return;
    }

    const currentStory = stories[currentIndex]?.userStories[storyIndex];

    if (!currentStory) {
      console.error("Historia actual no válida:", currentStory);
      onClose(localUnseenStories);
      return;
    }

    // Actualizar historias no vistas
    if (currentStory && localUnseenStories[currentStory.uid]?.length > 0) {
      setLocalUnseenStories((prev) => ({
        ...prev,
        [currentStory.uid]: prev[currentStory.uid].filter(
          (story) => story.id !== currentStory.id,
        ),
      }));
    }

    // Determinar si hay más historias
    const hasMoreStoriesInCurrentUser =
      storyIndex < stories[currentIndex]?.userStories?.length - 1;
    const hasMoreUsers = currentIndex < stories.length - 1;

    if (hasMoreStoriesInCurrentUser) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (hasMoreUsers) {
      setCurrentIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose(localUnseenStories);
    }
  } catch (error) {
    console.error("Error al navegar a la siguiente historia:", error);
    onClose(localUnseenStories);
  }
};

export const preloadNextStories = ({
  currentIndex,
  storyIndex,
  stories,
  loadedImages,
  setLoadedImages,
  preloadBuffer = 7,
}) => {
  let nextCurrentIndex = currentIndex;
  let nextStoryIndex = storyIndex + 1;

  const visitedStoryIds = new Set();

  for (let i = 0; i < preloadBuffer; i++) {
    // Saltar al siguiente usuario si se acaban las historias de uno
    if (nextStoryIndex >= stories[nextCurrentIndex]?.userStories?.length) {
      nextCurrentIndex++;
      nextStoryIndex = 0;
    }

    if (nextCurrentIndex >= stories.length) return;

    const nextStory = stories[nextCurrentIndex]?.userStories?.[nextStoryIndex];
    if (!nextStory) return;

    // Evitar loops infinitos
    if (visitedStoryIds.has(nextStory.id)) return;
    visitedStoryIds.add(nextStory.id);

    if (loadedImages[nextStory.id]) {
      logInfo("ImagePreload", "Story ya pre-cargada:", nextStory.storyUrl);
    } else {
      const startTime = Date.now();
      ExpoImage.prefetch(nextStory.storyUrl)       
        .then(() => {
          const duration = Date.now() - startTime;
          logInfo("ImagePreload", "Story pre-cargada:", nextStory.storyUrl, "en", duration, "ms");
          setLoadedImages((prev) => ({
            ...prev,
            [nextStory.id]: true,
          }));
        })
        .catch((err) => {
          console.error("Error pre-cargando historia:", err);
        });
    }

    nextStoryIndex++;
  }
};





export const handleCloseViewersModal = ({
  setViewersModalVisible,
  setIsPaused,
}) => {
  setViewersModalVisible(false);
  setIsPaused(false);
};

export const fetchBlockedUsers = async ({
  auth,
  database,
  setBlockedUsers,
}) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(database, "users", user.uid));
    const blockedList = userDoc.data()?.blockedUsers || [];
    setBlockedUsers(blockedList);
  } catch (error) {
    console.error("Error fetching blocked users:", error);
  }
};

export const useStoryProgress = ({
  isPaused,
  isKeyboardVisible,
  isComplaintsVisible,
  progress,
  setProgress,
  onComplete, // función a llamar cuando progress llega a 1
  interval = 16,       // 16 ms por actualización (~60 FPS)
  increment = Platform.OS === "android" ? 1 / 200 : 1 / 250
}) => {
  useEffect(() => {
    let timer;
    if (!isPaused && !isKeyboardVisible && !isComplaintsVisible) {
      timer = setTimeout(() => {
        if (progress >= 1) {
          onComplete();
        } else {
          setProgress((prev) => prev + increment);
        }
      }, interval);
    }

    return () => clearTimeout(timer);
  }, [
    progress,
    isPaused,
    isKeyboardVisible,
    isComplaintsVisible,
    setProgress,
    onComplete,
    interval,
    increment,
  ]);
};


export function calculateHoursAgo(createdAt) {
  if (!createdAt) return 0;

  let timeInMs;
  if (typeof createdAt.toMillis === "function") {
    timeInMs = createdAt.toMillis();
  } else if (typeof createdAt.toDate === "function") {
    timeInMs = createdAt.toDate().getTime();
  } else {
    timeInMs = new Date(createdAt).getTime();
  }

  if (isNaN(timeInMs)) return 0;

  const diffInMs = Date.now() - timeInMs;
  return diffInMs / (1000 * 60 * 60); // ✅ devuelve número decimal de horas
}

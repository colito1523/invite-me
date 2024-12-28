import { PanResponder } from "react-native";
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
import { Alert } from "react-native";
import { ref, deleteObject } from "firebase/storage";
import { auth, database, storage } from "../../config/firebase";


export const createStoryPanResponder = ({
  handleCloseViewer,
  handleOpenViewersModal,
  handleNextUser,
  handlePreviousUser,
  isCurrentUserStory,
}) => {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Detecta movimientos verticales y horizontales
      return Math.abs(gestureState.dy) > 20 || Math.abs(gestureState.dx) > 20;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 50) {
        handleCloseViewer(); // Deslizar hacia abajo
      } else if (gestureState.dy < -50 && isCurrentUserStory) {
        handleOpenViewersModal(); // Deslizar hacia arriba
      } else if (gestureState.dx > 50) {
        handlePreviousUser(); // Deslizar a la derecha
      } else if (gestureState.dx < -50) {
        handleNextUser(); // Deslizar a la izquierda
      }
    },
  });
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
    setStoryIndex(0); // Reinicia al primer índice de la historia anterior
    setProgress(0);
  }
};

export const handleLikeStory = async ({
  auth,
  stories,
  currentIndex,
  storyIndex,
  hasLiked,
  setHasLiked,
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
      currentStory.id
    );

    const userRef = doc(database, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (hasLiked) {
      // Eliminar el like
      const storySnap = await getDoc(storyRef);
      const storyData = storySnap.data();

      if (storyData?.likes) {
        const updatedLikes = storyData.likes.filter(
          (like) => like.uid !== currentUser.uid
        );
        await updateDoc(storyRef, { likes: updatedLikes });
      }
      setHasLiked(false);
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
        "notifications"
      );

      await addDoc(notificationRef, {
        type: "storyLike",
        fromId: currentUser.uid,
        fromName: `${userData.firstName} ${userData.lastName}`.trim(),
        fromImage: userData.photoUrls?.[0] || "default-image-url",
        storyId: currentStory.id,
        message: `${userData.firstName} ${userData.lastName} te dio like en tu historia.`,
        timestamp: new Date(),
        seen: false, // Marcamos la notificación como no vista
      });

      setHasLiked(true);
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
    const user = auth.currentUser;
    if (!user) {
      console.error("No user logged in");
      Alert.alert(t("storyViewer.error"), t("storyViewer.dontAuthentication"));
      return;
    }

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
      currentStory.id
    );
    await deleteDoc(storyDocRef);

    // Actualizar localmente
    const updatedUserStories = stories[currentIndex].userStories.filter(
      (story) => story.id !== currentStory.id
    );

    if (updatedUserStories.length === 0) {
      // Si no hay más historias, elimina el grupo de historias
      const updatedStories = stories.filter((_, index) => index !== currentIndex);
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
  if (message.trim()) {
    const currentStory = stories[currentIndex]?.userStories[storyIndex];
    if (currentStory) {
      try {
        // Obtener los IDs de usuario
        const senderId = auth.currentUser.uid;
        const receiverId = currentStory.uid;

        // Verificar si ya existe un chat entre estos dos usuarios
        const chatsRef = collection(database, "chats");
        const q = query(chatsRef, where("participants", "array-contains", senderId));
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
          senderName: auth.currentUser.displayName || t("storyViewer.anonymous"),
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
        Alert.alert(
          t("storyViewer.error"),
          t("storyViewer.sendResponseError")
        );
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
        currentStory.id
      );
      const storySnap = await getDoc(storyRef);
      if (storySnap.exists()) {
        const storyData = storySnap.data();

        // Obtener los espectadores fijados desde el documento del usuario
        const userRef = doc(database, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const pinnedViewers = userData?.pinnedViewers || [];

        // Combina y ordena espectadores: fijados primero
        const allViewers = [
          ...(storyData.viewers || []),
          ...(storyData.likes || []),
        ];

        const uniqueViewers = allViewers.filter(
          (viewer, index, self) =>
            index === self.findIndex((t) => t.uid === viewer.uid) &&
            viewer.uid !== stories[currentIndex].uid
        );

        const sortedViewers = uniqueViewers.sort((a, b) => {
          const aIsPinned = pinnedViewers.some((pv) => pv.uid === a.uid);
          const bIsPinned = pinnedViewers.some((pv) => pv.uid === b.uid);

          if (aIsPinned && !bIsPinned) return -1;
          if (!aIsPinned && bIsPinned) return 1;

          return b.timestamp - a.timestamp;
        });

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
      (v) => v.uid === viewer.uid
    );

    if (viewerIndex !== -1) {
      // Desfijar si ya está en la lista
      updatedPinnedViewers.splice(viewerIndex, 1);
    } else {
      // Fijar al espectador
      if (updatedPinnedViewers.length >= 3) {
        // Mantener el límite de tres espectadores
        updatedPinnedViewers.shift();
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


export const handleUserPress = async ({
  selectedUser,
  database,
  navigation,
  t,
}) => {
  if (selectedUser.hasStories) {
    try {
      const storiesRef = collection(database, "users", selectedUser.id, "stories");
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
              userStories,
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

export const toggleHideMyStories = async ({
  viewer,
  user,
  database,
  setSelectedViewer,
  t,
}) => {
  if (!user || !viewer) return;

  const viewerRef = doc(database, "users", viewer.uid);

  try {
    const viewerDoc = await getDoc(viewerRef);
    const viewerData = viewerDoc.data();
    const hideStoriesFrom = viewerData.hideStoriesFrom || [];

    let updatedHideStoriesFrom;
    if (hideStoriesFrom.includes(user.uid)) {
      updatedHideStoriesFrom = hideStoriesFrom.filter(
        (uid) => uid !== user.uid
      );
      await updateDoc(viewerRef, {
        hideStoriesFrom: updatedHideStoriesFrom,
      });
      Alert.alert(
        t("storyViewer.success"),
        t("storyViewer.viewerCanSeeStories")
      );
    } else {
      updatedHideStoriesFrom = [...hideStoriesFrom, user.uid];
      await updateDoc(viewerRef, {
        hideStoriesFrom: updatedHideStoriesFrom,
      });
      Alert.alert(
        t("storyViewer.success"),
        t("storyViewer.viewerCannotSeeStories")
      );
    }

    setSelectedViewer((prev) => ({
      ...prev,
      hideStoriesFrom: updatedHideStoriesFrom,
    }));
  } catch (error) {
    console.error("Error updating hideStoriesFrom:", error);
    Alert.alert(
      t("storyViewer.error"),
      t("storyViewer.storySettingsUpdateError")
    );
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
    // Obtener el documento del usuario actual
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const hiddenStories = userData.hiddenStories || [];

    // Verificar si el UID ya está en la lista
    if (hiddenStories.includes(currentStory.uid)) {
      Alert.alert(t("storyViewer.info"), t("storyViewer.alreadyHidden"));
    } else {
      // Agregar el UID al campo `hiddenStories`
      await updateDoc(userRef, {
        hiddenStories: arrayUnion(currentStory.uid),
      });

      Alert.alert(
        t("storyViewer.success"),
        t("storyViewer.hiddenSuccessfully")
      );

      // Cerrar el visor de historias después de agregar el UID
      onClose(localUnseenStories); // Llama a la función `onClose` para cerrar el visor
    }
  } catch (error) {
    console.error("Error updating hidden stories:", error);
    Alert.alert(t("storyViewer.error"), t("storyViewer.hideError"));
  }
};

export const addViewerToStory = async ({ storyId, storyOwnerId, auth, database }) => {
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
      profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
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
}) => {
  longPressTimeout.current = setTimeout(() => {
    setIsPaused(true);
    setIsLongPressActive(true);
  }, 200);
};

export const handleLongPressOut = ({
  longPressTimeout,
  setIsPaused,
  setIsLongPressActive,
}) => {
  clearTimeout(longPressTimeout.current);
  setIsPaused(false);
  setIsLongPressActive(false);
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
    handlePrevious();
  }
};









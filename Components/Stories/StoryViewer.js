import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  TextInput,
  PanResponder,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Alert,
  Keyboard,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Entypo, AntDesign } from "@expo/vector-icons";
import { auth, database, storage } from "../../config/firebase";
import {
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  arrayRemove,
  setDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import Complaints from "../Complaints/Complaints";

const { width, height } = Dimensions.get("window");

export function StoryViewer({
  stories,
  initialIndex,
  onClose,
  onStoryDeleted,
  unseenStories, 
  navigation,
}) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [localUnseenStories, setLocalUnseenStories] = useState(unseenStories); 
  const [message, setMessage] = useState("");
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const longPressTimeout = useRef(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedViewers, setPinnedViewers] = useState([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isComplaintsVisible, setIsComplaintsVisible] = useState(false);
  const [hideStories, setHideStories] = useState(false);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  const user = auth.currentUser;

  const getChatId = async (user1Id, user2Id) => {
    const user1Doc = await getDoc(doc(database, "users", user1Id));
    const user2Doc = await getDoc(doc(database, "users", user2Id));

    const user1Name = user1Doc.data().username;
    const user2Name = user2Doc.data().username;

    return user1Name > user2Name
      ? `${user1Name}_${user2Name}`
      : `${user2Name}_${user1Name}`;
  };

  useEffect(() => {
    if (isComplaintsVisible) {
      setIsPaused(true);
    } else if (!isOptionsModalVisible && !isKeyboardVisible) {
      setIsPaused(false);
    }
  }, [isComplaintsVisible, isOptionsModalVisible, isKeyboardVisible]);

  const handleCloseViewer = () => {
    onClose(localUnseenStories); // Envía el estado actualizado de `localUnseenStories` a `StorySlider.js`
  };
  
  useEffect(() => {
    let timer;
    if (!isPaused && !isKeyboardVisible && !isComplaintsVisible) {
      // Añade isComplaintsVisible
      timer = setInterval(() => {
        if (progress < 1) {
          setProgress((prev) => prev + 0.02);
        } else {
          handleNext();
        }
      }, 100);
    }

    return () => clearInterval(timer);
  }, [progress, isPaused, isKeyboardVisible, isComplaintsVisible]);

  useEffect(() => {
    if (isOptionsModalVisible) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [isOptionsModalVisible]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
        setIsPaused(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
        setIsPaused(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const currentStory = stories[currentIndex]?.userStories[storyIndex];
  
    // Si `currentStory` no está disponible, no continúes y muestra un indicador de carga
    if (!currentStory) {
      return;
    }
  
    if (auth.currentUser) {
      addViewerToStory(currentStory.id, currentStory.uid);
      const userHasLiked = currentStory.likes?.some(
        (like) => like.uid === auth.currentUser.uid
      );
      setHasLiked(userHasLiked || false);
    }
  
    // Pre-cargar la siguiente historia si existe
    preloadNextStory();
  }, [currentIndex, storyIndex]);
  

  const preloadNextStory = () => {
    let nextStoryUrl = null;
    if (storyIndex < stories[currentIndex]?.userStories.length - 1) {
      nextStoryUrl =
        stories[currentIndex]?.userStories[storyIndex + 1]?.storyUrl;
    } else if (currentIndex < stories.length - 1) {
      nextStoryUrl = stories[currentIndex + 1]?.userStories[0]?.storyUrl;
    }

    if (nextStoryUrl && !loadedImages[nextStoryUrl]) {
      Image.prefetch(nextStoryUrl).then(() => {
        setLoadedImages((prev) => ({ ...prev, [nextStoryUrl]: true }));
      });
    }
  };

  const handlePinViewer = async (viewer) => {
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

  const toggleHideStories = async () => {
    if (!user || !currentStory) return;

    const userRef = doc(database, "users", user.uid);
    try {
      if (hideStories) {
        await updateDoc(userRef, {
          hiddenStories: arrayRemove(currentStory.uid),
        });
      } else {
        await updateDoc(userRef, {
          hiddenStories: arrayUnion(currentStory.uid),
        });
      }
      setHideStories(!hideStories);
      Alert.alert(
        t("userProfile.success"),
        hideStories
          ? t("userProfile.willSeeStories")
          : t("userProfile.willNotSeeStories")
      );
    } catch (error) {
      console.error("Error updating story visibility:", error);
      Alert.alert(
        t("userProfile.error"),
        t("userProfile.storySettingsUpdateError")
      );
    }
  };

  const addViewerToStory = async (storyId, storyOwnerId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid === storyOwnerId) return;

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

  const handleLikeStory = async () => {
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

      const likeData = {
        uid: currentUser.uid,
        firstName: userData.firstName || t("storyViewer.user"),
        lastName: userData.lastName || "",
        profileImage: userData.photoUrls?.[0] || "default-image-url",
        timestamp: new Date(),
      };

      if (hasLiked) {
        await updateDoc(storyRef, {
          likes: arrayRemove(likeData),
        });
        setHasLiked(false);
      } else {
        await updateDoc(storyRef, {
          likes: arrayUnion(likeData),
        });
        setHasLiked(true);
      }

      const notificationRef = collection(
        database,
        "users",
        currentStory.uid,
        "notifications"
      );
      await addDoc(notificationRef, {
        type: "storyLike",
        fromId: currentUser.uid,
        fromName: userData.firstName,
        fromLastName: userData.lastName,
        fromImage: userData.photoUrls?.[0] || "default-image-url",
        storyId: currentStory.id,
        message: t("storyViewer.likedYourStory", {
          firstName: userData.firstName,
          lastName: userData.lastName,
        }),
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error liking story:", error);
      Alert.alert(t("storyViewer.error"), t("storyViewer.likeError"));
    }
  };

  const handleUserPress = async (uid) => {
    try {
      const userDoc = await getDoc(doc(database, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userData.id = uid;
        navigation.navigate("UserProfile", { selectedUser: userData });
      } else {
        Alert.alert(
          t("storyViewer.error"),
          t("storyViewer.userDetailsNotFound")
        );
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert(
        t("storyViewer.error"),
        t("storyViewer.userDetailsFetchError")
      );
    }
  };

  const loadViewers = async () => {
    const currentStory = stories[currentIndex]?.userStories[storyIndex];
    if (currentStory) {
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
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredViewers = viewers.filter((viewer) =>
    `${viewer.firstName} ${viewer.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleNext = () => {
    const currentStory = stories[currentIndex]?.userStories[storyIndex];

    // Verificar si currentStory es undefined antes de acceder a sus propiedades
  if (!currentStory) {
    onClose(localUnseenStories);
    return;
  }
  
    if (localUnseenStories[currentStory.uid]?.length > 0) {
      setLocalUnseenStories((prev) => ({
        ...prev,
        [currentStory.uid]: prev[currentStory.uid].filter(
          (story) => story.id !== currentStory.id
        ),
      }));
    }
  
    if (storyIndex < stories[currentIndex]?.userStories.length - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose(localUnseenStories); // Pasa el estado actualizado de vuelta
    }
  };
  

  const handlePrevious = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setStoryIndex(stories[currentIndex - 1]?.userStories.length - 1);
      setProgress(0);
    }
  };

  const handleTap = (event) => {
    const { locationX } = event.nativeEvent;
    if (locationX > width / 2) {
      handleNext();
    } else {
      handlePrevious();
    }
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const currentStory = stories[currentIndex]?.userStories[storyIndex];
      if (currentStory) {
        try {
          // Obtener los IDs de usuario
          const senderId = user.uid;
          const receiverId = currentStory.uid;
          
          // Verificar si ya existe un chat entre estos dos usuarios
          const chatId = await getChatId(senderId, receiverId);
          const chatRef = doc(database, "chats", chatId);
          const chatDoc = await getDoc(chatRef);
  
          if (!chatDoc.exists()) {
            // Crear un nuevo chat si no existe
            await setDoc(chatRef, {
              participants: [senderId, receiverId],
              createdAt: new Date(),
              lastMessage: "",
            });
          }
  
          // Crear el mensaje de respuesta a la historia
          const messagesRef = collection(database, "chats", chatId, "messages");
          const newMessage = {
            text: message,
            senderId: user.uid,
            senderName: user.displayName || t("storyViewer.anonymous"),
            createdAt: new Date(),
            seen: [user.uid], // Solo agregar el UID del remitente
            storyUrl: currentStory.storyUrl,
            isStoryResponse: true, // Indicar que es una respuesta a una historia
          };
  
          // Guardar el mensaje en la colección de chats
          await addDoc(messagesRef, newMessage);
  
          // Actualizar el último mensaje en la referencia del chat
          await updateDoc(chatRef, {
            lastMessage: message,
            lastMessageSenderId: user.uid,
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
  
  
  

  const handleLongPressIn = () => {
    longPressTimeout.current = setTimeout(() => {
      setIsPaused(true);
    }, 200);
  };

  const handleLongPressOut = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    setIsPaused(false);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 20;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 50) {
        handleCloseViewer(); // Llama a `handleCloseViewer` al deslizar hacia abajo
      } else if (gestureState.dy < -50 && isCurrentUserStory) {
        handleOpenViewersModal();
      }
    },
  });
  

  const handleOpenViewersModal = () => {
    setIsPaused(true);
    loadViewers();
    setViewersModalVisible(true);
  };

  const handleCloseViewersModal = () => {
    setViewersModalVisible(false);
    setIsPaused(false);
  };

  const deleteStory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user logged in");
        Alert.alert(t("storyViewer.error"), t("storyViewer.userAuthError"));
        return;
      }

      if (
        !stories[currentIndex] ||
        !stories[currentIndex].userStories[storyIndex]
      ) {
        console.error("Story not found at specified indices");
        Alert.alert(t("storyViewer.error"), t("storyViewer.storyNotFound"));
        return;
      }

      const currentStory = stories[currentIndex].userStories[storyIndex];

      if (currentStory.uid !== user.uid) {
        console.error("User does not have permission to delete this story");
        Alert.alert(
          t("storyViewer.error"),
          t("storyViewer.deletePermissionError")
        );
        return;
      }

      const storyDocRef = doc(
        database,
        "users",
        user.uid,
        "stories",
        currentStory.id
      );
      await deleteDoc(storyDocRef);

      const storyImageRef = ref(storage, currentStory.storyUrl);
      await deleteObject(storyImageRef);

      handleCloseViewersModal();
      onStoryDeleted(currentIndex, storyIndex);

      if (stories[currentIndex].userStories.length === 1) {
        onClose();
      } else {
        if (storyIndex < stories[currentIndex].userStories.length - 1) {
          setStoryIndex(storyIndex + 1);
        } else if (storyIndex > 0) {
          setStoryIndex(storyIndex - 1);
        }
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      Alert.alert(t("storyViewer.error"), t("storyViewer.deleteError"));
    }
  };

  const isCurrentUserStory =
    stories[currentIndex]?.uid === auth.currentUser?.uid;
  const isFirstStory = currentIndex === 0 && storyIndex === 0;

  const isLastStory =
    currentIndex === stories.length - 1 &&
    storyIndex === stories[currentIndex]?.userStories.length - 1;

  const currentStory = stories[currentIndex]?.userStories[storyIndex];
  const hoursAgo = currentStory
    ? Math.floor(
        (Date.now() - currentStory.createdAt.toDate()) / (1000 * 60 * 60)
      )
    : 0;

  const renderViewerItem = ({ item }) => {
    const currentStory = stories[currentIndex]?.userStories[storyIndex];
    const hasLiked = currentStory?.likes?.some((like) => like.uid === item.uid);
    const isPinned = pinnedViewers.some((pv) => pv.uid === item.uid);

    return (
      <TouchableOpacity
        style={styles.viewerItem}
        onPress={() => handleUserPress(item.uid)}
      >
        <Image
          source={{ uri: item.profileImage }}
          style={styles.viewerImage}
          cachePolicy="memory-disk"
        />
        <Text
          style={styles.viewerName}
        >{`${item.firstName} ${item.lastName}`}</Text>
        {hasLiked && (
          <Ionicons
            name="heart"
            size={18}
            color="red"
            style={styles.likeIcon}
          />
        )}
        <TouchableOpacity
          style={styles.viewerEditButton}
          onPress={() => handlePinViewer(item)}
        >
          <AntDesign
            name="pushpino"
            size={18}
            color={isPinned ? "#007AFF" : "#000"}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewerMenuButton}>
          <Entypo name="dots-three-horizontal" size={18} color="#000" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (!currentStory) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <TouchableWithoutFeedback
          onPressIn={handleLongPressIn}
          onPressOut={handleLongPressOut}
          onPress={handleTap}
        >
          <View style={styles.storyContainer}>
            <View style={styles.progressContainer}>
              {stories[currentIndex]?.userStories.map((_, index) => (
                <View key={index} style={styles.progressBar}>
                  <View
                    style={[
                      styles.progress,
                      {
                        width:
                          index === storyIndex
                            ? `${progress * 100}%`
                            : index < storyIndex
                            ? "100%"
                            : "0%",
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            <Image
              cachePolicy="memory-disk"
              key={currentStory.id}
              source={{ uri: currentStory.storyUrl }}
              style={styles.image}
              onLoadStart={() => setIsImageLoading(true)}
              onLoadEnd={() => setIsImageLoading(false)}
              onLoad={() =>
                setLoadedImages((prev) => ({
                  ...prev,
                  [currentStory.storyUrl]: true,
                }))
              }
            />
            {isImageLoading && (
              <ActivityIndicator size="large" color="#FFFFFF" />
            )}
            <View style={styles.userInfo}>
              <View style={styles.userDetails}>
                <Image
                  source={{ uri: stories[currentIndex]?.profileImage }}
                  style={styles.avatar}
                  cachePolicy="memory-disk"
                />
                <Text style={styles.username}>
                  {`${stories[currentIndex]?.username} ${
                    stories[currentIndex]?.lastName || ""
                  }`}
                </Text>
              </View>
              <View style={styles.rightInfo}>
                <Text style={styles.timeAgo}>
                  {t("storyViewer.hoursAgo", { hours: hoursAgo })}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsOptionsModalVisible(true)}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>

        {showSendConfirmation && (
      <View style={styles.sendConfirmation}>
        <Text style={styles.sendConfirmationText}>Mensaje enviado</Text>
      </View>
    )}

        {!isFirstStory && (
          <TouchableOpacity
            style={[styles.navButton, styles.leftButton]}
            onPress={handlePrevious}
          ></TouchableOpacity>
        )}

        {!isLastStory && (
          <TouchableOpacity
            style={[styles.navButton, styles.rightButton]}
            onPress={handleNext}
          ></TouchableOpacity>
        )}

        {!isCurrentUserStory && (
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder={t("storyViewer.typePlaceholder")}
              placeholderTextColor="#FFFFFF"
              value={message}
              onChangeText={(text) => setMessage(text)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            />
            {message.trim().length > 0 && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSendMessage}
              >
                <Ionicons name="send" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleLikeStory}
            >
              <Ionicons
                name={hasLiked ? "heart" : "heart-outline"}
                size={24}
                color={hasLiked ? "red" : "#FFFFFF"}
              />
            </TouchableOpacity>
          </View>
        )}

        {isCurrentUserStory && (
          <TouchableOpacity
            style={styles.viewersButton}
            onPress={handleOpenViewersModal}
          >
            <Entypo name="chevron-thin-up" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Modal
          animationType="slide"
          transparent={true}
          visible={viewersModalVisible}
          onRequestClose={handleCloseViewersModal}
        >
          <TouchableWithoutFeedback onPress={handleCloseViewersModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.viewersModalContainer}>
                  <View style={styles.viewersModalContent}>
                    <View style={styles.viewersModalHeader}>
                      <View style={styles.searchContainer}>
                        <Ionicons
                          name="search"
                          size={20}
                          color="#4d4d4d"
                          style={styles.searchIcon}
                        />
                        <TextInput
                          style={styles.searchInput}
                          placeholder={t("storyViewer.searchPlaceholder")}
                          placeholderTextColor="gray"
                          value={searchQuery}
                          onChangeText={handleSearch}
                        />
                        <View style={styles.searchInputDivider} />
                        <Text style={styles.searchInputCount}>
                          {filteredViewers.length}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={deleteStory}
                      >
                        <Ionicons name="trash-outline" size={20} color="#000" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.viewersTitle}>
                      {t("storyViewer.viewers")}
                    </Text>
                    <FlatList
                      data={filteredViewers}
                      renderItem={renderViewerItem}
                      keyExtractor={(item) => item.uid}
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isOptionsModalVisible}
        onRequestClose={() => setIsOptionsModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setIsOptionsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.optionsModalContainer}>
                {isCurrentUserStory ? (
                  // Opción solo para el dueño
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      setIsOptionsModalVisible(false);
                      deleteStory(); // Llamamos a la función de eliminar historia
                    }}
                  >
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                ) : (
                  // Opciones para otros usuarios
                  <>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => {
                        setIsOptionsModalVisible(false);
                        toggleHideStories(); // Llama a la función para ocultar historias
                      }}
                    >
                      <Text style={styles.optionButtonText}>
                        No ver más historias
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => {
                        setIsOptionsModalVisible(false);
                        setIsComplaintsVisible(true); // Abre el modal de denuncias
                      }}
                    >
                      <Text style={styles.optionButtonText}>Denunciar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Complaints
        isVisible={isComplaintsVisible}
        onClose={() => setIsComplaintsVisible(false)}
        onSubmit={async (reason, description) => {
          try {
            const currentStory = stories[currentIndex]?.userStories[storyIndex];
            if (!currentStory) return;

            const reportData = {
              reason,
              description,
              reportedBy: auth.currentUser.uid,
              storyOwner: currentStory.uid,
              storyId: currentStory.id,
              timestamp: new Date(),
            };

            await addDoc(collection(database, "reports"), reportData);
            Alert.alert("Denuncia enviada", "Gracias por tu reporte.");
            setIsComplaintsVisible(false);
          } catch (error) {
            console.error("Error al enviar la denuncia:", error);
            Alert.alert(
              "Error",
              "No se pudo enviar la denuncia. Intenta de nuevo."
            );
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  storyContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  progressBar: {
    marginTop: 10,
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 2,
  },
  progress: {
    height: "100%",
    backgroundColor: "white",
  },
  image: {
    width,
    height,
    contentFit: "cover",
  },
  userInfo: {
    position: "absolute",
    top: 20,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  username: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  rightInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeAgo: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginRight: 10,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    padding: 20,
  },
  leftButton: {
    left: 0,
  },
  rightButton: {
    right: 0,
  },
  messageContainer: {
    position: "absolute",
    bottom: 40,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  messageInput: {
    flex: 1,
    color: "white",
    paddingVertical: 10,
    fontSize: 16,
  },
  iconButton: {
    padding: 10,
  },
  viewersButton: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  viewersModalContainer: {
    backgroundColor: "rgba(225, 225, 225, 0.99)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: "80%",
  },
  viewersModalContent: {
    flex: 1,
  },
  viewersModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7D7B7B",
    borderRadius: 20,
    marginRight: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: "90%",
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
  },
  searchInputDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#7D7B7B",
    marginHorizontal: 8,
  },
  searchInputCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4d4d4d",
  },
  deleteButton: {
    padding: 4,
    marginBottom: 10,
  },
  viewersTitle: {
    color: "#4d4d4d",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    paddingLeft: 10,
  },
  viewerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  viewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  viewerName: {
    flex: 1,
    fontSize: 16,
  },
  likeIcon: {
    marginRight: 10,
  },
  viewerEditButton: {
    padding: 5,
    marginRight: 5,
  },
  viewerMenuButton: {
    padding: 5,
  },
  optionsModalContainer: {
    backgroundColor: "transparent",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: 50,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
  },
  optionButton: {
    padding: 10,
    marginVertical: 5,
  },
  optionButtonText: {
    fontSize: 16,
    color: "red",
  },
  sendConfirmation: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendConfirmationText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default StoryViewer;

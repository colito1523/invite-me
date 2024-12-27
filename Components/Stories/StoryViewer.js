import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Alert,
  Keyboard,
  SafeAreaView,
  Dimensions, // Add this import
  Image,
} from "react-native";
import { Ionicons, Entypo, AntDesign } from "@expo/vector-icons";
import { auth, database, storage } from "../../config/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import styles from "./StoryViewStyles";
import { useTranslation } from "react-i18next";
import Complaints from "../Complaints/Complaints";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  createStoryPanResponder,
  handleNextUser,
  handlePreviousUser,
  handleLikeStory,
  deleteStory,
  handleSendMessage,
  loadViewers,
  handlePinViewer,
  handleUserPress,
  handleThreeDotsPress,
  toggleHideMyStories 
} from "./storyUtils"; // Importar las funciones

const { width, height } = Dimensions.get("window"); // Add this line

export function StoryViewer({
  stories,
  initialIndex,
  onClose,
  unseenStories,
  navigation,
}) {
  const { t } = useTranslation();

  // Add logging to debug the issue
  useEffect(() => {
    console.log("StoryViewer props:", { stories, initialIndex, unseenStories });
    if (!stories || !Array.isArray(stories)) {
      console.error("Prop 'stories' no es un array válido:", stories);
      onClose?.();
      return;
    }
    const validStories = stories.filter(
      (story) => story && Array.isArray(story.userStories)
    );
    if (validStories.length === 0) {
      console.error("No hay historias válidas disponibles.");
      onClose?.();
      return;
    }
    if (
      typeof initialIndex !== "number" ||
      initialIndex < 0 ||
      initialIndex >= validStories.length
    ) {
      console.error("Índice inicial inválido:", initialIndex);
      onClose?.();
      return;
    }
  }, [stories, initialIndex, unseenStories]);

  // Deserialize the createdAt and expiresAt fields
  const deserializedStories = stories.map((storyGroup) => ({
    ...storyGroup,
    userStories: storyGroup.userStories.map((story) => ({
      ...story,
      createdAt: story.createdAt?.toDate
        ? story.createdAt.toDate()
        : new Date(story.createdAt),
      expiresAt: story.expiresAt?.toDate
        ? story.expiresAt.toDate()
        : new Date(story.expiresAt),
    })),
  }));

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [storyIndex, setStoryIndex] = useState(() => {
    const userStories = deserializedStories[initialIndex]?.userStories || [];
    const unseenIndex = userStories.findIndex(
      (story) =>
        !story.viewers?.some((viewer) => viewer.uid === auth.currentUser.uid)
    );
    return unseenIndex !== -1 ? unseenIndex : 0;
  });
  const [progress, setProgress] = useState(0);
  const [localStories, setLocalStories] = useState(() => [...stories]);
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
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isComplaintsVisible, setIsComplaintsVisible] = useState(false);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isHideStoryModalVisible, setIsHideStoryModalVisible] = useState(false);
  const [selectedViewer, setSelectedViewer] = useState(null); // Para almacenar el espectador seleccionado
  const [imageDimensions, setImageDimensions] = useState({
    width: "100%",
    height: "100%",
  });
  const [isLongPressActive, setIsLongPressActive] = useState(false); // Add this line

  const user = auth.currentUser;

  useEffect(() => {
    if (!currentStory) {
      onClose(); // Cierra el visor si no hay una historia actual válida
    }
  }, [currentStory, onClose]);

  const getChatId = async (user1Id, user2Id) => {
    const chatsRef = collection(database, "chats");

    // Query for a chat that includes both user1Id and user2Id
    const q = query(chatsRef, where("participants", "array-contains", user1Id));

    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      const chatParticipants = doc.data().participants;
      if (chatParticipants.includes(user2Id)) {
        return doc.id; // Return existing chat ID
      }
    }

    // If no chat exists, return a new chat ID based on user IDs
    // This part is for creating a new chat if none exists
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
    const fetchBlockedUsers = async () => {
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

    fetchBlockedUsers();
  }, []);

  useEffect(() => {
    let timer;
    if (!isPaused && !isKeyboardVisible && !isComplaintsVisible) {
      timer = setInterval(() => {
        if (progress < 1) {
          setProgress((prev) => prev + 0.004);
        } else {
          handleNext();
        }
      }, 20);
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

  const toggleHideStories = async () => {
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


  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredViewers = viewers.filter((viewer) =>
    `${viewer.firstName} ${viewer.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    if (onClose) onClose();
    navigation.goBack();
  };

  const handleNext = () => {
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

      // Actualizar historias no vistas
      if (currentStory && localUnseenStories[currentStory.uid]?.length > 0) {
        setLocalUnseenStories((prev) => ({
          ...prev,
          [currentStory.uid]: prev[currentStory.uid].filter(
            (story) => story.id !== currentStory.id
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
    if (isLongPressActive) return; // Add this line

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

  const handleLongPressIn = () => {
    longPressTimeout.current = setTimeout(() => {
      setIsPaused(true);
      setIsLongPressActive(true); // Add this line
    }, 200);
  };

  const handleLongPressOut = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    setIsPaused(false);
    setIsLongPressActive(false); // Add this line
  };

  const panResponder = createStoryPanResponder({
    handleCloseViewer: () => onClose(unseenStories),
    handleOpenViewersModal: () => console.log("Abrir modal de espectadores"),
    handleNextUser: () =>
      handleNextUser({
        currentIndex,
        setCurrentIndex,
        setStoryIndex,
        setProgress,
        stories,
        onClose,
        localUnseenStories: unseenStories,
      }),
    handlePreviousUser: () =>
      handlePreviousUser({
        currentIndex,
        setCurrentIndex,
        setStoryIndex,
        setProgress,
      }),
    isCurrentUserStory: stories[currentIndex]?.uid === auth.currentUser?.uid,
  });

  const handleOpenViewersModal = () => {
    setIsPaused(true);
    loadViewers({
      auth,
      database,
      stories: localStories,
      currentIndex,
      storyIndex,
      setViewers,
      t,
    });
    setViewersModalVisible(true);
  };
  

  const handleCloseViewersModal = () => {
    setViewersModalVisible(false);
    setIsPaused(false);
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
      onPress={() =>
        handleUserPress({
          selectedUser: {
            id: item.uid,
            username: item.username,
            firstName: item.firstName,
            lastName: item.lastName,
            profileImage: item.profileImage,
            hasStories: item.hasStories || false,
          },
          database,
          navigation,
          t,
        })
      }
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
          onPress={() =>
            handlePinViewer({
              viewer: item,
              auth,
              database,
              setPinnedViewers,
              t,
            })
          }
        >
          <AntDesign
            name="pushpino"
            size={18}
            color={isPinned ? "#007AFF" : "#000"}
          />
        </TouchableOpacity>
        <TouchableOpacity
  onPress={() =>
    handleThreeDotsPress({
      viewer: item,
      database,
      setSelectedViewer,
      setIsHideStoryModalVisible,
      user: auth.currentUser,
    })
  }
>
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Ajusta según la interfaz
      >
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
                key={currentStory.id}
                source={{ uri: currentStory.storyUrl }}
                style={[
                  styles.image,
                  imageDimensions, // Aplica dimensiones dinámicas
                ]}
                resizeMode="cover" // Siempre usar "cover"
                onLoad={(event) => {
                  const { width: imgWidth, height: imgHeight } =
                    event.nativeEvent.source;
                  const screenAspectRatio = width / height;
                  const imageAspectRatio = imgWidth / imgHeight;

                  // Si la imagen es horizontal, ajustamos dinámicamente el tamaño
                  if (imageAspectRatio > screenAspectRatio) {
                    setImageDimensions({
                      width: "100%",
                      height: "100%",
                    });
                  } else {
                    setImageDimensions({
                      width: "100%",
                      height: "100%",
                    });
                  }
                }}
              />

              <View style={styles.userInfo}>
                <TouchableOpacity
                  style={styles.userDetails}
                  onPress={() => {
                    const currentStory = stories[currentIndex];
                    if (currentStory) {
                      if (currentStory.uid === auth.currentUser.uid) {
                        navigation.navigate("Profile");
                      } else {
                        navigation.navigate("UserProfile", {
                          selectedUser: {
                            id: currentStory.uid,
                            username: currentStory.username,
                            firstName: currentStory.username,
                            lastName: currentStory.lastName || "",
                            profileImage: currentStory.profileImage,
                          },
                        });
                      }
                    }
                  }}
                >
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
                </TouchableOpacity>
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
              <Text style={styles.sendConfirmationText}>
                {t("storyViewer.sendMenssage")}
              </Text>
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
                  onPress={() =>
                    handleSendMessage({
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
                    })
                  }
                >
                  <Ionicons name="send" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  handleLikeStory({
                    auth,
                    stories,
                    currentIndex,
                    storyIndex,
                    hasLiked,
                    setHasLiked,
                    database,
                    t,
                  })
                }
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
                            color="black"
                            style={styles.searchIcon}
                          />
                          <TextInput
                            style={styles.searchInput}
                            placeholder={t("storyViewer.searchPlaceholder")}
                            placeholderTextColor="black"
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
                          onPress={() =>
                            deleteStory({
                              auth,
                              stories: localStories, // Usar localStories
                              currentIndex,
                              storyIndex,
                              setStories: setLocalStories, // Usar setLocalStories
                              onClose,
                              database,
                              storage,
                              t,
                            })
                          }
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="black"
                          />
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
                        deleteStory({
                          auth,
                          stories: localStories, // Usar localStories
                          currentIndex,
                          storyIndex,
                          setStories: setLocalStories, // Usar setLocalStories
                          onClose,
                          database,
                          storage,
                          t,
                        });
                      }}
                    >
                      <Text style={styles.deleteButtonText}>
                        {t("storyViewer.Delete")}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    // Opciones para otros usuarios
                    <>
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => {
                          setIsOptionsModalVisible(false);
                          toggleHideStories(); // Llama a la función para ocultar historias y cerrar el visor
                        }}
                      >
                        <Text style={styles.optionButtonText}>
                          {t("storyViewer.DontSeeMore")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => {
                          setIsOptionsModalVisible(false);
                          setIsComplaintsVisible(true); // Abre el modal de denuncias
                        }}
                      >
                        <Text style={styles.optionButtonText}>
                          {t("storyViewer.Report")}
                        </Text>
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
            setIsSubmittingReport(true);
            try {
              const currentStory =
                stories[currentIndex]?.userStories[storyIndex];

              // Validación para asegurar que `currentStory` y sus datos están disponibles
              if (!currentStory || !currentStory.uid || !currentStory.id) {
                Alert.alert(t("storyViewer.error"), t("storyViewer.hideError"));
                setIsSubmittingReport(false);
                return;
              }

              const reportData = {
                reason,
                description: description || "Sin descripción",
                reportedBy: auth.currentUser.uid,
                storyOwner: currentStory.uid,
                storyId: currentStory.id,
                timestamp: new Date(),
              };

              await addDoc(collection(database, "reports"), reportData);
              setIsComplaintsVisible(false);
            } catch (error) {
              console.error("Error al enviar la denuncia:", error);
            } finally {
              setIsSubmittingReport(false);
            }
          }}
        />

        <Modal
          animationType="fade"
          transparent={true}
          visible={isHideStoryModalVisible}
          onRequestClose={() => setIsHideStoryModalVisible(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setIsHideStoryModalVisible(false)}
          >
            <View style={styles.modalOverlay2}>
              <TouchableWithoutFeedback>
                <View style={styles.simpleModalContainer}>
                <TouchableOpacity
  onPress={() => {
    toggleHideMyStories({
      viewer: selectedViewer,
      user: auth.currentUser,
      database,
      setSelectedViewer,
      t,
    });
    setIsHideStoryModalVisible(false);
  }}
>

                    <Text style={styles.simpleModalText}>
                      {selectedViewer?.hideStoriesFrom?.includes(user.uid)
                        ? t("storyViewer.showMyStories")
                        : t("storyViewer.hideMyStories")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default StoryViewer;

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Alert,
  Keyboard,
  SafeAreaView,
  Dimensions,
  Image,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { auth, database, storage } from "../../../config/firebase";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import styles from "./StoryViewStyles";
import { useTranslation } from "react-i18next";
import Complaints from "../../Complaints/Complaints";
import StoryHeader from "./StoryHeader";
import ViewerItem from "./ViewerItem";
import StoryActions from "./StoryActions";
import StoryProgressBar from "./StoryProgressBar";
import OptionsModal from "./OptionsModal";
import ViewersModal from "./ViewersModal";
import useKeyboardListeners from "./useKeyboardListeners";
import StoryNavigationButtons from "./StoryNavigationButtons";
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
  toggleHideStories,
  addViewerToStory,
  handleSearch,
  handleOpenViewersModal,
  handleLongPressIn,
  handleLongPressOut,
  handlePrevious,
  handleTap,
  handleNext,
  preloadNextStory,
  handleCloseViewersModal,
  fetchBlockedUsers,
  fetchPinnedViewers,
  useStoryProgress,
  calculateHoursAgo,
} from "./storyUtils"; // Fix import path

const { width, height } = Dimensions.get("window"); // Add this line

export function StoryViewer({
  stories,
  initialIndex,
  onClose,
  unseenStories,
  navigation,
}) {
  const { t } = useTranslation();

  // Early validation
  const isValidStories = stories && Array.isArray(stories);
  const validStories = isValidStories
    ? stories.filter((story) => story && Array.isArray(story.userStories))
    : [];
  const isValidInitialIndex =
    typeof initialIndex === "number" &&
    initialIndex >= 0 &&
    initialIndex < validStories.length;

  useEffect(() => {
    if (!isValidStories) {
      console.error("Prop 'stories' no es un array válido:", stories);
      onClose?.();
    } else if (validStories.length === 0) {
      console.error("No hay historias válidas disponibles.");
      onClose?.();
    } else if (!isValidInitialIndex) {
      console.error("Índice inicial inválido:", initialIndex);
      onClose?.();
    }
  }, [stories, initialIndex, unseenStories]);

  const deserializedStories = isValidStories
    ? stories.map((storyGroup) => ({
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
      }))
    : [];

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [storyIndex, setStoryIndex] = useState(() => {
    const userStories = deserializedStories[initialIndex]?.userStories || [];
    const unseenIndex = userStories.findIndex(
      (story) =>
        !story.viewers?.some((viewer) => viewer.uid === auth.currentUser.uid)
    );
    return unseenIndex !== -1 ? unseenIndex : 0;
  });
  const [localStories, setLocalStories] = useState(() => [...stories]);
  const [localUnseenStories, setLocalUnseenStories] = useState(unseenStories);
  const [message, setMessage] = useState("");
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const longPressTimeout = useRef(null);
  const [likedStories, setLikedStories] = useState({}); // Estado para likes por historia
  const [viewers, setViewers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedViewers, setPinnedViewers] = useState([]);
  const [loadedImages, setLoadedImages] = useState({});
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isComplaintsVisible, setIsComplaintsVisible] = useState(false);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isHideStoryModalVisible, setIsHideStoryModalVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedViewer, setSelectedViewer] = useState(null); // Para almacenar el espectador seleccionado
  const [imageDimensions, setImageDimensions] = useState({
    width: "100%",
    height: "100%",
  });
  const [isLongPressActive, setIsLongPressActive] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const isKeyboardVisible = useKeyboardListeners();
  useEffect(() => {
    if (isKeyboardVisible) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [isKeyboardVisible]);

  const user = auth.currentUser;

  const currentStory = stories[currentIndex]?.userStories[storyIndex];

  useEffect(() => {
    if (!stories[currentIndex]?.userStories[storyIndex]) {
      onClose?.(localUnseenStories);
    }
  }, [currentIndex, storyIndex, stories, onClose, localUnseenStories]);

  useEffect(() => {
    if (isComplaintsVisible) {
      setIsPaused(true);
    } else if (!isOptionsModalVisible && !isKeyboardVisible) {
      setIsPaused(false);
    }
  }, [isComplaintsVisible, isOptionsModalVisible, isKeyboardVisible]);

  useEffect(() => {
    fetchBlockedUsers({ auth, database, setBlockedUsers });
  }, []);

  useEffect(() => {
    fetchPinnedViewers({ auth, database, setPinnedViewers });
  }, [auth.currentUser.uid, database]);

  const handleNextWrapper = () => {
    let nextCurrentIndex = currentIndex;
    let nextStoryIndex = storyIndex + 1;
    if (nextStoryIndex >= stories[currentIndex].userStories.length) {
      nextCurrentIndex = currentIndex + 1;
      nextStoryIndex = 0;
    }
    const nextStory = stories[nextCurrentIndex]?.userStories[nextStoryIndex];
    if (nextStory && !loadedImages[nextStory.id]) {
      console.log("La imagen de la siguiente historia aún no se cargó.");
      return;
    }
    handleNext({
      stories,
      currentIndex,
      setCurrentIndex,
      storyIndex,
      setStoryIndex,
      setProgress,
      onClose,
      localUnseenStories,
      setLocalUnseenStories,
    });
  };

  useStoryProgress({
    isPaused,
    isKeyboardVisible,
    isComplaintsVisible,
    progress,
    setProgress,
    onComplete: () =>
      handleNext({
        stories,
        currentIndex,
        setCurrentIndex,
        storyIndex,
        setStoryIndex,
        setProgress,
        onClose,
        localUnseenStories,
        setLocalUnseenStories,
      }),
  });

  useEffect(() => {
    if (isOptionsModalVisible) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [isOptionsModalVisible]);

  useEffect(() => {
    const currentStory = stories[currentIndex]?.userStories[storyIndex];
    if (!currentStory) {
      console.error("currentStory no válido");
      return; // Asegura que no se continúe si no es válido
    }

    if (auth.currentUser) {
      addViewerToStory({
        storyId: currentStory.id,
        storyOwnerId: currentStory.uid,
        auth,
        database,
      });

      // Obtener el estado actual del like desde Firestore
      const fetchLikeStatus = async () => {
        const storyRef = doc(
          database,
          "users",
          currentStory.uid,
          "stories",
          currentStory.id
        );
        const storySnap = await getDoc(storyRef);
        const storyData = storySnap.data();
        const userHasLiked = storyData?.likes?.some(
          (like) => like.uid === auth.currentUser.uid
        );
        setLikedStories((prevLikedStories) => ({
          ...prevLikedStories,
          [currentStory.id]: userHasLiked,
        }));
      };

      fetchLikeStatus();
    }

    const preloadBuffer = 5; // Aumentar el buffer de prefetch

    // Pre-cargar la siguiente historia si existe
    preloadNextStory({
      currentIndex,
      storyIndex,
      stories,
      loadedImages,
      setLoadedImages,
      preloadBuffer,
    });
  }, [currentIndex, storyIndex]);

  useEffect(() => {
    if (auth && auth.currentUser && currentStory?.id && currentStory?.uid) {
      addViewerToStory({
        storyId: currentStory.id,
        storyOwnerId: currentStory.uid,
        auth,
        database,
      });
    } else {
      console.error("auth o auth.currentUser no está disponible.");
    }
  }, [currentStory, auth, database]);

  const filteredViewers = viewers.filter((viewer) =>
    `${viewer.firstName} ${viewer.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const panResponder = createStoryPanResponder({
    handleCloseViewer: () => onClose(unseenStories),
    handleOpenViewersModal: () =>
      handleOpenViewersModal({
        setIsPaused,
        loadViewers,
        auth,
        database,
        stories: localStories,
        currentIndex,
        storyIndex,
        setViewers,
        setViewersModalVisible,
        t,
      }),
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

  const isCurrentUserStory =
    stories[currentIndex]?.uid === auth.currentUser?.uid;
  const isFirstStory = currentIndex === 0 && storyIndex === 0;

  const isLastStory =
    currentIndex === stories.length - 1 &&
    storyIndex === stories[currentIndex]?.userStories.length - 1;

  const hoursAgo = calculateHoursAgo(currentStory?.createdAt);

  const renderViewerItem = ({ item }) => (
    <ViewerItem
      item={item}
      currentStory={stories[currentIndex]?.userStories[storyIndex]}
      pinnedViewers={pinnedViewers}
      setPinnedViewers={setPinnedViewers}
      handleUserPress={async (selectedUser) => {
        await onClose(localUnseenStories);
        handleUserPress({
          selectedUser,
          database,
          navigation,
          t,
        });
      }}
      handlePinViewer={handlePinViewer}
      handleThreeDotsPress={handleThreeDotsPress}
      setViewersModalVisible={setViewersModalVisible}
      setIsPaused={setIsPaused}
      auth={auth}
      database={database}
      t={t}
      setSelectedViewer={setSelectedViewer}
      setIsHideStoryModalVisible={setIsHideStoryModalVisible}
      navigation={navigation} // Add navigation prop here
    />
  );

  useEffect(() => {
    const backAction = () => {
      onClose(localUnseenStories);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [onClose, localUnseenStories]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Ajusta según la interfaz
      >
        <View style={styles.container} {...panResponder.panHandlers}>
          <TouchableWithoutFeedback
            onPressIn={() => {
              handleLongPressIn({
                longPressTimeout,
                setIsPaused,
                setIsLongPressActive,
                setIsUIVisible,
              });
            }}
            onPressOut={() => {
              handleLongPressOut({
                longPressTimeout,
                setIsPaused,
                setIsLongPressActive,
                setIsUIVisible,
              });
            }}
            onPress={(event) =>
              handleTap({
                event,
                width: Dimensions.get("window").width,
                isLongPressActive,
                handleNext: handleNextWrapper,
                handlePrevious: () => {
                  if (currentStory) {
                    handlePrevious({
                      storyIndex,
                      setStoryIndex,
                      currentIndex,
                      setCurrentIndex,
                      stories: localStories,
                      setProgress,
                    });
                  }
                },
                onClose,
                stories: localStories,
                currentIndex,
                storyIndex,
                setStoryIndex, // Ensure setStoryIndex is passed
                setCurrentIndex,
                setProgress,
              })
            }
          >
            <View style={styles.storyContainer}>
              <View>
                {isUIVisible && (
                  <StoryProgressBar
                    userStories={stories[currentIndex]?.userStories || []}
                    currentStoryIndex={storyIndex}
                    progress={progress}
                  />
                )}
                <Image
                  key={currentStory.id}
                  source={{
                    uri: `${currentStory.storyUrl}?alt=media&w=1&h=1&q=1`,
                  }}
                  style={[styles.image, imageDimensions]}
                  fadeDuration={0}
                  priority="high"
                  loadingIndicatorSource={require("../../../assets/notification-icon.png")}
                  resizeMode="cover"
                  cachePolicy="memory-disk"
                  progressiveRenderingEnabled={true}
                  memoryCachePolicy="aggressive"
                  onLoadStart={() => {
                    currentStory.loadStartTime = Date.now();
                  }}
                  onLoad={(event) => {
                    const loadTime =
                      Date.now() - (currentStory.loadStartTime || Date.now());

                    const { width: imgWidth, height: imgHeight } =
                      event.nativeEvent.source;
                    const screenAspectRatio = width / height;
                    const imageAspectRatio = imgWidth / imgHeight;

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
                  onError={(error) => {
                    console.error(
                      `Error cargando historia ${currentStory.id}:`,
                      error
                    );
                  }}
                />
              </View>
              {isUIVisible && (
                <StoryHeader
                  currentStory={stories[currentIndex]}
                  user={auth.currentUser}
                  t={t}
                  hoursAgo={calculateHoursAgo(currentStory?.createdAt)}
                  onProfilePress={async () => {
                    // Lógica de navegación (similar a la que tienes)
                    await onClose(localUnseenStories);
                    if (stories[currentIndex]?.uid === auth.currentUser.uid) {
                      setTimeout(() => navigation.navigate("Profile"), 100);
                    } else {
                      setTimeout(() => {
                        navigation.navigate("UserProfile", {
                          selectedUser: {
                            id: stories[currentIndex].uid,
                            username: stories[currentIndex].username,
                            firstName: stories[currentIndex].username,
                            lastName: stories[currentIndex].lastName || "",
                            profileImage: stories[currentIndex].profileImage,
                          },
                        });
                      }, 100);
                    }
                  }}
                  onOptionsPress={() => setIsOptionsModalVisible(true)}
                />
              )}
            </View>
          </TouchableWithoutFeedback>

          {showSendConfirmation && (
            <View style={styles.sendConfirmation}>
              <Text style={styles.sendConfirmationText}>
                {t("storyViewer.sendMenssage")}
              </Text>
            </View>
          )}

          <StoryNavigationButtons
            isFirstStory={isFirstStory}
            isLastStory={isLastStory}
            onPrevious={() =>
              handlePrevious({
                storyIndex,
                setStoryIndex,
                currentIndex,
                setCurrentIndex,
                stories: localStories,
                setProgress,
              })
            }
            onNext={handleNextWrapper}
          />

          {!isCurrentUserStory && isUIVisible && (
            <StoryActions
              message={message}
              setMessage={setMessage}
              onSendMessage={() =>
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
              onLikePress={() =>
                handleLikeStory({
                  auth,
                  stories,
                  currentIndex,
                  storyIndex,
                  likedStories,
                  setLikedStories,
                  database,
                  t,
                })
              }
              isLiked={likedStories[currentStory?.id]}
              setIsPaused={setIsPaused}
              t={t}
            />
          )}

          <ViewersModal
            visible={viewersModalVisible}
            onClose={() =>
              handleCloseViewersModal({
                setViewersModalVisible,
                setIsPaused,
              })
            }
            filteredViewers={filteredViewers}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onDeleteStory={() => {
              setViewersModalVisible(false);
              setIsPaused(false);
              deleteStory({
                auth,
                stories: localStories,
                currentIndex,
                storyIndex,
                setStories: setLocalStories,
                onClose,
                database,
                storage,
                t,
              });
            }}
            renderViewerItem={renderViewerItem}
            t={t}
          />
        </View>

        <OptionsModal
          isVisible={isOptionsModalVisible}
          onClose={() => setIsOptionsModalVisible(false)}
          isCurrentUserStory={
            stories[currentIndex]?.uid === auth.currentUser?.uid
          }
          auth={auth}
          localStories={localStories}
          currentIndex={currentIndex}
          storyIndex={storyIndex}
          setLocalStories={setLocalStories}
          database={database}
          storage={storage}
          currentStory={stories[currentIndex]?.userStories[storyIndex]}
          toggleHideStories={toggleHideStories}
          localUnseenStories={localUnseenStories}
          t={t}
          setIsComplaintsVisible={setIsComplaintsVisible}
          deleteStory={deleteStory}
          styles={styles}
        />

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default StoryViewer;

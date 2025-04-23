import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Alert,
  Keyboard,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Image as ExpoImage } from "expo-image"
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
import StoryImage from "./StoryImage";
import useKeyboardListeners from "./useKeyboardListeners";
import StoryNavigationButtons from "./StoryNavigationButtons";
import useBackHandler from "./useBackHandler";
import { Animated } from "react-native";
import useUserRelations from "./useUserRelations";
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
  handleOpenViewersModal,
  handleLongPressIn,
  handleLongPressOut,
  handlePrevious,
  handleTap,
  handleNext,
  preloadNextStories,
  handleCloseViewersModal,
  useStoryProgress,
  calculateHoursAgo,
  fetchLoggedInUserData 
} from "./storyUtils"; // Fix import path


export function StoryViewer({
  stories,
  initialIndex,
  onClose,
  unseenStories,
  navigation,
  preloadedImages = {}, 
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
      onClose?.();
    } else if (!isValidInitialIndex) {
      console.error("Índice inicial inválido:", initialIndex);
      onClose?.();
    }
  }, [stories, initialIndex, unseenStories]);

  const deserializedStories = isValidStories
    ? stories.map((storyGroup) => ({
        ...storyGroup,
        userStories: storyGroup.userStories.map((story) => {
          const createdAtDate = story.createdAt?.toDate
            ? story.createdAt.toDate()
            : new Date(story.createdAt);
          const expiresAtDate = story.expiresAt?.toDate
            ? story.expiresAt.toDate()
            : new Date(story.expiresAt);
        
          return {
            ...story,
            createdAt: createdAtDate,
            expiresAt: expiresAtDate,
            hoursAgo: calculateHoursAgo(createdAtDate), // ✅ solucionamos acá
          };
        }),
        
      })).filter(group => group.userStories.length > 0)
    : [];

  // Close viewer if no stories remain
  useEffect(() => {
    if (deserializedStories.length === 0) {
      onClose?.(localUnseenStories);
    }
  }, [deserializedStories.length]);
  

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
  useEffect(() => {
    setMessage("");
  }, [currentIndex, storyIndex]);
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const longPressTimeout = useRef(null);
  const [likedStories, setLikedStories] = useState({}); // Estado para likes por historia
  const [viewers, setViewers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedImages, setLoadedImages] = React.useState(preloadedImages); 
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isComplaintsVisible, setIsComplaintsVisible] = useState(false);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isHideStoryModalVisible, setIsHideStoryModalVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedViewer, setSelectedViewer] = useState(null); // Para almacenar el espectador seleccionado
  const [isLongPressActive, setIsLongPressActive] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextStoryUrl, setNextStoryUrl] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { blockedUsers, pinnedViewers, setBlockedUsers, setPinnedViewers } =
    useUserRelations({ auth, database });
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
    // Validar que existan historias y sean válidas
    if (!stories || !Array.isArray(stories) || stories.length === 0) {
      onClose?.(localUnseenStories);
      return;
    }

    // Validar que el índice actual sea válido
    if (currentIndex >= stories.length) {
      onClose?.(localUnseenStories);
      return;
    }

    // Validar que la historia actual exista
    if (!stories[currentIndex]?.userStories?.[storyIndex]) {
      onClose?.(localUnseenStories);
      return;
    }
  }, [currentIndex, storyIndex, stories, onClose, localUnseenStories]);

  useEffect(() => {
    if (isComplaintsVisible) {
      setIsPaused(true);
    } else if (!isOptionsModalVisible && !isKeyboardVisible) {
      setIsPaused(false);
    }
  }, [isComplaintsVisible, isOptionsModalVisible, isKeyboardVisible]);

  // Esta es la función que se llama cuando tocas la pantalla para ir a la siguiente:
  const handleNextWrapper = () => {
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

  // Esta función se llama en onLoad de la imagen overlay
  // para hacer el cambio "real" de historia
  const handleNextReal = () => {
    // 2) Ya tenemos la historia precargada, ahora sí navegamos
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

    // 3) Apagamos la transición
    setIsTransitioning(false);
    setNextStoryUrl(null);
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
    preloadNextStories({
      currentIndex,
      storyIndex,
      stories,
      loadedImages,
      setLoadedImages,
      preloadBuffer: 7, // Puedes ajustar este número según lo que necesites
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
      
    }
  }, [currentStory, auth, database]);

  const filteredViewers = viewers.filter((viewer) =>
    `${viewer.firstName} ${viewer.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const panResponder = createStoryPanResponder({
    handleCloseViewer: () => {
      if (viewersModalVisible) {
        // Cierra solo el modal de espectadores
        handleCloseViewersModal({ setViewersModalVisible, setIsPaused });
      } else {
        // Cierra el visor de historias
        onClose(unseenStories);
      }
    },
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
  
  const onDeleteStory = () => {
    setViewersModalVisible(false);
    setIsPaused(false);
  
    deleteStory({
      auth,
      stories: localStories,
      currentIndex,
      storyIndex,
      setStories: setLocalStories,
      onClose, // ⬅ Cierra el visor de historias después de borrar
      database,
      storage,
      t,
    });
  };
  

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

  useBackHandler(() => onClose(localUnseenStories));

  console.log("🔍 storyUrl actual:", currentStory?.storyUrl);
console.log("🧪 loadedImages:", loadedImages);
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
               {loadedImages[currentStory?.id] ? (
  <ExpoImage
    source={{ uri: currentStory.storyUrl }}
    style={styles.image}
    contentFit="cover"            // similar a resizeMode="cover"
    transition={0}                // elimina el fade-in al cargar
    cachePolicy="memory-disk"     // usa caché para rendimiento
  />
) : (
  <Image
    source={require("../../../assets/notification-icon.png")}
    style={styles.image}
    resizeMode="cover"
  />
)}
                {isTransitioning && nextStoryUrl && (
                  <Image
                    source={{ uri: nextStoryUrl }}
                    style={[styles.imageOverlay, { opacity: 0 }]}
                    onLoad={() => {
                      // Cuando la imagen nueva está totalmente cargada,
                      // avanzamos de verdad a la siguiente historia:
                      handleNextReal();
                    }}
                  />
                )}
              </View>

              {isUIVisible && (
                <StoryHeader
                  currentStory={stories[currentIndex]}
                  user={auth.currentUser}
                  t={t}
                  hoursAgo={currentStory?.hoursAgo}
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
  isCurrentUserStory={stories[currentIndex]?.uid === auth.currentUser?.uid}
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
  onDeleteStory={onDeleteStory} // ✅ Ahora pasamos la función correctamente
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

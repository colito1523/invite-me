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
  Dimensions,
  Image,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, database, storage } from "../../../config/firebase";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import styles from "./StoryViewStyles";
import { useTranslation } from "react-i18next";
import Complaints from "../../Complaints/Complaints";
import ViewerItem from "./ViewerItem";
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
  toggleHideMyStories,
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
  calculateHoursAgo 
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
        !story.viewers?.some((viewer) => viewer.uid === auth.currentUser.uid),
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
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
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
        setIsPaused(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
        setIsPaused(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
          currentStory.id,
        );
        const storySnap = await getDoc(storyRef);
        const storyData = storySnap.data();
        const userHasLiked = storyData?.likes?.some(
          (like) => like.uid === auth.currentUser.uid,
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
      .includes(searchQuery.toLowerCase()),
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
      backAction,
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
                  resizeMode="cover" // Siempre usar "cover"
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
                      error,
                    );
                  }}
                />
              </View>

              {isUIVisible && (
                <View style={styles.userInfo}>
                  <TouchableOpacity
                    style={styles.userDetails}
                    onPress={async () => {
                      const currentStory = stories[currentIndex];
                      if (currentStory) {
                        await onClose(localUnseenStories);
                        if (currentStory.uid === auth.currentUser.uid) {
                          setTimeout(() => {
                            navigation.navigate("Profile");
                          }, 100);
                        } else {
                          setTimeout(() => {
                            navigation.navigate("UserProfile", {
                              selectedUser: {
                                id: currentStory.uid,
                                username: currentStory.username,
                                firstName: currentStory.username,
                                lastName: currentStory.lastName || "",
                                profileImage: currentStory.profileImage,
                              },
                            });
                          }, 100);
                        }
                      }
                    }}
                  >
                    <Image
                      key={`avatar-${stories[currentIndex]?.uid}`}
                      source={{
                        uri: `${stories[currentIndex]?.profileImage}?alt=media&w=10&h=10&q=5`,
                      }}
                      style={styles.avatar}
                      cachePolicy="memory-only"
                      resizeMode="cover"
                      progressiveRenderingEnabled={false}
                      defaultSource={require("../../../assets/perfil.jpg")}
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

          {!isFirstStory && (
            <TouchableOpacity
              style={[styles.navButton, styles.leftButton]}
              onPress={() =>
                handlePrevious({
                  storyIndex,
                  setStoryIndex,
                  currentIndex,
                  setCurrentIndex,
                  stories: localStories,
                  setProgress,
                })
              }
            ></TouchableOpacity>
          )}

          {!isLastStory && (
            <TouchableOpacity
              style={[styles.navButton, styles.rightButton]}
              onPress={handleNextWrapper}
            ></TouchableOpacity>
          )}

          {!isCurrentUserStory && isUIVisible && (
            <View style={styles.messageContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder={t("storyViewer.typePlaceholder")}
                placeholderTextColor="#FFFFFF"
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                }}
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
                    likedStories,
                    setLikedStories,
                    database,
                    t,
                  })
                }
              >
                <Ionicons
                  name={
                    likedStories[currentStory?.id] ? "heart" : "heart-outline"
                  }
                  size={24}
                  color={likedStories[currentStory?.id] ? "red" : "#FFFFFF"}
                />
              </TouchableOpacity>
            </View>
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={viewersModalVisible}
            onRequestClose={() =>
              handleCloseViewersModal({
                setViewersModalVisible,
                setIsPaused,
              })
            }
          >
            <TouchableWithoutFeedback
              onPress={() =>
                handleCloseViewersModal({
                  setViewersModalVisible,
                  setIsPaused,
                })
              }
            >
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
                            onChangeText={(query) =>
                              handleSearch({ query, setSearchQuery })
                            }
                          />
                          <View style={styles.searchInputDivider} />
                          <Text style={styles.searchInputCount}>
                            {filteredViewers.length}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => {
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
                          toggleHideStories({
                            user: auth.currentUser,
                            currentStory,
                            database,
                            onClose,
                            localUnseenStories,
                            t,
                          });
                          setIsOptionsModalVisible(false);
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default StoryViewer;

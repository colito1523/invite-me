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
import { Ionicons, Entypo, AntDesign } from "@expo/vector-icons";
import { auth, database, storage } from "../../config/firebase";
import {
  addDoc,
  collection,
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
  fetchPinnedViewers
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

  useEffect(() => {
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
  const [isLongPressActive, setIsLongPressActive] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);

  const user = auth.currentUser;

  const currentStory = stories[currentIndex]?.userStories[storyIndex];

  useEffect(() => {
    if (!currentStory) {
      onClose(); // Cierra el visor si no hay una historia actual válida
    }
  }, [currentStory, onClose]);

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

  useEffect(() => {
    let timer;
    if (!isPaused && !isKeyboardVisible && !isComplaintsVisible) {
      timer = setInterval(() => {
        if (progress < 1) {
          setProgress((prev) => prev + 0.002);
        } else {
          handleNextWrapper({
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
        }
      }, 10);
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
      addViewerToStory({
        storyId: currentStory.id,
        storyOwnerId: currentStory.uid,
        auth,
        database,
      });
      const userHasLiked = currentStory.likes?.some(
        (like) => like.uid === auth.currentUser.uid
      );
      setHasLiked(userHasLiked || false);
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

  if (!currentStory) {
    console.error("Historia actual no válida:", currentStory);
    onClose?.();
    return null;
  }

  const hoursAgo = currentStory?.createdAt
    ? Math.floor(
        (Date.now() - (currentStory.createdAt.toDate?.() || new Date(currentStory.createdAt))) / (1000 * 60 * 60)
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

  useEffect(() => {
    const backAction = () => {
      onClose(localUnseenStories);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
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
                {isUIVisible && <View style={styles.progressContainer}>
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
                </View>}
                <Image
                  key={currentStory.id}
                  source={{ uri: currentStory.storyUrl }}
                  style={[
                    styles.image,
                    imageDimensions,
                  ]}
                  fadeDuration={0}
                  priority="high"
                  loadingIndicatorSource={require('../../assets/notification-icon.png')}
                  resizeMode="cover" // Siempre usar "cover"
                  cachePolicy="memory-disk"
                  progressiveRenderingEnabled={true}
                  memoryCachePolicy="aggressive"
                  onLoadStart={() => {
                    currentStory.loadStartTime = Date.now();
                  }}
                  onLoad={(event) => {
                    const loadTime = Date.now() - (currentStory.loadStartTime || Date.now());
                    console.log(`Historia ${currentStory.id} cargada en ${loadTime}ms`);
                    
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
                    console.error(`Error cargando historia ${currentStory.id}:`, error);
                  }}
                />
              </View>

              {isUIVisible && <View style={styles.userInfo}>
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
              </View>}
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

          {/* {isCurrentUserStory && (
            <TouchableOpacity
              style={styles.viewersButton}
              onPress={() =>
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
                })
              }
            >
              <Entypo name="chevron-thin-up" size={24} color="white" />
            </TouchableOpacity>
          )} */}
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
                            onChangeText={(query) => handleSearch({ query, setSearchQuery })}
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
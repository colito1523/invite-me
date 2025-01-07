import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Text,
  Alert,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, database, storage } from "../../config/firebase";
import StoryViewer from "./StoryViewer";
import { useNavigation } from "@react-navigation/native";
import { Image } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";

export default React.forwardRef(function StorySlider(props, ref) {
  React.useImperativeHandle(ref, () => ({
    loadExistingStories,
  }));
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [stories, setStories] = useState([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);

  // Precargar historias cuando cambia el array de stories
  useEffect(() => {
    stories.forEach((item) => {
      if (item.userStories?.[0]?.storyUrl) {
        Image.prefetch(item.userStories[0].storyUrl);
      }
    });
  }, [stories]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [unseenStories, setUnseenStories] = useState({});
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (!isModalVisible && typeof pendingAction === "function") {
      pendingAction(); // Ejecuta solo si pendingAction es una función
      setPendingAction(null); // Resetea la acción pendiente
    }
  }, [isModalVisible, pendingAction]);

  const processImage = async (uri) => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        async (width, height) => {
          if (width > height) {
            try {
              const rotatedImage = await ImageManipulator.manipulateAsync(
                uri,
                [{ rotate: 90 }],
                { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
              );
              resolve(rotatedImage.uri);
            } catch (error) {
              console.error("Error al rotar la imagen:", error);
              reject(error);
            }
          } else {
            resolve(uri);
          }
        },
        (error) => {
          console.error(
            "Error al obtener las dimensiones de la imagen:",
            error,
          );
          reject(error);
        },
      );
    });
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
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadExistingStories();
  }, []);

  const getFriendsList = async (userId) => {
    const friendsRef = collection(database, "users", userId, "friends");
    const friendsSnapshot = await getDocs(friendsRef);
    return friendsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  const updateUnseenStories = (updatedUnseenStories) => {
    setUnseenStories((prev) => ({
      ...prev,
      ...updatedUnseenStories,
    }));
  };

  const handleStoryDeleted = (storyIndex, userStoryIndex) => {
    setStories((prevStories) => {
      const newStories = [...prevStories];
      newStories[storyIndex].userStories.splice(userStoryIndex, 1);

      if (newStories[storyIndex].userStories.length === 0) {
        newStories.splice(storyIndex, 1);
      }

      return newStories;
    });
  };

  const compressImage = async (uri, quality = 0.7, width = 1080) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width } }], // Cambia el tamaño de la imagen
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error("Error al comprimir la imagen:", error);
      throw error;
    }
  };

  const loadExistingStories = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(database, "users", user.uid));
      const userData = userDoc.data();
      const hiddenStories = userData.hiddenStories || [];
      const hideStoriesFrom = userData.hideStoriesFrom || [];
      const blockedUsers = userData.blockedUsers || [];

      const friendsList = await getFriendsList(user.uid);
      const loadedStories = [];
      const unseenStoriesTemp = {};
      const now = new Date();

      // Filtrar historias propias
      const userStoriesRef = collection(database, "users", user.uid, "stories");
      const userStoriesSnapshot = await getDocs(userStoriesRef);
      const userStories = userStoriesSnapshot.docs
        .map((doc) => doc.data())
        .filter((story) => new Date(story.expiresAt.toDate()) > now);

      if (userStories.length > 0 || isUploading) {
        loadedStories.unshift({
          uid: user.uid,
          username: userData.firstName || t("storySlider.currentUser"),
          lastName: userData.lastName || "",
          profileImage:
            userData.photoUrls?.[0] || "https://via.placeholder.com/150",
          userStories: userStories,
        });

        unseenStoriesTemp[user.uid] = userStories.filter(
          (story) =>
            !story.viewers?.some(
              (viewer) => viewer.uid === auth.currentUser.uid,
            ),
        );
      }

      // Filtrar historias de amigos
      for (let friend of friendsList) {
        if (
          hiddenStories.includes(friend.friendId) ||
          hideStoriesFrom.includes(friend.friendId) ||
          blockedUsers.includes(friend.friendId)
        ) {
          continue; // Excluir a usuarios en estas listas
        }

        const friendStoriesRef = collection(
          database,
          "users",
          friend.friendId,
          "stories",
        );
        const friendStoriesSnapshot = await getDocs(friendStoriesRef);
        const friendStories = friendStoriesSnapshot.docs
          .map((doc) => doc.data())
          .filter((story) => new Date(story.expiresAt.toDate()) > now);

        if (friendStories.length > 0) {
          const friendDocRef = doc(database, "users", friend.friendId);
          const friendDoc = await getDoc(friendDocRef);

          if (friendDoc.exists()) {
            const friendData = friendDoc.data();

            unseenStoriesTemp[friend.friendId] = friendStories.filter(
              (story) =>
                !story.viewers?.some(
                  (viewer) => viewer.uid === auth.currentUser.uid,
                ),
            );

            loadedStories.push({
              uid: friend.friendId,
              username: friendData.firstName || t("storySlider.friend"),
              lastName: friendData.lastName || "",
              profileImage:
                friendData.photoUrls?.[0] || "https://via.placeholder.com/150",
              userStories: friendStories,
            });
          }
        }
      }

      // Reorganizar las historias basado en si tienen historias sin ver
      const sortedStories = loadedStories.sort((a, b) => {
        const aHasUnseen = unseenStoriesTemp[a.uid]?.length > 0;
        const bHasUnseen = unseenStoriesTemp[b.uid]?.length > 0;

        if (aHasUnseen && !bHasUnseen) return -1;
        if (!aHasUnseen && bHasUnseen) return 1;
        return 0;
      });

      setStories(sortedStories);
      setUnseenStories(unseenStoriesTemp);
      // Precargar las imágenes de las primeras historias
      // Precargar solo la primera historia de cada usuario
      sortedStories.forEach((storyGroup) => {
        if (storyGroup.userStories && storyGroup.userStories[0]) {
          Image.prefetch(storyGroup.userStories[0].storyUrl)
            .then(() => {
              console.log(
                `Primera historia de ${storyGroup.username} precargada`,
              );
            })
            .catch((error) =>
              console.warn(
                `Error precargando historia de ${storyGroup.username}:`,
                error,
              ),
            );
        }
      });
    } catch (error) {
      console.error(t("storySlider.loadStoriesError"), error);
    }
  };

  const handleOpenViewer = async (index) => {
    const userStories = stories[index].userStories;
    const unseenIndex = userStories.findIndex(
      (story) =>
        !story.viewers?.some((viewer) => viewer.uid === auth.currentUser.uid),
    );

    setSelectedStoryIndex(index);
    setStoryViewerVisible(true);
    await AsyncStorage.setItem("lastViewedStoryIndex", JSON.stringify(index));
    setSelectedStoryIndex(index); // Ensure the correct story index is set
  };

  const handleAddStory = () => {
    setIsModalVisible(true);
  };

  const handleCamera = async () => {
    setPendingAction(() => async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t("storySlider.error"), t("storySlider.camera"));
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaType: "photo",
          quality: 1,
          allowsEditing: false,
        });

        if (!result.canceled && result.assets?.length > 0) {
          // Comprimir la imagen antes de procesarla
          const compressedUri = await compressImage(result.assets[0].uri);
          const processedUri = await processImage(compressedUri);
          setSelectedImage(processedUri);
        }
      } catch (error) {
        console.error("Error abriendo la cámara:", error);
        Alert.alert(t("storySlider.error"), t("storySlider.storyUploadError"));
      }
    });

    setIsModalVisible(false); // Cierra el modal
  };

  const handleGallery = async () => {
    setPendingAction(() => async () => {
      try {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t("storySlider.error"), t("storySlider.gallery"));
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });

        if (!result.canceled && result.assets?.length > 0) {
          // Comprimir la imagen antes de procesarla
          const compressedUri = await compressImage(result.assets[0].uri);
          const processedUri = await processImage(compressedUri);
          setSelectedImage(processedUri);
        }
      } catch (error) {
        console.error("Error seleccionando desde la galería:", error);
        Alert.alert(t("storySlider.error"), t("storySlider.storyUploadError"));
      }
    });

    setIsModalVisible(false); // Cierra el modal
  };

  const uploadStory = async (imageUri) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(t("storySlider.error"), t("storySlider.userAuthError"));
        return;
      }

      const userDocRef = doc(database, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        Alert.alert(t("storySlider.error"), t("storySlider.userDataNotFound"));
        return;
      }

      const userData = userDoc.data();
      const username = userData.firstName || t("storySlider.unknownUser");
      const profileImage = userData.photoUrls?.[0] || "default-image-url";

      const storyId = Date.now().toString();
      const storyRef = storageRef(storage, `historias/${user.uid}/${storyId}`);
      const response = await fetch(imageUri);
      const blob = await response.blob();

      setIsUploading(true);
      setUploadProgress(0);

      const uploadTask = uploadBytesResumable(storyRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error(t("storySlider.uploadError"), error);
          Alert.alert(
            t("storySlider.error"),
            t("storySlider.storyUploadError"),
          );
          setIsUploading(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const storiesRef = collection(database, "users", user.uid, "stories");
          const newStory = {
            uid: user.uid,
            username: username,
            profileImage: profileImage,
            storyUrl: downloadUrl,
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            id: storyId,
          };

          await setDoc(doc(storiesRef, storyId), newStory);

          loadExistingStories();
          setIsUploading(false);
        },
      );
    } catch (error) {
      console.error(t("storySlider.uploadError"), error);
      Alert.alert(t("storySlider.error"), t("storySlider.storyUploadError"));
      setIsUploading(false);
    }
  };

  const renderStory = ({ item, index }) => {
    const isCurrentUserStory = item.uid === auth.currentUser.uid;
    const hasStories = item.userStories && item.userStories.length > 0;
    const hasUnseenStories = unseenStories[item.uid]?.length > 0;

    return (
      <TouchableOpacity
        style={[
          styles.storyCircle,
          hasUnseenStories && styles.unseenStoryCircle, // Aplica borde gris si hay historias no vistas
          { borderColor: isNightMode ? "white" : "black" }, // Change border color based on night mode
        ]}
        onPress={() => {
          if (hasStories) {
            handleOpenViewer(index); // Llama directamente a handleOpenViewer
          }
        }}
      >
        {isUploading && isCurrentUserStory ? (
          <View style={styles.uploadingStoryContainer}>
            {hasStories && (
              <Image
                source={{ uri: item.profileImage }}
                style={styles.storyImage}
                cachePolicy="memory-disk"
              />
            )}
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{`${Math.round(
                uploadProgress,
              )}%`}</Text>
            </View>
          </View>
        ) : (
          hasStories && (
            <Image
              source={{ uri: item.profileImage }}
              style={styles.storyImage}
              cachePolicy="memory-disk"
            />
          )
        )}
      </TouchableOpacity>
    );
  };
  return (
    <ScrollView>
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          onPress={handleAddStory}
          style={styles.addStoryCircle}
        >
          <Ionicons
            name="add-circle-outline"
            size={40}
            color={isNightMode ? "#bbb7b7" : "black"}
          />
        </TouchableOpacity>
        <FlatList
          data={stories}
          renderItem={renderStory}
          keyExtractor={(item) => item.uid}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
        <Modal
          visible={!!selectedImage}
          transparent={true}
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.fullScreenContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
            />
            <TouchableOpacity
              style={styles.rejectIconContainer}
              onPress={() => setSelectedImage(null)} // Cierra el modal sin subir
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButtonContainer}
              onPress={() => {
                uploadStory(selectedImage); // Sube la imagen
                setSelectedImage(null); // Cierra el modal
              }}
            >
              <Text style={styles.acceptButtonText}>
                {" "}
                {t("storySlider.addStory")}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={24}
                color="rgba(0, 0, 0, 0.6)"
              />
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal
          visible={storyViewerVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => {
            setStoryViewerVisible(false);
            return true;
          }}
        >
          <StoryViewer
            stories={stories}
            initialIndex={selectedStoryIndex}
            onClose={(updatedUnseenStories) => {
              setStoryViewerVisible(false);
              setTimeout(() => {
                updateUnseenStories(updatedUnseenStories);
                // Reorganizar historias después de ver
                setStories((prev) => {
                  return [...prev].sort((a, b) => {
                    const aHasUnseen = updatedUnseenStories[a.uid]?.length > 0;
                    const bHasUnseen = updatedUnseenStories[b.uid]?.length > 0;
                    if (aHasUnseen && !bHasUnseen) return -1;
                    if (!aHasUnseen && bHasUnseen) return 1;
                    return 0;
                  });
                });
                loadExistingStories();
              }, 0);
            }}
            onStoryDeleted={handleStoryDeleted}
            unseenStories={unseenStories}
            navigation={navigation}
          />
        </Modal>
        <Modal
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.option} onPress={handleCamera}>
                  <Ionicons name="camera-outline" size={24} color="black" />
                  <Text style={styles.optionText}>
                    {t("storySlider.camera")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.option} onPress={handleGallery}>
                  <Ionicons name="images-outline" size={24} color="black" />
                  <Text style={styles.optionText}>
                    {t("storySlider.gallery")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  sliderContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
    alignItems: "center",
    marginVertical: 10,
    marginBottom: 30,
  },
  addStoryCircle: {
    marginRight: 10,
  },
  storyCircle: {
    marginRight: 10,
    alignItems: "center",
  },
  unseenStoryCircle: {
    borderWidth: 2,
    borderRadius: 35,
    padding: 2,
  },
  storyImage: {
    width: 65,
    height: 65,
    borderRadius: 35,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  uploadingStoryContainer: {
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircle: {
    position: "absolute",
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  rejectIconContainer: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  acceptButtonContainer: {
    position: "absolute",
    bottom: 40,
    right: 10,
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButtonText: {
    color: "rgba(0, 0, 0, 0.6)",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 15,
  },
});

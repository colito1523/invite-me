import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  Text,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { loadExistingStories, uploadStory, loadStoriesInBatches, compressImage, openCustomCamera } from './storySliderUtils';
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, database, storage } from "../../../config/firebase";
import StoryViewer from "../storyViewer/StoryViewer";
import { useNavigation } from "@react-navigation/native";
import { Image } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import styles from "./StorySliderStyles";

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

  // Add default value for props.route
  const route = props.route || {};

  useEffect(() => {
    if (stories.length > 0) {
      loadStoriesInBatches(stories);
    }
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


  useEffect(() => {
    loadExistingStories(t, setStories, setUnseenStories, isUploading);
  }, []);

  useEffect(() => {
    if (route.params?.photoUri) {
      setSelectedImage(route.params.photoUri);
    }
  }, [route.params?.photoUri]);

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
    navigation.navigate("CustomCamera");
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


const renderStory = ({ item, index }) => {
  const isCurrentUserStory = item.uid === auth.currentUser.uid;
  const hasStories = item.userStories && item.userStories.length > 0;
  const hasUnseenStories = unseenStories[item.uid]?.length > 0;

  return (
    <View
      style={[
        styles.storyImageWrapper,
        hasStories ? {
          borderWidth: 2,
          borderStyle: hasUnseenStories ? 'solid' : 'dotted',
          borderColor: isNightMode ? 'white' : 'black',
          borderRadius: styles.storyCircle.borderRadius + 2,
          opacity: hasUnseenStories ? 1 : 0.7,
        } : {
          borderWidth: 0
        }
      ]}
    >
      <TouchableOpacity
        style={styles.storyCircle}
        onPress={() => {
          if (hasStories) {
            handleOpenViewer(index);
          }
        }}
      >
        {hasStories ? (
          <Image
            source={{
              uri: `${item.profileImage}?alt=media&w=50&h=50&q=2` || "https://via.placeholder.com/50",
            }}
            style={[styles.storyImage]}
            defaultSource={require("../../../assets/perfil.jpg")}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={{ uri: "https://via.placeholder.com/100" }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};


  return (
    <ScrollView 
      horizontal={false} 
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sliderContainer}>
        <FlatList
          data={[{ uid: "addStory" }, ...stories]}
          renderItem={({ item, index }) =>
            item.uid === "addStory" ? (
              <TouchableOpacity
                onPress={handleAddStory}
                style={[styles.addStoryCircle, styles.centeredAddStoryCircle]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={40}
                  color={isNightMode ? "#bbb7b7" : "black"}
                />
              </TouchableOpacity>
            ) : (
              renderStory({ item, index: index - 1 })
            )
          }
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
                uploadStory(
                  selectedImage, // La URI de la imagen seleccionada
                  t, // Traducción
                  setIsUploading, // Estado para mostrar si está subiendo
                  setUploadProgress, // Estado para mostrar progreso
                  setStories, // Actualiza las historias
                  setUnseenStories // Actualiza las historias no vistas
                );
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
              updateUnseenStories(updatedUnseenStories);
              loadExistingStories(t, setStories, setUnseenStories, isUploading);
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
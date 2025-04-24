"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  TouchableOpacity,
  FlatList,
  Text,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  ActivityIndicator,
  Image
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import { loadExistingStories, uploadStory, loadStoriesInBatches, compressImage } from "./storySliderUtils"
import { doc, getDoc } from "firebase/firestore"
import { auth, database } from "../../../config/firebase"
import StoryViewer from "../storyViewer/StoryViewer"
import { useNavigation } from "@react-navigation/native"
import { Image as ExpoImage } from "expo-image" 
import { useTranslation } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImageManipulator from "expo-image-manipulator"
import styles from "./StorySliderStyles"

export default React.forwardRef(function StorySlider(props, ref) {
  React.useImperativeHandle(ref, () => ({
    loadExistingStories: () => loadExistingStories(t, setStories, setUnseenStories, isUploading),
    forceUpdate: () => {
      loadStoriesInBatches(stories)
      loadExistingStories(t, setStories, setUnseenStories, isUploading)
    },
  }))
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [stories, setStories] = useState([])
  const [storyViewerVisible, setStoryViewerVisible] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isNightMode, setIsNightMode] = useState(false)
  const [isPreloading, setIsPreloading] = useState(false);
  const [cachedImages, setCachedImages] = useState({});

  // Add default value for props.route
  const route = props.route || {}

  useEffect(() => {
    if (stories.length > 0) {
      loadStoriesInBatches(stories)
    }
  }, [stories])

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [unseenStories, setUnseenStories] = useState({})
  const [blockedUsers, setBlockedUsers] = useState([])
  const [pendingAction, setPendingAction] = useState(null)

  // Función para obtener la URL de la imagen de perfil del usuario actual
  const getUserProfileImage = async () => {
    try {
      const user = auth.currentUser
      if (!user) return "https://via.placeholder.com/50"

      const userDoc = await getDoc(doc(database, "users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        return userData.photoUrls?.[0] || user.photoURL || "https://via.placeholder.com/50"
      }

      return user.photoURL || "https://via.placeholder.com/50"
    } catch (error) {
      console.error("Error al obtener la imagen de perfil:", error)
      return "https://via.placeholder.com/50"
    }
  }

  // Estado para almacenar la URL de la imagen de perfil
  const [userProfileImage, setUserProfileImage] = useState("https://via.placeholder.com/50")

  // Cargar la imagen de perfil al iniciar
  useEffect(() => {
    getUserProfileImage().then((imageUrl) => {
      setUserProfileImage(imageUrl)
    })
  }, [])

  useEffect(() => {
    if (!isModalVisible && typeof pendingAction === "function") {
      pendingAction() // Ejecuta solo si pendingAction es una función
      setPendingAction(null) // Resetea la acción pendiente
    }
  }, [isModalVisible, pendingAction])

  const processImage = async (uri) => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        async (width, height) => {
          if (width > height) {
            try {
              const rotatedImage = await ImageManipulator.manipulateAsync(uri, [{ rotate: 90 }], {
                compress: 1,
                format: ImageManipulator.SaveFormat.JPEG,
              })
              resolve(rotatedImage.uri)
            } catch (error) {
              console.error("Error al rotar la imagen:", error)
              reject(error)
            }
          } else {
            resolve(uri)
          }
        },
        (error) => {
          console.error("Error al obtener las dimensiones de la imagen:", error)
          reject(error)
        },
      )
    })
  }

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        const userDoc = await getDoc(doc(database, "users", user.uid))
        const blockedList = userDoc.data()?.blockedUsers || []
        setBlockedUsers(blockedList)
      } catch (error) {
        console.error("Error fetching blocked users:", error)
      }
    }

    fetchBlockedUsers()
  }, [])

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours()
      setIsNightMode(currentHour >= 19 || currentHour < 6)
    }

    checkTime()
    const interval = setInterval(checkTime, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadExistingStories(t, (newStories) => {
      setStories(newStories)
  
      // 👉 Log solo una vez al cargar

    }, setUnseenStories, isUploading)
  }, [])
  useEffect(() => {
    const preloadImages = async () => {
      const newCache = {};

       // Precargar en paralelo para mayor velocidad
  const preloadPromises = stories.map(async (story) => {
    const urls = story.userStories?.map(s => s.storyUrl).filter(Boolean) || [];
    
    // Precargar todas las imágenes de esta historia
    await Promise.all(urls.map(async (url) => {
      try {
        await ExpoImage.prefetch(url); 
        (newCache[story.uid] ||= []).push(url);
      } catch (e) {
      }
    }));
    
    if (urls.length > 0) {
      newCache[story.uid] = urls;
    }
  });

  await Promise.all(preloadPromises);
  setCachedImages(newCache);
  console.log("📦 Todas las imágenes precargadas:", newCache);
};
  
  
    if (stories.length > 0) {
      preloadImages();
    }
  }, [stories]);
  
  

  const updateUnseenStories = (updatedUnseenStories) => {
    setUnseenStories((prev) => ({
      ...prev,
      ...updatedUnseenStories,
    }))
  }

  const handleStoryDeleted = (storyIndex, userStoryIndex) => {
    setStories((prevStories) => {
      const newStories = [...prevStories]
      newStories[storyIndex].userStories.splice(userStoryIndex, 1)

      if (newStories[storyIndex].userStories.length === 0) {
        newStories.splice(storyIndex, 1)
      }

      return newStories
    })
  }

  useEffect(() => {
    let isMounted = true
    const safeSetStories = (stories) => {
      if (isMounted) setStories(stories)
    }
    const safeSetUnseenStories = (unseen) => {
      if (isMounted) setUnseenStories(unseen)
    }

    loadExistingStories(t, safeSetStories, safeSetUnseenStories, isUploading)

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (route.params?.photoUri) {
      setSelectedImage(route.params.photoUri)
    }
  }, [route.params?.photoUri])

  const preloadedIds = {};
  stories.forEach((group) => {
    group.userStories.forEach((us) => {
      if (cachedImages[group.uid]?.includes(us.storyUrl)) {
        preloadedIds[us.id] = true;       // ➕ sólo si SÍ está en caché expo-image
      }
    });
  });


  const handleOpenViewer = async (index) => {
    const userStories = stories[index]?.userStories || [];
    const unseenIndex = userStories.findIndex(
      (story) => !story.viewers?.some((viewer) => viewer.uid === auth.currentUser.uid)
    );
    
    // Precargar la primera imagen
    setIsPreloading(true);
    try {
      const story = stories[index];
const fallbackImage = story.userStories[unseenIndex !== -1 ? unseenIndex : 0]?.storyUrl;

// ✅ Verificamos si esa imagen ya está en el array de imágenes precargadas
const isImageCached = cachedImages[story.uid]?.includes(fallbackImage);

if (!isImageCached) {
  try {
    await ExpoImage.prefetch(fallbackImage); 

    // 🧠 Extra: asegurar que la imagen fue *realmente* usada por el sistema de cache
    await new Promise((resolve) => {
      Image.getSize(fallbackImage, () => resolve(), () => resolve());
    });

  } catch (error) {
    console.error("Error preloading image:", error);
  }
}

    } catch (error) {
      console.error("Error preloading image:", error);
    }
    setIsPreloading(false);
  
    setSelectedStoryIndex(index);
    setStoryViewerVisible(true);
    await AsyncStorage.setItem("lastViewedStoryIndex", JSON.stringify(index));
  };

  const handleAddStory = () => {
    navigation.navigate("Camera")
  }

  const handleCamera = async () => {
    setIsModalVisible(false) // Close the modal
    navigation.navigate("Camera")
  }

  const handleGallery = async () => {
    setPendingAction(() => async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== "granted") {
          Alert.alert(t("storySlider.error"), t("storySlider.gallery"))
          return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        })

        if (!result.canceled && result.assets?.length > 0) {
          // Comprimir la imagen antes de procesarla
          const compressedUri = await compressImage(result.assets[0].uri)
          const processedUri = await processImage(compressedUri)
          setSelectedImage(processedUri)
        }
      } catch (error) {
        console.error("Error seleccionando desde la galería:", error)
        Alert.alert(t("storySlider.error"), t("storySlider.storyUploadError"))
      }
    })

    setIsModalVisible(false) // Cierra el modal
  }

const renderStory = ({ item, index }) => {
  const isCurrentUserStory = item.uid === auth.currentUser?.uid
  const hasStories = item.userStories && item.userStories.length > 0
  const hasUnseenStories = unseenStories[item.uid]?.length > 0

  return (
    <View
      style={[
        styles.storyImageWrapper,
        hasStories && {
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: isNightMode ? "white" : "black",
          borderRadius: styles.storyCircle.borderRadius + 2,
          opacity: isCurrentUserStory ? 1 : hasUnseenStories ? 1 : 0.2,
          marginRight: isCurrentUserStory ? 25 : 4, // 💥 margen correcto afuera del borde blanco
        },
      ]}
    >
  <View
  style={[
    styles.storyCircleWrapper,
  ]}
>
  <TouchableOpacity
    style={styles.storyCircle}
    onPress={() => {
      if (hasStories) handleOpenViewer(index)
    }}
  >
    <Image
      source={{
        uri: `${item.profileImage}?alt=media&w=50&h=50&q=1` || "https://via.placeholder.com/50",
      }}
      style={styles.storyImage}
      defaultSource={require("../../../assets/perfil.jpg")}
      resizeMode="cover"
    />
  </TouchableOpacity>

  {isCurrentUserStory && (
    <TouchableOpacity
      style={styles.addIconOverlay}
      onPress={handleAddStory}
    >
      <Ionicons name="add" size={20} color="white" />
    </TouchableOpacity>
  )}
</View>

    </View>
  )
}


  // Verificar si el usuario actual ya tiene historias
  const userHasStories = stories.some((story) => story.uid === auth.currentUser?.uid)

  return (
    <ScrollView horizontal={false} scrollEnabled={false} showsVerticalScrollIndicator={false}>
      <View style={styles.sliderContainer}>
        <FlatList
          data={userHasStories ? stories : [{ uid: "addStory" }, ...stories]}
          initialNumToRender={8} // Renderiza las primeras 4 bolas al instante
          maxToRenderPerBatch={8} // Limita el renderizado por lote
          windowSize={10} // Ajusta el tamaño de la ventana de renderizado
          renderItem={({ item, index }) =>
            item.uid === "addStory" ? (
              <View style={[styles.addStoryCircle, styles.centeredAddStoryCircle]}>
              <View style={styles.storyCircleWrapper}>
                <TouchableOpacity style={styles.storyCircle} onPress={handleAddStory}>
                  <Image
                    source={{ uri: userProfileImage }}
                    style={styles.storyImage}
                    defaultSource={require("../../../assets/perfil.jpg")}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addIconOverlay}
                  onPress={handleAddStory}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            
            ) : (
              renderStory({ item, index: userHasStories ? index : index - 1 })
            )
          }
          keyExtractor={(item) => item.uid}
          horizontal
          showsHorizontalScrollIndicator={false}
        />

        <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
          <View style={styles.fullScreenContainer}>
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
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
                  setUnseenStories, // Actualiza las historias no vistas
                )
                setSelectedImage(null) // Cierra el modal
              }}
            >
              <Text style={styles.acceptButtonText}> {t("storySlider.addStory")}</Text>
              <Ionicons name="arrow-forward" size={24} color="rgba(0, 0, 0, 0.6)" />
            </TouchableOpacity>
          </View>
        </Modal>

  
<Modal
  visible={storyViewerVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => {
    setStoryViewerVisible(false)
    return true
  }}
>
  <Animated.View style={{ flex: 1, backgroundColor: 'black' }}>
    {isPreloading ? (
      <View style={styles.loadingPlaceholder}>
        <ActivityIndicator size="large" color="white" />
      </View>
    ) : (
      <StoryViewer
        stories={stories}
        initialIndex={selectedStoryIndex}
        preloadedImages={preloadedIds}
        onClose={(updatedUnseenStories) => {
          setStoryViewerVisible(false)
          updateUnseenStories(updatedUnseenStories)
          loadExistingStories(t, setStories, setUnseenStories, isUploading)
        }}
        onStoryDeleted={handleStoryDeleted}
        unseenStories={unseenStories}
        navigation={navigation}
      />
    )}
  </Animated.View>
</Modal>
        <Modal transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.option} onPress={handleCamera}>
                  <Ionicons name="camera-outline" size={24} color="black" />
                  <Text style={styles.optionText}>{t("storySlider.camera")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.option} onPress={handleGallery}>
                  <Ionicons name="images-outline" size={24} color="black" />
                  <Text style={styles.optionText}>{t("storySlider.gallery")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </ScrollView>
  )
})

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet, Text, Alert, Modal, Platform, TouchableWithoutFeedback, RefreshControl, ScrollView} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, getDoc, getDocs, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, database, storage } from '../../config/firebase';
import StoryViewer from './StoryViewer';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StorySlider() {
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [stories, setStories] = useState([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [unseenStories, setUnseenStories] = useState({});
  const [blockedUsers, setBlockedUsers] = useState([]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExistingStories(); // Recargar las historias
    setRefreshing(false);
  };

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
    const friendsRef = collection(database, 'users', userId, 'friends');
    const friendsSnapshot = await getDocs(friendsRef);
    return friendsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const updateUnseenStories = (updatedUnseenStories) => {
    setUnseenStories(updatedUnseenStories); // Actualiza el estado inmediatamente
  };

  const handleStoryDeleted = (storyIndex, userStoryIndex) => {
    setStories(prevStories => {
      const newStories = [...prevStories];
      newStories[storyIndex].userStories.splice(userStoryIndex, 1);
      
      if (newStories[storyIndex].userStories.length === 0) {
        newStories.splice(storyIndex, 1);
      }
      
      return newStories;
    });
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
          profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
          userStories: userStories,
        });
  
        unseenStoriesTemp[user.uid] = userStories.filter(
          (story) => !story.viewers?.some((viewer) => viewer.uid === auth.currentUser.uid)
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
  
        const friendStoriesRef = collection(database, "users", friend.friendId, "stories");
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
              (story) => !story.viewers?.some((viewer) => viewer.uid === auth.currentUser.uid)
            );
  
            loadedStories.push({
              uid: friend.friendId,
              username: friendData.firstName || t("storySlider.friend"),
              lastName: friendData.lastName || "",
              profileImage: friendData.photoUrls?.[0] || "https://via.placeholder.com/150",
              userStories: friendStories,
            });
          }
        }
      }
  
      setStories(loadedStories);
      setUnseenStories(unseenStoriesTemp);
    } catch (error) {
      console.error(t("storySlider.loadStoriesError"), error);
    }
  };
  
  
  
  
  const handleOpenViewer = async (index) => {
    setSelectedStoryIndex(index);
    setStoryViewerVisible(true);
    await AsyncStorage.setItem('lastViewedStoryIndex', JSON.stringify(index));
};

  const handleAddStory = () => {
    setIsModalVisible(true);
  };

  const handleCamera = async () => {
    try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permiso denegado", "Se necesita acceso a la cámara.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // Ajustado
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled && result.assets?.length > 0) {
            await uploadStory(result.assets[0].uri);
        }
    } catch (error) {
        console.error("Error al abrir la cámara:", error);
        Alert.alert("Error", "Hubo un problema al intentar abrir la cámara.");
    } finally {
        setIsModalVisible(false);
    }
};


const handleGallery = async () => {
  try {
    // Solicitar permisos para la galería
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permiso denegado", "Se necesita acceso a la galería.");
      return;
    }

    // Abrir la galería y seleccionar una imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Ajustado
      allowsEditing: false,
      quality: 1,
    });

    // Manejar la selección de la imagen
    if (!result.canceled && result.assets?.length > 0) {
      setSelectedImage(result.assets[0].uri); // Muestra la imagen en el modal
    } else {
      Alert.alert("Operación cancelada", "No se seleccionó ninguna imagen.");
    }
  } catch (error) {
    console.error("Error al abrir la galería:", error);
    Alert.alert("Error", "Hubo un problema al intentar abrir la galería.");
  }
};




  const uploadStory = async (imageUri) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(t('storySlider.error'), t('storySlider.userAuthError'));
        return;
      }
  
      const userDocRef = doc(database, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        Alert.alert(t('storySlider.error'), t('storySlider.userDataNotFound'));
        return;
      }
  
      const userData = userDoc.data();
      const username = userData.firstName || t('storySlider.unknownUser');
      const profileImage = userData.photoUrls?.[0] || 'default-image-url';
  
      const storyId = Date.now().toString();
      const storyRef = ref(storage, `historias/${user.uid}/${storyId}`);
      const response = await fetch(imageUri);
      const blob = await response.blob();

      setIsUploading(true);
      setUploadProgress(0);

      const uploadTask = uploadBytesResumable(storyRef, blob);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error(t('storySlider.uploadError'), error);
          Alert.alert(t('storySlider.error'), t('storySlider.storyUploadError'));
          setIsUploading(false);
        }, 
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const storiesRef = collection(database, 'users', user.uid, 'stories');
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
        }
      );
    } catch (error) {
      console.error(t('storySlider.uploadError'), error);
      Alert.alert(t('storySlider.error'), t('storySlider.storyUploadError'));
      setIsUploading(false);
    }
  };

  const renderStory = ({ item, index }) => {
    const isCurrentUserStory = item.uid === auth.currentUser.uid;
    const hasStories = item.userStories && item.userStories.length > 0;
    const hasUnseenStories = unseenStories[item.uid]?.length > 0; // Verifica si hay historias no vistas
  
    return (
      <TouchableOpacity
        style={[
          styles.storyCircle,
          hasUnseenStories && styles.unseenStoryCircle // Aplica borde gris si hay historias no vistas
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
              <Image source={{ uri: item.profileImage }} style={styles.storyImage} cachePolicy="memory-disk" />
            )}
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{`${Math.round(uploadProgress)}%`}</Text>
            </View>
          </View>
        ) : (
          hasStories && (
            <Image source={{ uri: item.profileImage }} style={styles.storyImage} cachePolicy="memory-disk" />
          )
        )}
      </TouchableOpacity>
    );
  };
  return (
    <ScrollView
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }
  >
    
    <View style={styles.sliderContainer}>
      <TouchableOpacity onPress={handleAddStory} style={styles.addStoryCircle}>
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
            <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <View style={styles.previewActions}>
                    <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => setSelectedImage(null)} // Cierra el modal sin subir
                    >
                        <Text style={styles.buttonTextReject}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => {
                            uploadStory(selectedImage);
                            setSelectedImage(null); // Sube y cierra el modal
                        }}
                    >
                        <Text style={styles.buttonText}>Subir</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
      <Modal
        visible={storyViewerVisible}
        transparent={false}
        animationType="slide"
      >
    <StoryViewer
  stories={stories}
  initialIndex={selectedStoryIndex}
  onClose={(updatedUnseenStories) => {
    setStoryViewerVisible(false);
    updateUnseenStories(updatedUnseenStories); // Sincroniza `unseenStories` en tiempo real
    loadExistingStories(); // Recarga las historias inmediatamente
  }}
  onStoryDeleted={handleStoryDeleted}
  unseenStories={unseenStories} // Pasa `unseenStories` al visor
  navigation={navigation}
/>
      </Modal>
      <Modal
  animationType="slide"
  transparent={true}
  visible={isModalVisible}
  onRequestClose={() => setIsModalVisible(false)}
>
  <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
    <View style={styles.modalContainer}>
      <TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.option} onPress={handleCamera}>
            <Ionicons name="camera-outline" size={24} color="black" />
            <Text style={styles.optionText}>{t('storySlider.camera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={handleGallery}>
            <Ionicons name="images-outline" size={24} color="black" />
            <Text style={styles.optionText}>{t('storySlider.gallery')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>
    </View>
     </ScrollView>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 30
  },
  addStoryCircle: {
    marginRight: 10,
  },
  storyCircle: {
    marginRight: 10,
    alignItems: 'center',
  },
  storyImage: {
    width: 65,
    height: 65,
    borderRadius: 35,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
},
previewImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
    marginBottom: 20,
},
previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
},
rejectButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
},
uploadButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
},
buttonText: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
},
buttonTextReject: {
  color: 'white',
  fontWeight: 'bold',
  textAlign: 'center',
},
unseenStoryCircle: {
  borderColor: 'black',
  borderWidth: 3,
  borderRadius: 40,
}
});
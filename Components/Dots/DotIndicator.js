import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {collection,
  getDocs,
  doc,
  getDoc} from "firebase/firestore";
  import { database, auth, } from "../../config/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import StoryViewer from '../Stories/StoryViewer';

const { width } = Dimensions.get("window");

const DotIndicator = ({ profileImages, attendeesList }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAttendees, setFilteredAttendees] = useState(attendeesList);
  const navigation = useNavigation();
  const [isNightMode, setIsNightMode] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [filteredImages, setFilteredImages] = useState(profileImages);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStories, setSelectedStories] = useState([]);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const userRef = doc(database, "users", auth.currentUser.uid);
        const userSnapshot = await getDoc(userRef);
        const blockedList = userSnapshot.data()?.blockedUsers || [];
        setBlockedUsers(blockedList);
      } catch (error) {
        console.error("Error fetching blocked users:", error);
      }
    };
  
    fetchBlockedUsers();
  }, []);

  const checkStories = async () => {
    try {
        const attendeesWithStories = attendeesList.map((attendee) => ({
            ...attendee,
            hasStories: false,
            userStories: [],
        }));
  
        for (const attendee of attendeesWithStories) {
            const userDocRef = doc(database, "users", attendee.uid);
            const storiesRef = collection(userDocRef, "stories");
            const storiesSnapshot = await getDocs(storiesRef);
  
            const now = new Date();
            const userStories = storiesSnapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    expiresAt: doc.data().expiresAt?.toDate(),
                }))
                .filter((story) => story.expiresAt > now);
  
            if (userStories.length > 0) {
                attendee.hasStories = true;
                attendee.userStories = userStories;
            }
        }
  
        setFilteredAttendees(attendeesWithStories);
    } catch (error) {
        console.error("Error verificando historias:", error);
    }
  };

  useEffect(() => {
    checkStories();
  }, [attendeesList]);

  

  useEffect(() => {
    const updateFilteredImages = () => {
      const filtered = profileImages.filter(
        (_, index) => !blockedUsers.includes(attendeesList[index]?.uid) // Filtra imágenes asociadas a usuarios bloqueados
      );
      setFilteredImages(filtered);
    };
  
    updateFilteredImages();
  }, [profileImages, blockedUsers, attendeesList]);

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
    if (searchTerm.trim() === '') {
      setFilteredAttendees(
        attendeesList.filter(
          (attendee) => !blockedUsers.includes(attendee.uid) // Excluir usuarios bloqueados
        )
      );
    } else {
      const filtered = attendeesList.filter(
        (attendee) =>
          !blockedUsers.includes(attendee.uid) && // Excluir usuarios bloqueados
          attendee.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAttendees(filtered);
    }
  }, [searchTerm, attendeesList, blockedUsers]);
  

  const handlePress = () => {
    setModalVisible(true);
  };

  const handleUserPress = async (uid) => {
    if (blockedUsers.includes(uid)) {
        Alert.alert("Error", "No puedes interactuar con este usuario.");
        return;
    }

    // Si el usuario actual hace clic en su propio perfil
    if (auth.currentUser?.uid === uid) {
        navigation.navigate("Profile", { selectedUser: auth.currentUser });
        return;
    }

    try {
        const userDoc = await getDoc(doc(database, "users", uid));
        if (!userDoc.exists()) {
            Alert.alert("Error", "No se encontraron detalles para este usuario.");
            return;
        }

        const userData = userDoc.data();
        userData.id = uid;
        userData.profileImage =
            userData.photoUrls && userData.photoUrls.length > 0
                ? userData.photoUrls[0]
                : "https://via.placeholder.com/150";

        // Verificar historias activas
        const storiesRef = collection(database, "users", uid, "stories");
        const storiesSnapshot = await getDocs(storiesRef);
        const now = new Date();
        const activeStories = storiesSnapshot.docs
            .map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt,
                    expiresAt: data.expiresAt,
                    storyUrl: data.storyUrl,
                    profileImage: data.profileImage || userData.profileImage,
                    uid: uid,
                    username: data.username || userData.username || "Unknown",
                    viewers: data.viewers || [],
                    likes: data.likes || [],
                };
            })
            .filter((story) => new Date(story.expiresAt.toDate()) > now);

        if (activeStories.length > 0) {
            setSelectedStories([
                {
                    uid: uid,
                    username: userData.username || "Unknown",
                    profileImage: userData.profileImage,
                    userStories: activeStories,
                },
            ]);
            setIsModalVisible(true); // Mostrar el modal
        } else {
            navigation.navigate("UserProfile", { selectedUser: userData });
        }
    } catch (error) {
        console.error("Error al manejar clic en usuario:", error);
        Alert.alert(
            "Error",
            "Hubo un problema al obtener los detalles del usuario."
        );
    }
};
  

  const currentStyles = isNightMode ? nightStyles : dayStyles;

  return (
    <View style={currentStyles.container}>
     <TouchableOpacity
  onPress={handlePress}
  style={currentStyles.imageContainer}
>
  {filteredImages.slice(0, 6).map((imageUrl, index) => (
    <Image
      key={index}
      source={{ uri: imageUrl }}
      style={[
        currentStyles.profileImage,
        { marginLeft: index > 0 ? -10 : 0, zIndex: 6 - index },
      ]}
      cachePolicy="memory-disk" // Opcional: mejora la carga de imágenes
    />
  ))}
  {filteredImages.length > 6 && (
    <View style={currentStyles.moreContainer}>
      <Text style={currentStyles.moreText}>
        +{filteredImages.length - 6}
      </Text>
    </View>
  )}
</TouchableOpacity>


      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableOpacity
          style={currentStyles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} >
            <LinearGradient
              colors={
                isNightMode ? ["#1A1A1A", "#000000"] : ["rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 0.8)"]
              }
              style={currentStyles.modalContent}
            >
              <View style={currentStyles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="gray"
                  style={currentStyles.searchIcon}
                />
                <TextInput
                  style={[currentStyles.searchInput, { color: isNightMode ? '#fff' : '#000' }]}
                  placeholder="Pesquisar"
                  placeholderTextColor="gray"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>
              <FlatList
  data={filteredAttendees}
  keyExtractor={(item) => item.uid || item.username}
  renderItem={({ item }) => (
    <TouchableOpacity
      onPress={() => {
        if (auth.currentUser?.uid === item.uid) {
          // Navegar a tu perfil
          navigation.navigate("Profile", { selectedUser: auth.currentUser });
        } else {
          // Navegar al perfil de otro usuario
          navigation.navigate("UserProfile", { selectedUser: item });
        }
      }}
      style={currentStyles.attendeeItem}
    >
      <TouchableOpacity
        onPress={() => handleUserPress(item.uid)}
        onStartShouldSetResponder={() => true} // Evita bloquear el evento exterior
        style={currentStyles.attendeeImageContainer}
      >
        <Image
          source={{
            uri: item.profileImage || "https://via.placeholder.com/150",
          }}
          style={[
            currentStyles.attendeeImage,
            item.hasStories && currentStyles.unseenStoryCircle, // Estilo si tiene historias
          ]}
          cachePolicy="memory-disk"
        />
      </TouchableOpacity>
      <Text style={currentStyles.attendeeName}>{item.username}</Text>
    </TouchableOpacity>
  )}
/>





{isModalVisible && (
    <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
    >
        <StoryViewer
            stories={selectedStories}
            initialIndex={0}
            onClose={() => setIsModalVisible(false)}
        />
    </Modal>
)}
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const baseStyles = {
  container: {
    position: "absolute",
    bottom: 10,
    right: 0,
  },
  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 37,
    height: 37,
    borderRadius: 18,
  },
  moreContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: width * 0.8,
    maxHeight: 400,
    borderRadius: 20,
    padding: 20,
  },
  attendeeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  attendeeImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  attendeeName: {
    fontSize: 18,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bbb7b7",
    borderRadius: 20,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 43,
  },
  searchIcon: {
    marginRight: 10,
    color: '#3e3d3d'
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  unseenStoryCircle: {
    borderWidth: 2,
    borderColor: "black", // Indica historias disponibles
    borderRadius: 25,
  },
};

const dayStyles = StyleSheet.create({
  ...baseStyles,
  profileImage: {
    ...baseStyles.profileImage,
  },
  moreContainer: {
    ...baseStyles.moreContainer,
    backgroundColor: "black",
  },
  moreText: {
    ...baseStyles.moreText,
    color: "#FFFFFF",
  },
  attendeeName: {
    ...baseStyles.attendeeName,
    color: "white",
  },
});

const nightStyles = StyleSheet.create({
  ...baseStyles,
  profileImage: {
    ...baseStyles.profileImage,
  },
  moreContainer: {
    ...baseStyles.moreContainer,
    backgroundColor: "#black",
  },
  moreText: {
    ...baseStyles.moreText,
    color: "#FFFFFF",
  },
  attendeeName: {
    ...baseStyles.attendeeName,
    color: "#FFFFFF",
  },
});

export default DotIndicator;
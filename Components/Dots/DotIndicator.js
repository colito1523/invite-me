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
  query,
  where,
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
        // Exclude current user's stories
        if (attendee.uid === auth.currentUser.uid) {
          continue;
        }

        const userDocRef = doc(database, "users", attendee.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (!userData) continue;

        const isPrivate = userData?.isPrivate || false;

        const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
        const friendQuery = query(friendsRef, where("friendId", "==", attendee.uid));
        const friendSnapshot = await getDocs(friendQuery);
        const isFriend = !friendSnapshot.empty;

        const storiesRef = collection(userDocRef, "stories");
        const storiesSnapshot = await getDocs(storiesRef);
        const now = new Date();

        const userStories = isPrivate && !isFriend
          ? [] // Si es privado y no somos amigos, no hay historias
          : storiesSnapshot.docs
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
      const isPrivate = userData?.isPrivate || false;
  
      const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
      const friendQuery = query(friendsRef, where("friendId", "==", uid));
      const friendSnapshot = await getDocs(friendQuery);
      const isFriend = !friendSnapshot.empty;
  
      if (isPrivate && !isFriend) {
        // Redirigir al perfil del usuario si es privado y no somos amigos
        navigation.navigate("UserProfile", {
          selectedUser: {
            id: uid,
            username: userData.username || "Usuario desconocido",
            firstName: userData.firstName || "Nombre desconocido",
            lastName: userData.lastName || "Apellido desconocido",
            profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
            isPrivate: userData.isPrivate || false,
          },
        });
        return;
      }
  
      // Si hay historias activas, mostrarlas
      const storiesRef = collection(database, "users", uid, "stories");
      const storiesSnapshot = await getDocs(storiesRef);
      const now = new Date();
      const activeStories = storiesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
          expiresAt: doc.data().expiresAt,
        }))
        .filter((story) => new Date(story.expiresAt.toDate()) > now);
  
      if (activeStories.length > 0) {
        setSelectedStories([
          {
            uid,
            username: userData.username || "Usuario desconocido",
            profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
            userStories: activeStories,
          },
        ]);
        setIsModalVisible(true);
      } else {
        navigation.navigate("UserProfile", { selectedUser: userData });
      }
    } catch (error) {
      console.error("Error al manejar clic en usuario:", error);
      Alert.alert("Error", "Hubo un problema al obtener los detalles del usuario.");
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
    onPress={() => handleUserPress(item.uid)} // Reutilizamos handleUserPress
    style={currentStyles.attendeeItem}
  >
      {/* Imagen de perfil, clic accede a las historias */}
      <TouchableOpacity
        onPress={() => handleUserPress(item.uid)} // Manejo de historias
        style={currentStyles.attendeeImageContainer}
      >
        <Image
          source={{
            uri: item.profileImage || "https://via.placeholder.com/150",
          }}
          style={[
            currentStyles.attendeeImage,
            item.hasStories &&
              (!item.isPrivate || (item.isPrivate && item.isFriend)) &&
              currentStyles.unseenStoryCircle, // Aplicar borde solo si cumple condiciones
          ]}
          cachePolicy="memory-disk"
        />
      </TouchableOpacity>

      {/* Nombre del usuario */}
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
            onClose={async () => {
                setIsModalVisible(false);
                await checkStories();
            }}
            unseenStories={{}}
            navigation={navigation} 
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
    borderColor: "red", // Indica historias disponibles
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
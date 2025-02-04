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
import {
  collection,
  getDocs,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { database, auth } from "../../config/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import StoryViewer from "../Stories/storyViewer/StoryViewer";
import { useTranslation } from "react-i18next";
import { handleUserPress } from "./utils";

const { width } = Dimensions.get("window");

const DotIndicator = ({ profileImages, attendeesList }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAttendees, setFilteredAttendees] = useState(attendeesList);
  const navigation = useNavigation();
  const [isNightMode, setIsNightMode] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [filteredImages, setFilteredImages] = useState(profileImages);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStories, setSelectedStories] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const userRef = doc(database, "users", auth.currentUser.uid);
        const userSnapshot = await getDoc(userRef);
        const blockedList = userSnapshot.data()?.blockedUsers || [];
        setBlockedUsers(blockedList);
      } catch (error) {
        console.error(t("dotIndicator.errorFetchingBlockedUsers"), error);
      }
    };

    fetchBlockedUsers();
  }, []);
  

  const navigateToUserProfile = async (uid) => {
    if (!uid) {
      console.error("User ID is undefined");
      return;
    }

   // Cierra el modal antes de navegar
    setModalVisible(false);

    if (uid === auth.currentUser.uid) {
      setModalVisible(false); // Close the modal
      navigation.navigate("Profile");
      return;
    }
  
    try {
      const userDoc = await getDoc(doc(database, "users", uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
  
      setModalVisible(false); // Close the modal
      navigation.navigate("UserProfile", {
        selectedUser: {
          id: uid,
          username: userData.username || t("dotIndicatorBoxDetails.unknownUser"),
          firstName: userData.firstName || t("dotIndicatorBoxDetails.unknownUser"),
          lastName: userData.lastName || t("dotIndicatorBoxDetails.unknownUser"),
          profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
          isPrivate: userData.isPrivate || false,
        },
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const checkStories = async () => {
    try {
      const currentUserRef = doc(database, "users", auth.currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      const hideStoriesFrom = currentUserDoc.data()?.hideStoriesFrom || [];

      const attendeesWithStories = attendeesList.map((attendee) => ({
        ...attendee,
        hasStories: false,
        userStories: [],
      }));

      for (const attendee of attendeesWithStories) {
        // Ensure attendee is defined
        if (!attendee || attendee.uid === auth.currentUser.uid || hideStoriesFrom.includes(attendee.uid)) {
          continue;
        }

        const userDocRef = doc(database, "users", attendee.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (!userData) continue;

        const isPrivate = userData?.isPrivate || false;

        // Verificar si somos amigos
        const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
        const friendQuery = query(friendsRef, where("friendId", "==", attendee.uid));
        const friendSnapshot = await getDocs(friendQuery);
        const isFriend = !friendSnapshot.empty;

        // Saltar si es privado y no somos amigos
        if (isPrivate && !isFriend) {
          continue;
        }

        // Cargar historias solo si el perfil es público o si somos amigos
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
      console.error(t("dotIndicatorBoxDetails.errorCheckingStories"), error);
    }
  };

 useEffect(() => {
     const fetchCompleteUserData = async () => {
       try {
         const usersWithFullData = await Promise.all(
           attendeesList.map(async (attendee) => {
             const userDoc = await getDoc(doc(database, "users", attendee.uid));
             const userData = userDoc.exists() ? userDoc.data() : {};
             return {
               ...userData,
               ...attendee,
               hasStories: attendee.hasStories,
               userStories: attendee.userStories
             };
           })
         );
         await checkStories();
       } catch (error) {
         console.error(t("dotIndicatorBoxDetails.errorFetchingUserDetails"), error);
       }
     };
 
     fetchCompleteUserData();
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
    if (searchTerm.trim() === "") {
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

  const handlePresss = () => {
    setModalVisible(true);
  };

   const handlePress = async (uid) => {
      await handleUserPress({
        uid,
        navigation,
        blockedUsers,
        t,
        setSelectedStories,
        setIsModalVisible,
      });
    };

 

  const currentStyles = isNightMode ? nightStyles : dayStyles;

  return (
    <View style={currentStyles.container}>
      <TouchableOpacity
        onPress={handlePresss}
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
          <TouchableOpacity activeOpacity={1}>
            <LinearGradient
              colors={
                isNightMode
                  ? ["#1A1A1A", "#000000"]
                  : ["rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 0.8)"]
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
                  style={[
                    currentStyles.searchInput,
                    { color: isNightMode ? "#fff" : "gray" },
                  ]}
                  placeholder={t("dotIndicator.searchPlaceholder")}
                  placeholderTextColor="gray"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>

              <FlatList
  data={filteredAttendees}
  keyExtractor={(item) => item.uid || item.username}
  renderItem={({ item }) => (
    <View style={currentStyles.attendeeItem}>
      {/* Imagen de perfil con borde separado */}
      <TouchableOpacity
        onPress={() => handlePress(item.uid, false)} // Acceso a historias
        style={[currentStyles.attendeeImageContainer,{ marginRight:20,}]}
      >
        <View
          style={[
            currentStyles.unseenStoryCircle, // Borde externo
            item.hasStories && {
              borderColor: "white",
              // Color dinámico del borde
            },
          ]}
        >
          <Image
            source={{
              uri:
                item.profileImage ||
                "https://via.placeholder.com/150",
            }}
            style={currentStyles.attendeeImage} // Imagen interna
            cachePolicy="memory-disk"
          />
        </View>
      </TouchableOpacity>

      {/* Texto del usuario: clic redirige al perfil */}
      <TouchableOpacity
        onPress={() => navigateToUserProfile(item.uid)} // Redirige al perfil
      >
        <Text style={currentStyles.attendeeName}>
          {item.username}
        </Text>
      </TouchableOpacity>
    </View>
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
                    onClose={() => {
                      setIsModalVisible(false);
                      setModalVisible(false); // Cierra también el modal principal
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
    width: 46, // Ajusta según tus necesidades
    height: 46,
    borderRadius: 23, // Mantén el radio de la imagen
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
    color: "#3e3d3d",
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  unseenStoryCircle: {
    borderWidth: 2,
    borderColor: "transparent", // Color predeterminado
    borderRadius: 28, // Asegúrate de que sea mayor que attendeeImage
    padding: 3, // Margen interno entre la imagen y el borde
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#000", // Change to black
    borderWidth: 2, // Add border
    borderColor: "#000", // Border color black
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
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
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
import { handleUserPressDotIndicator } from "./utils";

const { width, height } = Dimensions.get("window");

const DotIndicator = ({ profileImages, attendeesList }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Esta lista contendrá a los asistentes filtrados según bloqueos, privacidad y búsqueda
  const [filteredAttendees, setFilteredAttendees] = useState(attendeesList);
  const navigation = useNavigation();
  const [isNightMode, setIsNightMode] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  // Eliminamos filteredImages para usar directamente filteredAttendees en el render
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStories, setSelectedStories] = useState([]);
  const { t } = useTranslation();

  // Estado para almacenar la lista de amigos (para determinar si mostramos usuarios privados)
  const [friendsList, setFriendsList] = useState([]);

  // ---------------------------
  // Obtención de usuarios bloqueados
  // ---------------------------
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

  // ---------------------------
  // Obtención de amigos
  // ---------------------------
  useEffect(() => {
    const fetchFriendsList = async () => {
      try {
        if (!auth.currentUser) return;
        const friendsRef = collection(
          database,
          "users",
          auth.currentUser.uid,
          "friends"
        );
        const friendsSnapshot = await getDocs(friendsRef);
        const friends = friendsSnapshot.docs.map((doc) => doc.data().friendId);
        setFriendsList(friends);
      } catch (error) {
        console.error(t("dotIndicator.errorFetchingFriends"), error);
      }
    };
    fetchFriendsList();
  }, []);

  // ---------------------------
  // Función para navegar al perfil de un usuario
  // ---------------------------
  const navigateToUserProfile = async (uid) => {
    if (!uid) {
      console.error("User ID is undefined");
      return;
    }

    // Cierra el modal antes de navegar
    setModalVisible(false);

    if (uid === auth.currentUser.uid) {
      navigation.navigate("Profile");
      return;
    }

    try {
      const userDoc = await getDoc(doc(database, "users", uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      navigation.navigate("UserProfile", {
        selectedUser: {
          id: uid,
          username:
            userData.username || t("dotIndicatorBoxDetails.unknownUser"),
          firstName:
            userData.firstName || t("dotIndicatorBoxDetails.unknownUser"),
          lastName:
            userData.lastName || t("dotIndicatorBoxDetails.unknownUser"),
          profileImage:
            userData.photoUrls?.[0] || "https://via.placeholder.com/150",
          isPrivate: userData.isPrivate || false,
        },
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // ---------------------------
  // Función para verificar y asignar historias a cada asistente  
  // (se ajusta para NO descartar al usuario actual)
  // ---------------------------
  const checkStories = async () => {
    try {
      const currentUserRef = doc(database, "users", auth.currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      const hideStoriesFrom = currentUserDoc.data()?.hideStoriesFrom || [];
  
      // Mapeamos todos los asistentes agregando propiedades para historias y filtramos los privados que no son amigos
      const attendeesWithStories = await Promise.all(
        attendeesList.map(async (attendee) => {
          // Si el usuario está en la lista de ocultar historias (y no es el usuario actual), descartarlo
          if (!attendee || (hideStoriesFrom.includes(attendee.uid) && attendee.uid !== auth.currentUser.uid)) {
            return null;
          }
  
          const userDocRef = doc(database, "users", attendee.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.exists() ? userDoc.data() : null;
          if (!userData) return null;
  
          const isPrivate = userData.isPrivate || false;
  
          // Comprobar si es amigo
          let isFriend = false;
          if (attendee.uid === auth.currentUser.uid) {
            isFriend = true;
          } else {
            const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
            const friendQuery = query(friendsRef, where("friendId", "==", attendee.uid));
            const friendSnapshot = await getDocs(friendQuery);
            isFriend = !friendSnapshot.empty;
          }
  
          // Si la cuenta es privada y no es amigo, descartarlo de la lista
          if (isPrivate && !isFriend) {
            return null;
          }
  
          // Cargar historias (si existen y vigentes)
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
  
            return {
              ...attendee,
              hasStories: userStories.length > 0,
              userStories,
              profileImage:
                userData.photoUrls?.[0] ||
                attendee.profileImage ||
                "https://via.placeholder.com/150",
            };
        })
      );
      // Filtrar los valores nulos
      const filteredWithStories = attendeesWithStories.filter((item) => item !== null);
      setFilteredAttendees(filteredWithStories);
    } catch (error) {
      console.error(t("dotIndicatorBoxDetails.errorCheckingStories"), error);
    }
  };
  

  // ---------------------------
  // Filtrado principal de asistentes (para modal y para las bolitas)
  // Se excluyen usuarios bloqueados y, si la cuenta es privada y no es amigo, se descarta,
  // salvo si el asistente es el usuario actual (para que nosotros aparezcamos).
  // ---------------------------
  useEffect(() => {
    const updateFilteredAttendees = async () => {
      if (!attendeesList || attendeesList.length === 0 || blockedUsers.length === 0 || friendsList.length === 0) {
        setFilteredAttendees([]);
        return;
      }
  
      const filtered = await Promise.all(
        attendeesList.map(async (attendee) => {
          if (!attendee || !attendee.uid) return null;
          
          // Siempre incluimos al usuario actual
          if (attendee.uid === auth.currentUser.uid) return attendee;
  
          // Excluir usuarios bloqueados
          if (blockedUsers.includes(attendee.uid)) return null;
  
          // Obtener la data completa del usuario
          const userDoc = await getDoc(doc(database, "users", attendee.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          if (!userData) return null;
  
          const isPrivate = userData.isPrivate || false;
          const isFriend = friendsList.includes(attendee.uid);
  
          // Si la cuenta es privada y no es amigo, se descarta
          if (isPrivate && !isFriend) return null;
  
          return { ...attendee, isPrivate, isFriend };
        })
      );
  
      // Filtrar los valores nulos
      const finalFiltered = filtered.filter((item) => item !== null);
      setFilteredAttendees(finalFiltered);
    };
  
    updateFilteredAttendees();
  }, [attendeesList, blockedUsers, friendsList]);
  

  // ---------------------------
  // Modo nocturno (se chequea la hora para ajustar estilos)
  // ---------------------------
  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------
  // Handlers para abrir modal y para manejar la pulsación en un asistente
  // ---------------------------
  const handlePresss = () => {
    setModalVisible(true);
  };

  useEffect(() => {
    checkStories();
  }, [attendeesList]);
  

  const handlePress = async (uid) => {
    await handleUserPressDotIndicator({
      uid,
      navigation,
      blockedUsers,
      t,
      setSelectedStories,
      setIsModalVisible,
      setModalVisible, // Pasar este setter
    });
  };
  const currentStyles = isNightMode ? nightStyles : dayStyles;

  return (
    <View style={currentStyles.container}>
      {/* Renderizamos las “bolitas” usando la lista filtrada */}
      <TouchableOpacity onPress={handlePresss} style={currentStyles.imageContainer}>

{filteredAttendees.slice(0, 4).map((attendee, index) => (
  <View
    key={attendee.uid}
    style={[
      currentStyles.unseenStoryCircle,
      attendee.hasStories && { borderColor: "white" },
      {
        marginLeft: index === 0 ? 0 : -10, // ya no pisan el "more"
        zIndex: 10 - index, // pisan al círculo "more"
      },
    ]}
  >
    <Image
      source={{
        uri: attendee.profileImage || "https://via.placeholder.com/150",
      }}
      style={currentStyles.profileImage}
      cachePolicy="memory-disk"
    />
  </View>
))}

{filteredAttendees.length > 4 && (
  <View style={[currentStyles.moreContainer, { marginLeft: -15, zIndex: 0 }]}>
    <Text style={currentStyles.moreText}>
      {filteredAttendees.length - 4}
    </Text>
  </View>
)}

</TouchableOpacity>




<Modal visible={modalVisible} transparent={true} animationType="fade">
  <View style={currentStyles.modalOverlay}>
    <TouchableOpacity 
      style={{position: 'absolute', width: '100%', height: '100%'}}
      activeOpacity={1}
      onPress={() => setModalVisible(false)}
    />
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
        data={filteredAttendees.filter(item => 
          searchTerm === '' || 
          (item.username && item.username.toLowerCase().includes(searchTerm.toLowerCase()))
        )}
        keyExtractor={(item) => item.uid || item.username}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
        renderItem={({ item }) => (
          <View style={currentStyles.attendeeItem}>
            <TouchableOpacity
              onPress={() => handlePress(item.uid)}
              style={[
                currentStyles.attendeeImageContainer,
                { marginRight: 20 },
              ]}
            >
              <View
                style={[
                  currentStyles.unseenStoryCircle,
                  item.hasStories && {
                    borderColor: "white",
                  },
                ]}
              >
                <Image
                  source={{
                    uri:
                      item.profileImage ||
                      "https://via.placeholder.com/150",
                  }}
                  style={currentStyles.attendeeImage}
                  cachePolicy="memory-disk"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateToUserProfile(item.uid)}>
              <Text style={currentStyles.attendeeName}>
                {item.username}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {isModalVisible && (
        <Modal visible={isModalVisible} animationType="slide" transparent={false}>
          <StoryViewer
            stories={selectedStories}
            initialIndex={0}
            onClose={() => {
              setIsModalVisible(false);
              setModalVisible(false); // Se cierra también el modal principal
            }}
            unseenStories={{}}
            navigation={navigation}
          />
        </Modal>
      )}
    </LinearGradient>
  </View>
</Modal>
    </View>
  );
};

const baseStyles = {
  container: {
    position: "absolute",
    bottom: 10,
    right: 8,
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
    maxHeight: height * 0.7,
    borderRadius: 20,
    padding: 20,
  },
  attendeeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  attendeeImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    borderColor: "transparent",
    borderRadius: 28,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  unseenStoryCircle: {
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 28,
    padding: 3,
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
    backgroundColor: "#000",
    borderWidth: 2,
    borderColor: "#000",
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
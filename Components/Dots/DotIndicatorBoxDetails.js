import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection,
  getDocs,
  doc,
  query,
  where,
  getDoc} from 'firebase/firestore';
import { database, auth } from '../../config/firebase'; // Asegúrate de importar correctamente `auth`
import { Image } from 'expo-image';
import StoryViewer from '../Stories/StoryViewer';

const DotIndicatorBoxDetails = ({ attendeesList }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [filteredAttendees, setFilteredAttendees] = useState([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const { width } = Dimensions.get('window');
  const ITEM_SIZE = 80;
  const SPACING = 10;
  const scrollX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [isModalVisible, setIsModalVisible] = useState(false);
const [selectedStories, setSelectedStories] = useState([]);
const [viewedStories, setViewedStories] = useState({});

const handleCloseStoryViewer = (updatedUnseenStories) => {
  setViewedStories((prev) => ({
    ...prev,
    ...updatedUnseenStories,
  }));
};

const checkStories = async () => {
  try {
    const attendeesWithStories = attendeesList.map((attendee) => ({
      ...attendee,
      hasStories: false,
      userStories: [],
    }));

    for (const attendee of attendeesWithStories) {
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
    console.error("Error verificando historias:", error);
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
        console.log("Attendees Complete Details:", usersWithFullData);
        await checkStories();
      } catch (error) {
        console.error("Error fetching complete user data:", error);
      }
    };

    fetchCompleteUserData();
  }, [attendeesList]);
  // Cargar usuarios bloqueados
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        if (!auth.currentUser) {
          console.error("El usuario no está autenticado.");
          return;
        }

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

  // Filtrar asistentes
  useEffect(() => {
    const updateFilteredAttendees = () => {
      const filtered = attendeesList.filter(
        (attendee) => !blockedUsers.includes(attendee.uid)
      );
      setFilteredAttendees(filtered);
    };

    updateFilteredAttendees();
  }, [attendeesList, blockedUsers]);

  // Modo nocturno
  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

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
      const hideStoriesFrom = userData?.hideStoriesFrom || [];
  
      // Check if the current user is in the hideStoriesFrom array
      if (hideStoriesFrom.includes(auth.currentUser.uid)) {
        navigation.navigate("UserProfile", { selectedUser: userData });
        return;
      }
  
      const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
      const friendQuery = query(friendsRef, where("friendId", "==", uid));
      const friendSnapshot = await getDocs(friendQuery);
      const isFriend = !friendSnapshot.empty;
  
      if (isPrivate && !isFriend) {
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
            username: userData.username || "Unknown",
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
  
  




  // Renderizar asistentes
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item.uid)}
      style={styles.itemContainer}
    >
   <View
  style={[
    styles.imageContainer,
    item.hasStories &&
      (!item.isPrivate || (item.isPrivate && item.isFriend)) &&
      styles.unseenStoryCircle,
  ]}
>
  <Image
    cachePolicy="memory-disk"
    source={{ uri: item.profileImage }}
    style={styles.profileImage}
  />
</View>
    </TouchableOpacity>
  );

  const currentStyles = isNightMode ? nightStyles : dayStyles;

  return (
    <View style={currentStyles.container}>
    {filteredAttendees.length > 0 ? (
      <Animated.FlatList
        data={filteredAttendees}
        renderItem={renderItem}
        keyExtractor={(item) => item.uid}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        snapToInterval={ITEM_SIZE + SPACING}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      />
    ) : null}

    {/* Modal para StoryViewer */}
    {isModalVisible && (
    <Modal
    visible={isModalVisible}
    animationType="slide"
    transparent={false} // Cambia a false para asegurarte de que ocupa toda la pantalla
>
    <StoryViewer
        stories={selectedStories}
        initialIndex={0}
        onClose={async (updatedUnseenStories) => {
          handleCloseStoryViewer(updatedUnseenStories);
          setIsModalVisible(false);
          await checkStories(); // Recargar historias inmediatamente
        }}
        unseenStories={{}}
        navigation={navigation} 
    />
</Modal>
    )}
  </View>
);
};

const styles = StyleSheet.create({
  storyViewerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 9999,
    elevation: 9999,
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 80 + 10 * 2,
  },
  flatListContent: {
    paddingHorizontal: 10,
  },
  itemContainer: {
    width: 80,
    marginHorizontal: 5,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 40,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  unseenStoryCircle: {
    borderWidth: 2,
    borderColor: "white", // Cambia el color según tu diseño
    borderRadius: 35,
  },
});

const dayStyles = StyleSheet.create({
  ...styles,
});

const nightStyles = StyleSheet.create({
  ...styles,
});

export default DotIndicatorBoxDetails;

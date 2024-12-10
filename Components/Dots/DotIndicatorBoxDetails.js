import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection,
  getDocs,
  doc,
  getDoc} from 'firebase/firestore';
import { database, auth } from '../../config/firebase'; // Asegúrate de importar correctamente `auth`
import { Image } from 'expo-image';

const DotIndicatorBoxDetails = ({ attendeesList }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [filteredAttendees, setFilteredAttendees] = useState([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const { width } = Dimensions.get('window');
  const ITEM_SIZE = 80;
  const SPACING = 10;
  const scrollX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();


 
  const checkStories = async () => {
    try {
      const loadedStories = [];
      const now = new Date();
  
      for (const attendee of attendeesList) {
        const userDocRef = doc(database, "users", attendee.uid);
        const storiesRef = collection(userDocRef, "stories");
        const storiesSnapshot = await getDocs(storiesRef);
  
        const userStories = storiesSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              storyUrl: data.storyUrl,
              createdAt: data.createdAt,
              expiresAt: data.expiresAt,
              profileImage: data.profileImage || attendee.profileImage,
              uid: attendee.uid,
              username: data.username || attendee.username || "Unknown",
              viewers: data.viewers || [],
              likes: data.likes || [],
            };
          })
          .filter((story) => new Date(story.expiresAt.seconds * 1000) > now);
  
        if (userStories.length > 0) {
          loadedStories.push({
            uid: attendee.uid,
            username: attendee.username || "Unknown",
            lastName: attendee.lastName || "",
            profileImage: attendee.profileImage || "https://via.placeholder.com/150",
            userStories,
          });
        }
      }
  
      loadedStories.sort((a, b) => a.username.localeCompare(b.username));
  
      console.log("Historias cargadas en DotIndicator:", JSON.stringify(loadedStories, null, 2));
      setFilteredAttendees(loadedStories);
    } catch (error) {
      console.error("Error verificando historias:", error);
    }
  };
  
  
  
  
  
  
  
  
  useEffect(() => {
    checkStories();
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
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: new Date(doc.data().createdAt.seconds * 1000), // Convertir timestamps
          expiresAt: new Date(doc.data().expiresAt.seconds * 1000),
        }))
        .filter((story) => story.expiresAt > now);
  
      if (activeStories.length > 0) {
        // Navegar al visor de historias con datos válidos
        console.log("Navegando al visor con historias activas:", activeStories);
        navigation.navigate("StoryViewer", {
          stories: [
            {
              uid: uid,
              username: userData.username || "Unknown",
              profileImage: userData.profileImage,
              userStories: activeStories,
            },
          ],
          initialIndex: 0, // Índice inicial
        });
      } else {
        // Navegar al perfil si no hay historias activas
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
  
  
  
  

  // Renderizar asistentes
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item.uid)}
      style={styles.itemContainer}
    >
     <View style={[
      styles.imageContainer,
      item.hasStories && styles.unseenStoryCircle // Aplica estilo si tiene historias
    ]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
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
    borderColor: "black", // Cambia el color según tu diseño
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

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  collection,
  getDocs,
  doc,
  query,
  where,
  getDoc 
} from 'firebase/firestore';
import { database, auth } from '../../config/firebase'; 
import { Image } from 'expo-image';
import StoryViewer from '../Stories/storyViewer/StoryViewer';
import { useTranslation } from "react-i18next";
import { calculateHoursAgo } from "../Stories/storyViewer/storyUtils";


const DotIndicatorBoxDetails = ({ attendeesList }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [filteredAttendees, setFilteredAttendees] = useState([]);
  const [amIGoing, setAmIGoing] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  
  const { width } = Dimensions.get('window');
  const ITEM_SIZE = 80;
  const SPACING = 10;
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const navigation = useNavigation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStories, setSelectedStories] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewedStories, setViewedStories] = useState({});
  const [maxToRender, setMaxToRender] = useState(4);
  const [preloadedImages, setPreloadedImages] = useState({});
  
  const { t } = useTranslation();

  const handleCloseStoryViewer = (updatedUnseenStories) => {
    setViewedStories((prev) => ({
      ...prev,
      ...updatedUnseenStories,
    }));
  };

  // Carga de la lista de amigos
  useEffect(() => {
    const fetchFriendsList = async () => {
      try {
        if (!auth.currentUser) return;
  
        const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
        const friendsSnapshot = await getDocs(friendsRef);
        const friends = friendsSnapshot.docs.map(doc => doc.data().friendId);
  
        setFriendsList(friends);
      } catch (error) {
        console.error(t("dotIndicatorBoxDetails.errorFetchingFriends"), error);
      }
    };
  
    fetchFriendsList();
  }, []);

  // Carga de usuarios bloqueados
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        if (!auth.currentUser) {
          console.error(t("dotIndicatorBoxDetails.errorFetchingBlockedUsers"));
          return;
        }

        const userRef = doc(database, "users", auth.currentUser.uid);
        const userSnapshot = await getDoc(userRef);
        const blockedList = userSnapshot.data()?.blockedUsers || [];
        setBlockedUsers(blockedList);
      } catch (error) {
        console.error(t("dotIndicatorBoxDetails.errorFetchingBlockedUsers"), error);
      }
    };

    fetchBlockedUsers();
  }, []);

  // NUEVA FUNCIÓN en BATCH (solo una vez, fuera del useEffect interno)
  const updateFilteredAttendeesWithStories = async () => {
    try {
      if (!attendeesList || attendeesList.length === 0) {
        setFilteredAttendees([]);
        setIsLoaded(true);
        return;
      }

      // 1. Obtenemos todos los UID de los asistentes
      const allUids = attendeesList.map((a) => a.uid);

      // 2. Partimos en lotes de 10 (Firestore limita 'in' query a 10).
      const chunkSize = 10;
      let userDocs = [];

      for (let i = 0; i < allUids.length; i += chunkSize) {
        const chunk = allUids.slice(i, i + chunkSize);
        
        // Consulta en la colección 'users' donde el campo uid esté en 'chunk'.
        const q = query(
          collection(database, "users"),
          where("uid", "in", chunk)
        );
        
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          userDocs.push({
            // docSnap.id asume que el id del documento = uid del usuario
            // si tus docs tienen doc.id distinto, usa docSnap.data().uid en su lugar:
            uid: docSnap.id,
            ...docSnap.data(),
          });
        });
      }

      // 3. Recorremos nuestros userDocs para filtrar y cargar historias.
      const now = new Date();
      const updated = await Promise.all(
        userDocs.map(async (userData) => {
          // Encuentra al asistente original (por ejemplo, para "amIGoing")
          const originalAttendee = attendeesList.find((a) => a.uid === userData.uid);
          if (!originalAttendee) return null; // No se encontró en la lista original

          // a) Si es el usuario actual y no "amIGoing", descartamos.
          if (userData.uid === auth.currentUser?.uid && !amIGoing) {
            return null;
          }

          // b) Si está bloqueado, descartamos.
          if (blockedUsers.includes(userData.uid)) {
            return null;
          }

          // c) Chequeo si es privado y no somos amigos
          const isPrivate = userData.isPrivate || false;
          const isFriend = friendsList.includes(userData.uid);
          if (isPrivate && !isFriend && userData.uid !== auth.currentUser?.uid) {
            return null;
          }

          // d) Cargar historias (subcolección)
          const storiesRef = collection(database, "users", userData.uid, "stories");
          const storiesSnapshot = await getDocs(storiesRef);

          const userStories = storiesSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate?.() || null;
            const expiresAt = data.expiresAt?.toDate?.() || null;
        
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt,
              expiresAt: data.expiresAt,
              hoursAgo: createdAt ? calculateHoursAgo(createdAt) : "0m",
            };
          })
          .filter((story) => story.expiresAt?.toDate?.() > now);
        

        

          
           

          const hasStories = userStories.length > 0;

          // e) Devuelve objeto con info combinada
          return {
            ...originalAttendee,
            ...userData,
            isPrivate,
            isFriend,
            hasStories,
            userStories,
            // 👇 aseguramos los campos correctos
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            profileImage:
              userData.photoUrls?.[0] ||
              originalAttendee.profileImage ||
              "https://via.placeholder.com/150",
          };
        })
      );

      const finalFiltered = updated.filter(Boolean);
      setFilteredAttendees(finalFiltered);
      setIsLoaded(true);
    } catch (error) {
      console.error("Error fetching attendees in batch", error);
      setIsLoaded(true);
    }
  };

  // Llamada al cargar/actualizar
  useEffect(() => {
    updateFilteredAttendeesWithStories();
  }, [attendeesList, blockedUsers, friendsList, amIGoing]);

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

  const handlePress = async (uid) => {
    const selectedUser = filteredAttendees.find((u) => u.uid === uid);
    if (!selectedUser) return;
  
    // Si NO tiene historias, lo mandamos al perfil
    if (!selectedUser.userStories || selectedUser.userStories.length === 0) {
      // Si es el usuario actual, navega al perfil propio
      if (uid === auth.currentUser.uid) {
        return navigation.navigate("Profile");
      }
  
      return navigation.navigate("UserProfile", {
        selectedUser: {
          id: uid,
          username: selectedUser.username || t("dotIndicatorBoxDetails.unknownUser"),
          firstName: selectedUser.firstName || "",
          lastName: selectedUser.lastName || "",
          profileImage:
            selectedUser.profileImage || "https://via.placeholder.com/150",
          isPrivate: selectedUser.isPrivate || false,
        },
      });
    }
  
    // Si tiene historias, mostramos el visor
    console.log("🧾 Historia seleccionada:", selectedUser.userStories[0]);

    const newPreloadedImages = {};
selectedUser.userStories.forEach((story) => {
  if (story.id) {
    newPreloadedImages[story.id] = true;
  }
});

setPreloadedImages(newPreloadedImages);
  
    setSelectedStories([{
      uid: selectedUser.uid,
      firstName: selectedUser.firstName || "",
      lastName: selectedUser.lastName || "",

      profileImage:
        selectedUser.profileImage || "https://via.placeholder.com/150",
      userStories: selectedUser.userStories,
    }]);
  
    setIsModalVisible(true);
  };
  
  
  

  // Renderizar asistentes
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handlePress(item.uid)} style={styles.itemContainer}>
      <View style={styles.imageWrapper}>
        {item.hasStories ? (
          <View style={styles.outerBorder}>
            <View style={styles.innerBorder}>
              <Image
                cachePolicy="memory-disk"
                source={{ uri: item.profileImage }}
                style={styles.profileImage}
              />
            </View>
          </View>
        ) : (
          <View style={styles.noBorderContainer}>
            <Image
              cachePolicy="memory-disk"
              source={{ uri: item.profileImage }}
              style={styles.profileImage}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  
  const currentStyles = isNightMode ? nightStyles : dayStyles;

  return (
    <View style={currentStyles.container}>
      {isLoaded && filteredAttendees.length > 0 ? (
        <Animated.FlatList
        data={filteredAttendees.slice(0, maxToRender)}
          renderItem={renderItem}
          keyExtractor={(item) => item.uid}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          snapToInterval={ITEM_SIZE + SPACING}
          decelerationRate="fast"
          onEndReached={() => {
            // Por ejemplo: cargar 4 más cada vez
            setMaxToRender((prev) => prev + 4);
          }}
          onEndReachedThreshold={0.7} 
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
          animationType="fade"
          transparent={false}
        >
          <StoryViewer
            stories={selectedStories}
            initialIndex={0}
            onClose={async (updatedUnseenStories) => {
              handleCloseStoryViewer(updatedUnseenStories);
              setIsModalVisible(false);
            }}
            unseenStories={{}}
            preloadedImages={preloadedImages}
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
    alignItems: "center", 
    justifyContent: "center",
  },
  imageWrapper: {
    width: 75,
    height: 75,
    justifyContent: "center",
    alignItems: "center",
  },
  outerBorder: {
    width: 75,
    height: 75,
    borderRadius: 40,
    borderWidth: 2, 
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  innerBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2, 
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  noBorderContainer: {
    width: 75,
    height: 75,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 35,
  },
  unseenStoryCircle: {
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 40,
    padding: 3,
    width: 75,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const dayStyles = StyleSheet.create({
  ...styles,
});

const nightStyles = StyleSheet.create({
  ...styles,
});

export default DotIndicatorBoxDetails;

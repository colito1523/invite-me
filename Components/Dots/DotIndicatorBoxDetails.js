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
import StoryViewer from '../Stories/storyViewer/StoryViewer';
import { useTranslation } from "react-i18next";
import { handleUserPress } from "./utils";

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
  const { t } = useTranslation();

  const handleCloseStoryViewer = (updatedUnseenStories) => {
    setViewedStories((prev) => ({
      ...prev,
      ...updatedUnseenStories,
    }));
  };

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


  
  

  // Cargar usuarios bloqueados
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


  useEffect(() => {
    const updateFilteredAttendeesWithStories = async () => {
      if (!attendeesList || attendeesList.length === 0) {
        setFilteredAttendees([]);
        setIsLoaded(true);
        return;
      }
      const updated = await Promise.all(
        attendeesList.map(async (attendee) => {
          // Para el usuario actual:
          if (attendee.uid === auth.currentUser.uid) {
            if (!amIGoing) return null;
            const userDoc = await getDoc(doc(database, "users", attendee.uid));
            let hasStories = false;
            let userStories = [];
            if (userDoc.exists()) {
              const storiesRef = collection(doc(database, "users", attendee.uid), "stories");
              const storiesSnapshot = await getDocs(storiesRef);
              const now = new Date();
              userStories = storiesSnapshot.docs
                .map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data().createdAt?.toDate(),
                  expiresAt: doc.data().expiresAt?.toDate(),
                }))
                .filter((story) => story.expiresAt > now);
              hasStories = userStories.length > 0;
            }
            return { ...attendee, hasStories, userStories };
          }
          // Para otros asistentes:
          if (blockedUsers.includes(attendee.uid)) return null;
          const userDoc = await getDoc(doc(database, "users", attendee.uid));
          if (!userDoc.exists()) return null;
          const userData = userDoc.data();
          const isPrivate = userData.isPrivate || false;
          const isFriend = friendsList.includes(attendee.uid);
          if (isPrivate && !isFriend) return null;
          const storiesRef = collection(doc(database, "users", attendee.uid), "stories");
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
          const hasStories = userStories.length > 0;
          return { ...attendee, isPrivate, isFriend, hasStories, userStories };
        })
      );
      const finalFiltered = updated.filter(Boolean);
      setFilteredAttendees(finalFiltered);
      setIsLoaded(true);
    };
  
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
    await handleUserPress({
      uid,
      navigation,
      blockedUsers,
      t,
      setSelectedStories,
      setIsModalVisible,
    });
  };

  // Renderizar asistentes
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handlePress(item.uid)} style={styles.itemContainer}>
      <View
        style={[
          styles.imageContainer,
          item.hasStories &&
            (!item.isPrivate || (item.isPrivate && item.isFriend)) && {
              ...styles.unseenStoryCircle,
              borderColor: "white", // Forzamos siempre blanco
            },
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
    {isLoaded && filteredAttendees.length > 0 ? (
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
    width: 75,
    height: 75,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
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
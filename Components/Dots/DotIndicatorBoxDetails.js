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
import { doc, getDoc } from 'firebase/firestore';
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
    if (uid === auth.currentUser.uid) {
      // Navega al perfil de la cuenta propia
      navigation.navigate("Profile");
    } else {
      // Navega al perfil de otros usuarios
      const userDoc = await getDoc(doc(database, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userData.id = uid;
        userData.profileImage =
          userData.photoUrls && userData.photoUrls.length > 0
            ? userData.photoUrls[0]
            : "https://via.placeholder.com/150";
        navigation.navigate("UserProfile", { selectedUser: userData });
      } else {
        Alert.alert("Error", "No se encontraron detalles para este usuario.");
      }
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
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
      <View style={styles.imageContainer}>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});

const dayStyles = StyleSheet.create({
  ...styles,
});

const nightStyles = StyleSheet.create({
  ...styles,
});

export default DotIndicatorBoxDetails;

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { database } from '../../config/firebase';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const ITEM_SIZE = 80;
const SPACING = 10;

const DotIndicatorBoxDetails = ({ attendeesList }) => {
  const navigation = useNavigation();
  const [isNightMode, setIsNightMode] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

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
    try {
      const userDoc = await getDoc(doc(database, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userData.id = uid;
        userData.profileImage =
          userData.photoUrls && userData.photoUrls.length > 0
            ? userData.photoUrls[0]
            : 'https://via.placeholder.com/150';
        navigation.navigate('UserProfile', { selectedUser: userData });
      } else {
        console.log('No se encontraron detalles para este usuario.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const renderItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        onPress={() => handleUserPress(item.uid)}
        style={styles.itemContainer}
      >
        <View style={styles.imageContainer}>
          <Image cachePolicy="memory-disk" source={{ uri: item.profileImage }} style={styles.profileImage} />
        </View>
      </TouchableOpacity>
    );
  };

  const currentStyles = isNightMode ? nightStyles : dayStyles;

  return (
    <View style={currentStyles.container}>
      {attendeesList && attendeesList.length > 0 ? (
        <Animated.FlatList
          data={attendeesList}
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
    height: ITEM_SIZE + SPACING * 2,
  },
  flatListContent: {
    paddingHorizontal: SPACING,
  },
  itemContainer: {
    width: ITEM_SIZE,
    marginHorizontal: SPACING / 2,
  },
  imageContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});

const dayStyles = StyleSheet.create({
  ...styles,
  moreContainer: {
    ...styles.moreContainer,
    backgroundColor: '#C0A368',
  },
  moreText: {
    ...styles.moreText,
    color: '#FFFFFF',
  },
});

const nightStyles = StyleSheet.create({
  ...styles,
  moreContainer: {
    ...styles.moreContainer,
    backgroundColor: '#C0A368',
  },
  moreText: {
    ...styles.moreText,
    color: '#FFFFFF',
  },
});

export default DotIndicatorBoxDetails;
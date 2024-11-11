import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { database } from "../../config/firebase";
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

export default function FriendListModal({ isVisible, onClose, userId, updateFriendCount }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalFriends, setTotalFriends] = useState(0);
 
  const navigation = useNavigation();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchFriends = async () => {
      const friendsRef = collection(database, 'users', userId, 'friends');
      const friendsSnapshot = await getDocs(friendsRef);
      const friendsList = friendsSnapshot.docs.map((doc) => {
        const friendData = doc.data();
        return {
          id: friendData.friendId,
          name: friendData.friendName,
          imageUrl: friendData.friendImage || 'https://via.placeholder.com/150',
        };
      });
      setFriends(friendsList);
      setTotalFriends(friendsList.length);
    };
  
    if (isVisible) {
      fetchFriends();
    }
  }, [isVisible]);
  
  useEffect(() => {
    if (!isVisible && updateFriendCount) {
      updateFriendCount(totalFriends);
    }
  }, [isVisible, totalFriends]);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserPress = async (uid) => {
    try {
      const userDoc = await getDocs(query(collection(database, 'users'), where('id', '==', uid)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        userData.id = uid;
        navigation.navigate('UserProfile', { selectedUser: JSON.stringify(userData) });
      } else {
        console.error(t('friendListModal.userNotFound'));
      }
    } catch (error) {
      console.error(t('friendListModal.errorFetchingUser'), error);
    }
    onClose();
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => handleUserPress(item.id)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.friendImage} cachePolicy="memory-disk" />
      <Text style={styles.friendName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('friendListModal.searchPlaceholder', { count: totalFriends })}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {filteredFriends.length > 0 ? (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noFriendsText}>{t('friendListModal.noFriendsFound')}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  friendName: {
    fontSize: 16,
  },
  noFriendsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { database } from '../../config/firebase';
import { useNavigation } from '@react-navigation/native';

const StyledMutualFriendsModal = ({ isVisible, onClose, friends }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Restablecer búsqueda al cerrar el modal
  useEffect(() => {
    if (!isVisible) {
      setSearchQuery('');
    }
  }, [isVisible]);

  // Filtrar amigos visibles por nombre de usuario
  const filteredFriends = Array.isArray(friends) && friends.length > 0
    ? friends.filter((friend) =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleUserPress = async (username) => {
    if (!username) {
      Alert.alert("Error", "Usuario no válido.");
      return;
    }
    try {
      const usersQuery = query(
        collection(database, "users"),
        where("username", "==", username)
      );
      const querySnapshot = await getDocs(usersQuery);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() };
        navigation.navigate("UserProfile", { selectedUser: userData });
      } else {
        Alert.alert(t("mutualFriendsModal.userNotFound"));
      }
    } catch (error) {
      console.error(t("mutualFriendsModal.errorFetchingUser"), error);
      Alert.alert(t("mutualFriendsModal.errorFetchingUser"));
    }
    onClose();
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => handleUserPress(item.username)}
    >
      <Image
        source={{ uri: item.photoUrls[0] || 'https://via.placeholder.com/150' }}
        style={styles.friendImage}
        cachePolicy="memory-disk"
      />
      <Text style={styles.friendName}>{item.username}</Text>
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
            placeholder={t('mutualFriendsModal.searchPlaceholder', { count: friends.length })}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {filteredFriends.length > 0 ? (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.username} // Usamos `username` como clave
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noFriendsText}>{t('mutualFriendsModal.noFriendsFound')}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

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

export default StyledMutualFriendsModal;

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { database, auth } from "../../config/firebase";
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

export default function FriendListModal({ isVisible, onClose, userId, updateFriendCount }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalFriends, setTotalFriends] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState([]);

  const navigation = useNavigation();
  const { t } = useTranslation();

  // Fetch usuarios bloqueados
  const fetchBlockedUsers = async () => {
    try {
      const userRef = doc(database, "users", userId);
      const userSnapshot = await getDoc(userRef);
      const blockedList = userSnapshot.data()?.blockedUsers || [];
      setBlockedUsers(blockedList);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    }
  };

  // Fetch amigos, asegurándonos de que primero obtengamos los usuarios bloqueados
  const fetchFriends = async () => {
    try {
      await fetchBlockedUsers(); // Asegurar que primero se obtienen los usuarios bloqueados

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
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  // UseEffect para cargar la lista de amigos cuando el modal está visible
  useEffect(() => {
    if (isVisible) {
      fetchFriends();
    }
  }, [isVisible]);

  // Actualizar la cuenta de amigos después de cerrar el modal
  useEffect(() => {
    if (!isVisible && updateFriendCount) {
      updateFriendCount(totalFriends);
    }
  }, [isVisible, totalFriends]);

  // Filtrar amigos bloqueados
  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !blockedUsers.includes(friend.id) // Excluir amigos bloqueados
  );

// Manejar la selección de un amigo
const handleUserPress = async (uid) => {
  // Verificar si el usuario está bloqueado antes de proceder
  if (blockedUsers.includes(uid)) {
    Alert.alert("Error", t("friendListModal.userBlocked"));
    return;
  }

  try {
    const userDoc = await getDoc(doc(database, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      userData.id = uid;
      const isPrivate = userData.isPrivate || false;

      // Verificar si el usuario es amigo del usuario actual
      let isFriend = false;
      if (uid === auth.currentUser.uid) {
        isFriend = true;
      } else {
        const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
        const friendQuery = query(friendsRef, where("friendId", "==", uid));
        const friendSnapshot = await getDocs(friendQuery);
        isFriend = !friendSnapshot.empty;
      }

      if (isPrivate && !isFriend) {
        navigation.navigate("PrivateUserProfile", { selectedUser: userData });
      } else {
        navigation.navigate("UserProfile", { selectedUser: userData });
      }
    } else {
      console.error(t("friendListModal.userNotFound"));
    }
  } catch (error) {
    console.error(t("friendListModal.errorFetchingUser"), error);
  }
  onClose();
};


  // Bloquear un usuario y actualizar la lista de amigos
  const handleBlockUser = async (uid) => {
    try {
      const currentUserRef = doc(database, "users", userId);
      await updateDoc(currentUserRef, {
        blockedUsers: arrayUnion(uid),
      });

      Alert.alert(t("friendListModal.userBlockedSuccess"), t("friendListModal.userHasBeenBlocked"));

      // Actualizar la lista de usuarios bloqueados y amigos después de bloquear
      await fetchFriends();
    } catch (error) {
      console.error("Error blocking user:", error);
      Alert.alert(t("friendListModal.error"), t("friendListModal.blockError"));
    }
  };

  // Renderizar cada amigo
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

import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { collection, query, where, onSnapshot, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, database } from '../config/firebase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; // Importamos el icono
import * as ImagePicker from 'expo-image-picker'; // Importamos expo-image-picker

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const user = auth.currentUser;
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const fetchChats = async () => {
        if (!user) return;  // Asegurarse de que el usuario esté cargado

        const chatsRef = collection(database, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', user.uid));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const chatList = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
            const chatData = docSnapshot.data();
            const otherUserId = chatData.participants.find(uid => uid !== user.uid);
            
            const otherUserDoc = await getDoc(doc(database, 'users', otherUserId));

            if (!otherUserDoc.exists()) {
              console.error(`User with ID ${otherUserId} not found`);
              return null;
            }

            const otherUserData = otherUserDoc.data();

            // Obtener mensajes no vistos
            const messagesRef = collection(database, 'chats', docSnapshot.id, 'messages');
            const unseenMessagesQuery = query(messagesRef, where('seen', '==', false), where('senderId', '!=', user.uid));
            const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);
            const hasUnseenMessages = unseenMessagesSnapshot.size > 0;
            
            return {
              id: docSnapshot.id,
              user: otherUserData,
              hasUnseenMessages,
            };
          }));

          setChats(chatList.filter(chat => chat !== null));
        });

        return () => unsubscribe();
      };

      fetchChats();
    }, [user.uid])
  );

  const handleChatPress = async (chat) => {
    const messagesRef = collection(database, 'chats', chat.id, 'messages');
    const unseenMessagesQuery = query(messagesRef, where('seen', '==', false), where('senderId', '!=', user.uid));
    const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);

    unseenMessagesSnapshot.forEach(async (messageDoc) => {
      await updateDoc(doc(messagesRef, messageDoc.id), { seen: true });
    });

    navigation.navigate('ChatUsers', { chatId: chat.id, recipientUser: chat.user });
  };

  const handleOpenCamera = async (chat) => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      // Redirigimos a la pantalla del chat y pasamos la imagen capturada
      navigation.navigate('ChatUsers', { chatId: chat.id, recipientUser: chat.user, imageUri });
    }
  };
  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)}>
            <Image source={{ uri: item.user.profileImage || 'https://via.placeholder.com/150' }} style={styles.userImage} />
            <View style={styles.chatInfo}>
              <Text style={[styles.chatTitle, item.hasUnseenMessages ? styles.unseenChatTitle : null]}>
                {item.user.username || 'Usuario desconocido'}
              </Text>
            </View>
            {item.hasUnseenMessages && <View style={styles.unseenIndicator} />}
            {/* Ícono de cámara */}
            <TouchableOpacity onPress={() => handleOpenCamera(item)}>
  <Feather name="camera" size={24} color="black" style={styles.cameraIcon} />
</TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#b5a642',
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    color: '#333',
  },
  unseenChatTitle: {
    fontWeight: 'bold',
    color: '#000',
  },
  unseenIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    marginLeft: 10,
  },
  cameraIcon: {
    marginLeft: 10,
  },
});

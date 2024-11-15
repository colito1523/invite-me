import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { auth, database, storage } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Video } from 'expo-av';
import { Audio } from 'expo-av';
import AudioPlayer from './AudioPlayer';

export default function Chat({ route }) {
  const { chatId: initialChatId, recipientUser } = route.params;
  const [chatId, setChatId] = useState(initialChatId);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(recipientUser);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null); 
  const user = auth.currentUser;
  const navigation = useNavigation();
  const flatListRef = useRef(null); 
  const [imageUri, setImageUri] = useState(route.params?.imageUri || null);


  useEffect(() => {
    const setupChat = async () => {
      if (chatId) {
        const messagesRef = collection(database, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messagesList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(messagesList);
        });
  
        // Si hay una imagenUri pasada desde ChatList, enviarla automáticamente
        if (imageUri) {
          handleSend('image', imageUri);
          setImageUri(null);  // Limpiar después de enviar la imagen
        }
  
        return () => unsubscribe();
      }
    };
  
    setupChat();
  }, [chatId, imageUri]);
  

  const createChatIfNotExists = async () => {
    if (!chatId) {
        const chatRef = doc(collection(database, 'chats'));
        const newChatId = chatRef.id;

        // Validar que los datos no sean undefined
        if (!user || !recipientUser || !newChatId) {
            console.error("Error: Los datos del chat o los usuarios son indefinidos.");
            return null;
        }

        await setDoc(chatRef, {
            participants: [user.uid, recipientUser.id],
            createdAt: new Date(),
            lastMessage: "",
        });

        setChatId(newChatId);
        return newChatId;
    }

    return chatId;
};


  const handleSend = async (messageType = 'text', mediaUri = null) => {
    const chatIdToUse = await createChatIfNotExists();
    const messagesRef = collection(database, 'chats', chatIdToUse, 'messages');

    let messageData = {
      senderId: user.uid,
      senderName: user.displayName || 'Anónimo',
      createdAt: new Date(),
      seen: false,
    };

    if (messageType === 'text') {
      messageData.text = message;
    } else if (messageType === 'image' || messageType === 'video' || messageType === 'audio') {
      const mediaUrl = await uploadMedia(mediaUri);
      messageData.mediaType = messageType;
      messageData.mediaUrl = mediaUrl;
    }

    await addDoc(messagesRef, messageData);
    // Actualizar el documento del chat con la información del último mensaje
   const chatDocRef = doc(database, 'chats', chatIdToUse);
   await updateDoc(chatDocRef, {
       lastMessage: messageData.text || 'Media',
       lastMessageTimestamp: messageData.createdAt,
       lastMessageSenderId: user.uid,
       lastMessageSenderName: user.displayName || 'Anónimo',
   });

   setMessage('');
   flatListRef.current?.scrollToEnd({ animated: true });
};

  const uploadMedia = async (uri) => {
    if (!uri) return null;

    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `media/${user.uid}/${new Date().getTime()}`);
    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const mediaType = result.assets[0].type === 'video' ? 'video' : 'image';
      handleSend(mediaType, result.assets[0].uri);
    }
  };

  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso de audio no concedido');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Error al iniciar la grabación:', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setIsRecording(false);
        handleSend('audio', uri);
      }
    } catch (err) {
      console.error('Error al detener la grabación:', err);
    }
  };

  const handleUserPress = () => {
    navigation.navigate('UserProfile', { selectedUser: recipientUser });
  };

  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  const handleLongPressMessage = (message) => {
    if (message.senderId === user.uid) {  // Solo permitir eliminación de mensajes enviados por el usuario actual
      Alert.alert(
        "Opciones de Mensaje",
        "¿Qué te gustaría hacer?",
        [
          {
            text: "Cancelar",
            onPress: () => setSelectedMessageId(null),
            style: "cancel"
          },
          {
            text: "Eliminar",
            onPress: () => handleDeleteMessage(message.id),
            style: "destructive"
          }
        ]
      );
    }
  };

  const handleDeleteMessage = (messageId) => {
    setMessages((prevMessages) =>
      prevMessages.filter((message) => message.id !== messageId)
    );
    setSelectedMessageId(null);
  };
  
  

  const renderDate = (date) => {
    return (
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          {date.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>
    );
  };

  const renderMessage = ({ item, index }) => {
    const previousMessage = messages[index - 1];
    const currentMessageDate = new Date(item.createdAt.seconds * 1000);
    const previousMessageDate =
      previousMessage &&
      new Date(previousMessage.createdAt.seconds * 1000);

    const isSameDay =
      previousMessageDate &&
      currentMessageDate.toDateString() === previousMessageDate.toDateString();

    return (
      <>
        {!isSameDay && renderDate(currentMessageDate)}
        <TouchableOpacity onLongPress={() => handleLongPressMessage(item)}>
          <View
            style={[
              styles.message,
              item.senderId === user.uid ? styles.sent : styles.received,
            ]}
          >
            {item.text && <Text style={styles.messageText}>{item.text}</Text>}
            {item.mediaType === 'image' && (
              <TouchableOpacity onPress={() => handleImagePress(item.mediaUrl)}>
                <Image source={{ uri: item.mediaUrl }} style={styles.messageImage} />
              </TouchableOpacity>
            )}
            {item.mediaType === 'video' && (
              <Video
                source={{ uri: item.mediaUrl }}
                style={styles.messageVideo}
                useNativeControls
                resizeMode="contain"
              />
            )}
            {item.mediaType === 'audio' && <AudioPlayer uri={item.mediaUrl} />}
            <View style={styles.messageFooter}>
              <Text style={styles.timeText}>
                {currentMessageDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {item.senderId === user.uid && item.seen && (
                <Feather name="check-circle" size={16} color="#fff" style={styles.seenIcon} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <LinearGradient colors={['#faf8f8', '#faf8f8']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
                    <Image
                        source={{
                            uri: recipient.profileImage || 'https://via.placeholder.com/150',
                        }}
                        style={styles.userImage}
                    />
                    <Text style={styles.username}>{recipient.username}</Text>
                </TouchableOpacity>
            </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TouchableOpacity onPress={pickMedia}>
          <Feather name="image" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={isRecording ? styles.recordingButton : null}
        >
          {isRecording ? (
            <View style={styles.recordingIndicator} />
          ) : (
            <Feather name="mic" size={24} color="black" />
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe un mensaje"
          placeholderTextColor="#ddd"
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => handleSend('text')}>
          <Feather name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <Modal visible={isModalVisible} transparent={true}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalBackground}>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 40,
  },
  backButton: {
    marginRight: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    color:'black',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
        borderColor: '#b5a642',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color:'black',
  },
  message: {
    padding: 10,
    borderRadius: 20,
    marginVertical: 8,
    maxWidth: '80%', // Asegura que el mensaje no ocupe más del 80% del ancho de la pantalla
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    flexWrap: 'wrap', // Permite que el contenido se envuelva si es necesario
    marginBottom: 10, // Añade espacio entre el mensaje y la hora
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#b5a642',
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#c7ecee',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    flexWrap: 'wrap', // Esto permite que el texto se envuelva
    maxWidth: '100%', // Asegura que el texto no salga del contenedor del mensaje
  },
  timeText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 5, // Añade espacio entre el mensaje y la hora
    marginLeft: 10,
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  messageVideo: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    // borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#faf8f8',
    borderRadius: 30,
    margin: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    fontSize: 13,
    color: '#333',
    marginHorizontal: 10,
  },
  sendButton: {
    backgroundColor: '#b5a642',
    borderRadius: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seenIcon: {
    marginLeft: 5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  recordingButton: {
    backgroundColor: 'red',
    borderRadius: 12,
    padding: 6,
    marginRight: 10,
  },
  recordingIndicator: {
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 10,
    // marginStart
  },
  dateText: {
    fontSize: 14,
    color: 'grey',
    backgroundColor: '#faf8f8',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
});

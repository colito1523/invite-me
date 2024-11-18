import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, database } from "../config/firebase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import StorySlider from "../Components/Stories/StorySlider";

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isNightMode, setIsNightMode] = useState(false);
  const user = auth.currentUser;
  const navigation = useNavigation();

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: isNightMode ? "#1a1a1a" : "#fff",
        },
        headerTintColor: isNightMode ? "#fff" : "#000",
        headerTitleStyle: {
          color: isNightMode ? "#fff" : "#000",
        },
      });
    }, [isNightMode])
  );

  const theme = isNightMode ? darkTheme : lightTheme;

  useFocusEffect(
    useCallback(() => {
      const fetchChats = async () => {
        if (!user) return;
  
        const chatsRef = collection(database, "chats");
        const q = query(
          chatsRef,
          where("participants", "array-contains", user.uid)
        );
  
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const chatList = await Promise.all(
            querySnapshot.docs.map(async (docSnapshot) => {
              const chatData = docSnapshot.data();
              const otherUserId = chatData.participants.find(
                (uid) => uid !== user.uid
              );
  
              const otherUserDoc = await getDoc(
                doc(database, "users", otherUserId)
              );
  
              if (!otherUserDoc.exists()) {
                console.error(`User with ID ${otherUserId} not found`);
                return null;
              }
  
              const otherUserData = otherUserDoc.data();
  
              const messagesRef = collection(
                database,
                "chats",
                docSnapshot.id,
                "messages"
              );
              const unseenMessagesQuery = query(
                messagesRef,
                where("seen", "==", false),
                where("senderId", "!=", user.uid)
              );
              const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);
  
              // Calcular la cantidad de mensajes sin leer
              const unseenMessagesCount = unseenMessagesSnapshot.size;
  
              return {
                id: docSnapshot.id,
                user: otherUserData,
                unseenMessagesCount,
                lastMessageTimestamp: chatData.lastMessageTimestamp || null, // Marca temporal
              };
            })
          );
  
          // Ordenar chats por `lastMessageTimestamp` en orden descendente
          const sortedChats = chatList
            .filter((chat) => chat !== null)
            .sort(
              (a, b) =>
                new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
            );
  
          setChats(sortedChats);
        });
  
        return () => unsubscribe();
      };
  
      fetchChats();
    }, [user.uid])
  );
  
  

  useEffect(() => {
    const filtered = chats.filter(chat => 
      chat.user.username.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [chats, searchText]);

  const handleChatPress = async (chat) => {
    const messagesRef = collection(database, "chats", chat.id, "messages");
    const unseenMessagesQuery = query(
      messagesRef,
      where("seen", "==", false),
      where("senderId", "!=", user.uid)
    );
    const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);

    unseenMessagesSnapshot.forEach(async (messageDoc) => {
      await updateDoc(doc(messagesRef, messageDoc.id), { seen: true });
    });

    navigation.navigate("ChatUsers", {
      chatId: chat.id,
      recipientUser: chat.user,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <StorySlider eventTitle="Evento de ejemplo" selectedDate={new Date()} />
      </View>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="gray"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar"
          placeholderTextColor="gray"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Mensagens</Text>
        <Ionicons
          name="ellipsis-horizontal"
          size={24}
          color="black"
          style={styles.dotsIcon}
        />
      </View>
      <FlatList
  data={chats}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
    >
      <Image
        source={{
          uri: item.user.photoUrls?.[0] || "https://via.placeholder.com/150",
        }}
        style={styles.userImage}
      />
      <View style={styles.chatInfo}>
        <Text style={styles.chatTitle}>{item.user.username || "Usuario desconocido"}</Text>
      </View>

      {item.unseenMessagesCount > 0 && (
        <View style={styles.unseenCountContainer}>
          <Text style={styles.unseenCountText}>
            {item.unseenMessagesCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )}
/>

    </SafeAreaView>
  );
}

// ... (los estilos y temas permanecen iguales)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  storyList: {
    paddingLeft: 10,
  },
  storyItem: {
    marginRight: 10,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#e91e63",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginHorizontal: 15,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 15,
    marginVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 10,
  },
  dotsIcon: {
    marginLeft: 10,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  unseenChatTitle: {
    fontWeight: "bold",
  },
  unseenIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e91e63",
    marginLeft: 10,
  },
  unseenCountContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  unseenCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

const lightTheme = {
  inputBackground: "#f0f0f0",
  text: "#333",
  placeholder: "#999",
  icon: "#C0A368",
};

const darkTheme = {
  inputBackground: "#333",
  text: "#fff",
  placeholder: "#666",
  icon: "#C0A368",
};

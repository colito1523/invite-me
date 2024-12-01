import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  deleteField,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { Ionicons, Feather } from "@expo/vector-icons";
import { auth, database } from "../../config/firebase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Menu, Provider } from "react-native-paper";
import Notes from "../../Components/Notes/Notes";

const muteOptions = [
  { label: "1 hora", value: 1 },
  { label: "4 horas", value: 4 },
  { label: "8 horas", value: 8 },
  { label: "24 horas", value: 24 },
];

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const [hiddenChats, setHiddenChats] = useState([]);
  const [showHiddenChats, setShowHiddenChats] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedHiddenChat, setSelectedHiddenChat] = useState(null);
  const [password, setPassword] = useState("");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const user = auth.currentUser;
  const navigation = useNavigation();
  const theme = isNightMode ? darkTheme : lightTheme;

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isNightMode ? "#1a1a1a" : "#fff",
      },
      headerTintColor: isNightMode ? "#fff" : "#000",
      headerLeft: () => (
        <Ionicons
          name="arrow-back"
          size={24}
          color={isNightMode ? "#fff" : "#000"}
          style={{ marginLeft: 10 }}
          onPress={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation, isNightMode]);

  useFocusEffect(
    useCallback(() => {
      const fetchChats = async () => {
        if (!user) return;
      
        try {
          const userRef = doc(database, "users", user.uid);
          const userSnapshot = await getDoc(userRef);
          const blockedUsers = userSnapshot.data()?.blockedUsers || [];
      
          const chatsRef = collection(database, "chats");
          const q = query(
            chatsRef,
            where("participants", "array-contains", user.uid)
          );
      
          const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const chatList = await Promise.all(
              querySnapshot.docs.map(async (docSnapshot) => {
                const chatData = docSnapshot.data();
      
                if (
                  chatData.isHidden?.[user.uid] ||
                  blockedUsers.some((blockedUid) =>
                    chatData.participants.includes(blockedUid)
                  )
                ) {
                  return null;
                }
      
                const otherUserId = chatData.participants.find(
                  (uid) => uid !== user.uid
                );
      
                const otherUserDoc = await getDoc(
                  doc(database, "users", otherUserId)
                );
                if (!otherUserDoc.exists()) {
                  return null;
                }
      
                const otherUserData = otherUserDoc.data();
      
                // Cálculo de mensajes no leídos
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
      
                const unseenMessagesCount = unseenMessagesSnapshot.size;
      
                return {
                  id: docSnapshot.id,
                  user: otherUserData,
                  unseenMessagesCount, // Agregar el conteo
                  lastMessage: chatData.lastMessage || "", // Agregar el último mensaje
                  lastMessageTimestamp: chatData.lastMessageTimestamp || null,
                };
              })
            );
      
            const sortedChats = chatList
            .filter((chat) => chat !== null)
            .sort((a, b) => {
              const dateA = a.lastMessageTimestamp
                ? a.lastMessageTimestamp.toDate().getTime()
                : 0;
              const dateB = b.lastMessageTimestamp
                ? b.lastMessageTimestamp.toDate().getTime()
                : 0;
              return dateB - dateA; // Orden descendente
            });
      
              setChats(sortedChats);
          });
      
          return () => unsubscribe();
        } catch (error) {
          console.error("Error al obtener los chats:", error);
        }
      };
      
  
      fetchChats();
    }, [user?.uid])
  );
  

  useEffect(() => {
    const filtered = chats.filter((chat) =>
      chat.user.username.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [chats, searchText]);

  const handleDeleteChat = async (chat) => {
    try {
      const batch = writeBatch(database);
      const chatRef = doc(database, "chats", chat.id);
      const messagesRef = collection(database, "chats", chat.id, "messages");

      // Actualizar isHidden y deletedFor en el documento del chat
      batch.update(chatRef, {
        [`isHidden.${user.uid}`]: true,
        [`deletedFor.${user.uid}`]: true,
      });

      // Actualizar todos los mensajes como eliminados para el usuario actual
      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.forEach((messageDoc) => {
        batch.update(messageDoc.ref, {
          [`deletedFor.${user.uid}`]: true,
        });
      });

      // Confirmar los cambios en Firebase
      await batch.commit();

      // Actualizar el estado local para ocultar el chat
      setChats((prevChats) => prevChats.filter((c) => c.id !== chat.id));

      Alert.alert("Éxito", "El chat ha sido eliminado y ocultado para ti.");
    } catch (error) {
      console.error("Error al eliminar el chat:", error);
      Alert.alert(
        "Error",
        "No se pudo eliminar el chat. Por favor, intenta nuevamente."
      );
    }
  };

  const handleHideChat = (chat) => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Ocultar chat",
        "Ingresa una contraseña para ocultar este chat",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Ocultar",
            onPress: (password) => hideChat(chat, password),
          },
        ],
        "secure-text"
      );
    } else {
      setSelectedHiddenChat(chat);
      setPasswordModalVisible(true);
    }
  };

  const hideChat = async (chat, password) => {
    if (password) {
      try {
        await updateDoc(doc(database, "chats", chat.id), {
          isHidden: true,
          password: password,
        });
        setChats(chats.filter((c) => c.id !== chat.id));
        setHiddenChats([...hiddenChats, { ...chat, isHidden: true, password }]);
      } catch (error) {
        console.error("Error al ocultar el chat:", error);
        Alert.alert("Error", "No se pudo ocultar el chat. Inténtalo de nuevo.");
      }
    } else {
      Alert.alert("Error", "Debes ingresar una contraseña");
    }
  };

  const handleHiddenChatPress = (chat) => {
    setSelectedHiddenChat(chat);
    setPasswordModalVisible(true);
  };

  const handlePasswordSubmit = () => {
    if (selectedHiddenChat && password === selectedHiddenChat.password) {
      updateDoc(doc(database, "chats", selectedHiddenChat.id), {
        isHidden: false,
        password: "",
      });
      setChats([...chats, { ...selectedHiddenChat, isHidden: false }]);
      setHiddenChats(hiddenChats.filter((c) => c.id !== selectedHiddenChat.id));
      setPasswordModalVisible(false);
      setPassword("");
      setSelectedHiddenChat(null);
    } else {
      Alert.alert("Error", "Contraseña incorrecta");
    }
  };

  const handleChatPress = async (chat) => {
    try {
      const messagesRef = collection(database, "chats", chat.id, "messages");
      const unseenMessagesQuery = query(
        messagesRef,
        where("seen", "==", false),
        where("senderId", "!=", user.uid)
      );
      const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);

      unseenMessagesSnapshot.forEach(async (messageDoc) => {
        await updateDoc(messageDoc.ref, { seen: true });
      });

      navigation.navigate("ChatUsers", {
        chatId: chat.id,
        recipientUser: chat.user,
      });
    } catch (error) {
      console.error("Error updating message seen status:", error);
    }
  };

  const formatTime = (timestamp) => {
    if (!(timestamp instanceof Timestamp)) {
      console.error("Invalid timestamp:", timestamp);
      return "";
    }

    const now = new Date();
    const messageDate = timestamp.toDate();
    const diff = now.getTime() - messageDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);

    if (days === 0) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (days === 1) {
      return "Ayer";
    } else if (days < 7) {
      return `${days} días`;
    } else if (weeks === 1) {
      return "1 sem";
    } else {
      return `${weeks} sem`;
    }
  };

  const truncateMessage = (message, maxLength = 10) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const handleOptionsPress = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedChats(chats.map((chat) => chat.id));
    } else {
      setSelectedChats([]);
    }
  };

  const handleDeleteSelectedChats = async () => {
    try {
      const batch = writeBatch(database);

      for (const chatId of selectedChats) {
        const chatRef = doc(database, "chats", chatId);
        const messagesRef = collection(database, "chats", chatId, "messages");

        batch.update(chatRef, {
          [`deletedFor.${user.uid}`]: true,
          [`isHidden.${user.uid}`]: true,
        });

        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.forEach((messageDoc) => {
          batch.update(messageDoc.ref, { [`deletedFor.${user.uid}`]: true });
        });
      }

      await batch.commit();

      setChats((prevChats) =>
        prevChats.filter((chat) => !selectedChats.includes(chat.id))
      );
      setSelectedChats([]);
      setIsSelectionMode(false);

      Alert.alert("Éxito", "Los chats seleccionados han sido eliminados.");
    } catch (error) {
      console.error("Error al eliminar los chats seleccionados:", error);
      Alert.alert(
        "Error",
        "No se pudieron eliminar los chats seleccionados. Intenta de nuevo."
      );
    }
  };

  const handleMuteSelectedChats = (hours) => {
    selectedChats.forEach((chatId) => {
      const chatRef = doc(database, "chats", chatId);
      const muteUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
      updateDoc(chatRef, { mutedUntil: muteUntil });
    });
    setSelectedChats([]);
    setIsSelectionMode(false);
    setShowMuteOptions(false);
  };

  const toggleChatSelection = (chatId) => {
    setSelectedChats((prevSelected) =>
      prevSelected.includes(chatId)
        ? prevSelected.filter((id) => id !== chatId)
        : [...prevSelected, chatId]
    );
  };

  const renderUnreadMessageCount = (chat) => {
    if (chat.unreadCount && chat.unreadCount > 0) {
      return (
        <View style={styles.unreadCountContainer}>
          <Text style={styles.unreadCountText}>{chat.unreadCount}</Text>
        </View>
      );
    }
    return null;
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        isSelectionMode ? toggleChatSelection(item.id) : handleChatPress(item)
      }
      onLongPress={() =>
        !isSelectionMode &&
        Alert.alert(
          "Eliminar Chat",
          "¿Estás seguro de que deseas eliminar este chat?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", onPress: () => handleDeleteChat(item) },
          ]
        )
      }
    >
      {isSelectionMode && (
        <View
          style={[
            styles.checkbox,
            selectedChats.includes(item.id) && styles.checkboxSelected,
          ]}
        />
      )}
      <Image
        source={{
          uri: item.user.photoUrls?.[0] || "https://via.placeholder.com/150",
        }}
        style={styles.userImage}
      />
      <View style={styles.chatInfo}>
        <Text
          style={[
            styles.chatTitle,
            { fontWeight: item.unseenMessagesCount > 0 ? "bold" : "normal" },
            { color: isNightMode ? "white" : "black" },
          ]}
        >
          {item.user.username || "Usuario desconocido"}
        </Text>
        {item.unseenMessagesCount === 0 && (
          <Text
            style={[
              styles.lastMessagePreview,
              { color: isNightMode ? "white" : "black" },
            ]}
          >
            {truncateMessage(item.lastMessage || "")}
          </Text>
        )}
      </View>
      <View style={styles.timeAndUnreadContainer}>
        {item.unseenMessagesCount > 0 ? (
          <View style={styles.unseenCountContainer}>
            <Text style={styles.unseenCountText}>
              {item.unseenMessagesCount}
            </Text>
          </View>
        ) : (
          <Text style={[styles.lastMessageTime, { color: isNightMode ? "white" : "black" }]}>
            {formatTime(item.lastMessageTimestamp)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  

  return (
    <Provider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <LinearGradient
          colors={isNightMode ? ["#1a1a1a", "#000"] : ["#fff", "#f0f0f0"]}
          style={styles.container}
        >
          <Notes />
          <View
            style={[styles.searchContainer, { borderColor: theme.borderColor }]}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.icon}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Pesquisar"
              placeholderTextColor={theme.placeholder}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Mensajes</Text>
            <Menu
              visible={showOptionsMenu}
              onDismiss={() => setShowOptionsMenu(false)}
              anchor={
                <TouchableOpacity onPress={handleOptionsPress}>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={24}
                    color={theme.icon}
                    style={styles.dotsIcon}
                  />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  setIsSelectionMode(true);
                  setShowOptionsMenu(false);
                }}
                title="Borrar Mensajes"
              />
              <Menu.Item
                onPress={() => {
                  setIsSelectionMode(true);
                  setShowMuteOptions(true);
                  setShowOptionsMenu(false);
                }}
                title="Silenciar Notificaciones"
              />
            </Menu>
          </View>

          {isSelectionMode && (
            <TouchableOpacity
              style={[
                styles.selectAllButton,
                { backgroundColor: theme.buttonBackground },
              ]}
              onPress={handleSelectAll}
            >
              <Text style={[styles.selectAllText, { color: theme.buttonText }]}>
                {selectAll ? "Deseleccionar todos" : "Seleccionar todos"}
              </Text>
            </TouchableOpacity>
          )}

          {showMuteOptions && (
            <View
              style={[
                styles.muteOptionsContainer,
                { backgroundColor: theme.muteOptionsBackground },
              ]}
            >
              {muteOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.muteOption,
                    { backgroundColor: theme.muteOptionBackground },
                  ]}
                  onPress={() => handleMuteSelectedChats(option.value)}
                >
                  <Text
                    style={[
                      styles.muteOptionText,
                      { color: theme.muteOptionText },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <FlatList
            data={showHiddenChats ? hiddenChats : filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
          />

          {isSelectionMode && (
            <View
              style={[
                styles.selectionModeContainer,
                { backgroundColor: theme.selectionModeBackground },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.selectionModeButton,
                  { backgroundColor: theme.selectionModeButtonBackground },
                ]}
                onPress={handleDeleteSelectedChats}
              >
                <Text
                  style={[
                    styles.selectionModeButtonText,
                    { color: theme.selectionModeButtonText },
                  ]}
                >
                  Borrar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectionModeButton,
                  { backgroundColor: theme.selectionModeButtonBackground },
                ]}
                onPress={() => setShowMuteOptions(true)}
              >
                <Text
                  style={[
                    styles.selectionModeButtonText,
                    { color: theme.selectionModeButtonText },
                  ]}
                >
                  Silenciar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectionModeButton,
                  { backgroundColor: theme.selectionModeButtonBackground },
                ]}
                onPress={() => setIsSelectionMode(false)}
              >
                <Text
                  style={[
                    styles.selectionModeButtonText,
                    { color: theme.selectionModeButtonText },
                  ]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    marginHorizontal: 15,
    paddingHorizontal: 10,
    marginBottom: 15,
    height: 43,
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
    marginVertical: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
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
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  submitButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonText: {
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  timeAndUnreadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadCountContainer: {
    backgroundColor: "black",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  unreadCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  lastMessageTime: {
    fontSize: 13,
  },
  lastMessagePreview: {
    fontSize: 14,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: "#000",
  },
  selectionModeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  selectionModeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
  },
  selectionModeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  muteOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  muteOption: {
    padding: 10,
    borderRadius: 5,
  },
  muteOptionText: {
    fontWeight: "bold",
  },
  selectAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
    alignSelf: "center",
    width: "50%",
  },
  selectAllText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});

const lightTheme = {
  background: "#fff",
  text: "#333",
  textSecondary: "#666",
  inputBackground: "#f5f5f5",
  placeholder: "#4b4b4b",
  icon: "#3e3d3d",
  borderColor: "#bbb7b7",
  noteBackground: "rgba(128, 128, 128, 0.7)",
  sendButtonBackground: "rgba(0, 0, 0, 0.5)",
  sendButtonIcon: "white",
  moodOptionsBackground: "rgba(255, 255, 255, 0.9)",
  noteResponseBackground: "white",
  modalBackground: "white",
  submitButtonBackground: "#b5a642",
  submitButtonText: "white",
  cancelButtonText: "#b5a642",
  buttonBackground: "rgba(255, 255, 255, 255)",
  buttonText: "#4b4b4b",
  muteOptionsBackground: "#f0f0f0",
  muteOptionBackground: "#3e3d3d",
  muteOptionText: "#fff",
  selectionModeBackground: "#f0f0f0",
  selectionModeButtonBackground: "rgba(255, 255, 255, 255)",
  selectionModeButtonText: "#4b4b4b",
};

const darkTheme = {
  background: "#000",
  text: "#fff",
  textSecondary: "#ccc",
  inputBackground: "#1a1a1a",
  placeholder: "white",
  icon: "#fff",
  borderColor: "#444",
  noteBackground: "rgba(64, 64, 64, 0.7)",
  sendButtonBackground: "rgba(255, 255, 255, 0.5)",
  sendButtonIcon: "black",
  moodOptionsBackground: "rgba(0, 0, 0, 0.9)",
  noteResponseBackground: "#1a1a1a",
  modalBackground: "#1a1a1a",
  submitButtonBackground: "black",
  submitButtonText: "black",
  cancelButtonText: "black",
  buttonBackground: "rgba(255, 255, 255, 0.2)",
  buttonText: "#fff",
  muteOptionsBackground: "#1a1a1a",
  muteOptionBackground: "black",
  muteOptionText: "#000",
  selectionModeBackground: "#1a1a1a",
  selectionModeButtonBackground: "rgba(255, 255, 255, 0.2)",
  selectionModeButtonText: "#fff",
};
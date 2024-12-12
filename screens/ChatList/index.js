import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
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
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, database } from "../../config/firebase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Menu, Provider } from "react-native-paper";
import Notes from "../../Components/Notes/Notes";
import { styles, lightTheme, darkTheme } from "./styles";
import { useTranslation } from "react-i18next";

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
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedMuteHours, setSelectedMuteHours] = useState(null);
  const [mutedChats, setMutedChats] = useState([]);
  const { t } = useTranslation();

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
    const fetchMutedChats = async () => {
      try {
        const userRef = doc(database, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        // Verifica que mutedChats sea un array antes de usar .map()
        const fetchedMutedChats = (userSnapshot.data()?.mutedChats || []).map(
          (mute) => ({
            ...mute,
            muteUntil:
              mute.muteUntil instanceof Timestamp
                ? mute.muteUntil.toDate()
                : new Date(mute.muteUntil), // Convierte si es necesario
          })
        );

        console.log("Muted Chats:", fetchedMutedChats);
        setMutedChats(fetchedMutedChats);
      } catch (error) {
        console.error("Error fetching muted chats:", error);
      }
    };

    fetchMutedChats();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isNightMode ? "black" : "#fff",
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

                const messagesSnapshot = await getDocs(messagesRef);

                if (messagesSnapshot.empty) {
                  return null; // Excluir chats sin mensajes
                }

                const unseenMessagesQuery = query(
                  messagesRef,
                  where("seen", "==", false),
                  where("senderId", "!=", user.uid)
                );
                const unseenMessagesSnapshot = await getDocs(
                  unseenMessagesQuery
                );

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

  const handleCloseMuteOptions = () => {
    setShowMuteOptions(false); // Oculta las opciones de silenciar
    setSelectedMuteHours(null); // Limpia la selección actual (opcional)
  };

  const handleChatPress = async (chat) => {
    const isMuted = mutedChats.some((mute) => mute.chatId === chat.id);

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
        currentChatId: chat.id,
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

  const handleCancel = () => {
    setShowMuteOptions(false); // Oculta las opciones de silenciar
    setSelectedMuteHours(null); // Limpia la selección de horas
    setIsSelectionMode(false); // Salir del modo de selección, si aplica
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

  const handleMuteSelectedChats = async () => {
    if (!selectedMuteHours) {
      Alert.alert("Error", "Por favor selecciona una duración para silenciar.");
      return;
    }

    const muteUntil = new Date(Date.now() + selectedMuteHours * 60 * 60 * 1000);
    try {
      const updatedMutedChats = [
        ...mutedChats,
        ...selectedChats.map((chatId) => ({ chatId, muteUntil })),
      ];

      // Actualiza Firebase
      const userRef = doc(database, "users", user.uid);
      await updateDoc(userRef, { mutedChats: updatedMutedChats });

      // Actualiza el estado local
      setMutedChats(updatedMutedChats);
      setSelectedChats([]);
      setIsSelectionMode(false);
      setShowMuteOptions(false);
    } catch (error) {
      console.error("Error al silenciar los chats:", error);
      Alert.alert(
        "Error",
        "No se pudieron silenciar los chats. Intenta nuevamente."
      );
    }
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

  const handleUnmuteChat = async (chatId) => {
    try {
      const updatedMutedChats = mutedChats.filter(
        (mute) => mute.chatId !== chatId
      );

      // Actualiza Firebase
      const userRef = doc(database, "users", user.uid);
      await updateDoc(userRef, { mutedChats: updatedMutedChats });

      // Actualiza el estado local
      setMutedChats(updatedMutedChats);
      Alert.alert("Éxito", "El silencio ha sido desactivado.");
    } catch (error) {
      console.error("Error al desactivar el silencio:", error);
      Alert.alert(
        "Error",
        "No se pudo desactivar el silencio. Intenta nuevamente."
      );
    }
  };

  const renderChatItem = ({ item }) => {
    const isMuted = mutedChats.some(
      (mute) => mute.chatId === item.id && new Date(mute.muteUntil) > new Date()
    );

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          isSelectionMode ? toggleChatSelection(item.id) : handleChatPress(item)
        }
        onLongPress={() => {
          if (isMuted) {
            Alert.alert(
              "Chat silenciado",
              "Este chat está silenciado. ¿Quieres desactivar el silencio?",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Desactivar silencio",
                  onPress: () => handleUnmuteChat(item.id),
                },
              ]
            );
          } else {
            Alert.alert(
              "Eliminar Chat",
              "¿Estás seguro de que deseas eliminar este chat?",
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Eliminar", onPress: () => handleDeleteChat(item) },
              ]
            );
          }
        }}
      >
        {isSelectionMode && (
          <View
            style={[
              styles.checkbox,
              selectedChats.includes(item.id) && {
                backgroundColor: isNightMode ? "white" : "black",
              },
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
          {isMuted && (
            <Ionicons
              name="notifications-off"
              size={16}
              color="red"
              style={{ marginRight: 10 }}
            />
          )}
          {item.unseenMessagesCount > 0 ? (
            <View style={styles.unseenCountContainer}>
              <Text style={styles.unseenCountText}>
                {item.unseenMessagesCount}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.lastMessageTime,
                { color: isNightMode ? "white" : "black" },
              ]}
            >
              {formatTime(item.lastMessageTimestamp)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMuteOptions = () => (
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
           {
             backgroundColor:
               selectedMuteHours === option.value
                 ? "transparent" // Fondo transparente si está seleccionado
                 : isNightMode
                 ? "white"
                 : "black", // Fondo dinámico si no está seleccionado
             borderWidth: selectedMuteHours === option.value ? 1 : 0, // Opcional para delinear
             borderColor: isNightMode ? "transparent" : "transparent", // Borde para contraste
           },
         ]}
         onPress={() => setSelectedMuteHours(option.value)}
       >
        <Text
          style={[
            styles.muteOptionText,
            {
              color: selectedMuteHours === option.value
                ? (isNightMode ? "white" : "black") // Color de texto dinámico según el fondo
                : (isNightMode ? "black" : "white"), // Texto para no seleccionados
            },
          ]}
        >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Provider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <LinearGradient
          colors={isNightMode ? ["black", "black"] : ["#fff", "#f0f0f0"]}
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

          {showMuteOptions && renderMuteOptions()}

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
                onPress={handleMuteSelectedChats}
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
                onPress={handleCancel}
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
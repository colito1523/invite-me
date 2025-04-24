
import React, { useEffect, useState, useCallback, } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal,
  RefreshControl,
  Image,
} from "react-native";
import { Image as ExpoImage } from "expo-image"; 
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, database } from "../../config/firebase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Menu, Provider } from "react-native-paper";
import Notes from "../../Components/Notes/Notes";
import { styles, lightTheme, darkTheme } from "./styles";
import { useTranslation } from "react-i18next";
import StoryViewer from '../../Components/Stories/storyViewer/StoryViewer';
import { useUnreadMessages } from '../../src/hooks/UnreadMessagesContext';
import { 
  formatTime, 
  truncateMessage, 
  checkNightMode, 
  handleDeleteChat,
  handleMuteSelectedChats,
  handleUnmuteChat,
  handleChatPress,
  checkStories,
  handleDeleteSelectedChats,
  handleChatPressLocal,
  saveChatsToCache,
  getChatsFromCache 
} from './utils';

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedMuteHours, setSelectedMuteHours] = useState(null);
  const [mutedChats, setMutedChats] = useState([]);
  const [selectedStories, setSelectedStories] = useState([]);
  const [preloadedImages, setPreloadedImages] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { setHasUnreadMessages } = useUnreadMessages();
  const [notesRefresh, setNotesRefresh] = useState(0);


  const loadChats = useCallback(async () => {
    setIsLoading(true);

    // Intenta cargar los chats desde la caché
    const cachedChats = await getChatsFromCache();
    if (cachedChats) {
      setChats(cachedChats);
    }

    // Luego, carga los chats desde Firebase
    try {
      const chatsRef = collection(database, "chats");
      const q = query(chatsRef, where("participants", "array-contains", user.uid));
      const querySnapshot = await getDocs(q);

      const userRef = doc(database, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
      const blockedUsers = userSnapshot.data()?.blockedUsers || [];

      const chatList = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const chatData = docSnapshot.data();
          if (
            chatData.isHidden?.[user.uid] ||
            blockedUsers.some((blockedUid) => chatData.participants.includes(blockedUid))
          ) {
            return null;
          }

          const otherUserId = chatData.participants.find((uid) => uid !== user.uid);
          const otherUserDoc = await getDoc(doc(database, "users", otherUserId));
          if (!otherUserDoc.exists()) return null;

          const otherUserData = otherUserDoc.data();
          const messagesRef = collection(database, "chats", docSnapshot.id, "messages");
          const unseenMessagesQuery = query(
            messagesRef,
            where("seen", "==", false),
            where("senderId", "!=", user.uid)
          );
          const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);

          return {
            id: docSnapshot.id,
            user: otherUserData,
            unseenMessagesCount: unseenMessagesSnapshot.size,
            lastMessage: chatData.lastMessage || "",
            lastMessageTimestamp: chatData.lastMessageTimestamp || null,
            lastMessageSenderId: chatData.lastMessageSenderId || "",
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
          return dateB - dateA;
        });

      const updatedChats = await checkStories(sortedChats, user.uid);
      setChats(updatedChats);

      // Guarda los chats en la caché
      await saveChatsToCache(updatedChats);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Cargar los chats cuando el componente se monta
  useEffect(() => {
    loadChats();
  }, [loadChats]);


  const onRefresh = useCallback(async () => {
    if (!user) return;
  
    setRefreshing(true);
    try {
      const chatsRef = collection(database, "chats");
      const q = query(chatsRef, where("participants", "array-contains", user.uid));
      const querySnapshot = await getDocs(q);
      
      const userRef = doc(database, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
      const blockedUsers = userSnapshot.data()?.blockedUsers || [];
  
      const chatList = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const chatData = docSnapshot.data();
          if (
            chatData.isHidden?.[user.uid] ||
            blockedUsers.some((blockedUid) => chatData.participants.includes(blockedUid))
          ) {
            return null;
          }
  
          const otherUserId = chatData.participants.find((uid) => uid !== user.uid);
          const otherUserDoc = await getDoc(doc(database, "users", otherUserId));
          if (!otherUserDoc.exists()) return null;
  
          const otherUserData = otherUserDoc.data();
          const messagesRef = collection(database, "chats", docSnapshot.id, "messages");
          const unseenMessagesQuery = query(
            messagesRef,
            where("seen", "==", false),
            where("senderId", "!=", user.uid)
          );
          const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);
  
          return {
            id: docSnapshot.id,
            user: otherUserData,
            unseenMessagesCount: unseenMessagesSnapshot.size,
            lastMessage: chatData.lastMessage || "",
            lastMessageTimestamp: chatData.lastMessageTimestamp || null,
            lastMessageSenderId: chatData.lastMessageSenderId || "", 
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
          return dateB - dateA;
        });
  
      const updatedChats = await checkStories(sortedChats, user.uid);
      setChats(updatedChats);
    } catch (error) {
      console.error("Error refreshing:", error);
    }
    setRefreshing(false);
    setNotesRefresh(prev => prev + 1);
  }, [user]);
  

  const { t } = useTranslation();
  const user = auth.currentUser;
  const navigation = useNavigation();
  const theme = isNightMode ? darkTheme : lightTheme;

  const muteOptions = [
    { label: t("SliderContent.hours", { count: 1 }), value: 1 },
    { label: t("SliderContent.hours", { count: 4 }), value: 4 },
    { label: t("SliderContent.hours", { count: 8 }), value: 8 },
    { label: t("SliderContent.hours", { count: 24 }), value: 24 },
  ];

  useEffect(() => {
    const checkTime = () => {
      setIsNightMode(checkNightMode());
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
        const fetchedMutedChats = (userSnapshot.data()?.mutedChats || []).map(
          (mute) => ({
            ...mute,
            muteUntil: mute.muteUntil instanceof Timestamp
              ? mute.muteUntil.toDate()
              : new Date(mute.muteUntil),
          })
        );
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
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
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
      if (!user) return;

      try {
        const userRef = doc(database, "users", user.uid);
        const blockedUsersRef = getDoc(userRef);

        const chatsRef = collection(database, "chats");
        const q = query(chatsRef, where("participants", "array-contains", user.uid));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const blockedUsers = (await blockedUsersRef).data()?.blockedUsers || [];
          let hasUnread = false;

          const chatList = await Promise.all(
            querySnapshot.docs.map(async (docSnapshot) => {
              const chatData = docSnapshot.data();
              if (chatData.isHidden?.[user.uid] || blockedUsers.some((blockedUid) => 
                chatData.participants.includes(blockedUid))) {
                return null;
              }

              const otherUserId = chatData.participants.find((uid) => uid !== user.uid);
              const otherUserDoc = await getDoc(doc(database, "users", otherUserId));
              if (!otherUserDoc.exists()) return null;

              const otherUserData = otherUserDoc.data();
              const messagesRef = collection(database, "chats", docSnapshot.id, "messages");
              const unseenMessagesQuery = query(
                messagesRef,
                where("seen", "==", false),
                where("senderId", "!=", user.uid)
              );
              const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);

              if (unseenMessagesSnapshot.size > 0) {
                hasUnread = true;
              }

              return {
                id: docSnapshot.id,
                user: otherUserData,
                unseenMessagesCount: unseenMessagesSnapshot.size,
                lastMessage: chatData.lastMessage || "",
                lastMessageTimestamp: chatData.lastMessageTimestamp || null,
                lastMessageSenderId: chatData.lastMessageSenderId || "",
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
              return dateB - dateA;
            });

          const updatedChats = await checkStories(sortedChats, user.uid);
          setChats(updatedChats);
          await saveChatsToCache(updatedChats);
          setHasUnreadMessages(hasUnread);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    }, [user?.uid])
  );

  useEffect(() => {
    const filtered = chats.filter((chat) =>
      chat.user.username.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [chats, searchText]);

  const handleDeleteChatLocal = async (chat) => {
    const success = await handleDeleteChat(chat, user.uid, t);
    if (success) {
      setChats((prevChats) => {
        const updatedChats = prevChats.filter((c) => c.id !== chat.id);
        // Actualiza la caché con la lista de chats actualizada
        saveChatsToCache(updatedChats);
        return updatedChats;
      });
    }
  };
  

  const handleImagePress = async (chat) => {
    const chatUser = chat.user;

    try {
      const userDoc = await getDoc(doc(database, "users", chatUser.uid));
      if (!userDoc.exists()) {
        Alert.alert(t("indexChatList.error"), t("indexChatList.dontFindResults"));
        return;
      }

      const userData = userDoc.data();
      const isPrivate = userData?.isPrivate || false;

      const friendsRef = collection(database, "users", auth.currentUser.uid, "friends");
      const friendQuery = query(friendsRef, where("friendId", "==", chatUser.uid));
      const friendSnapshot = await getDocs(friendQuery);
      const isFriend = !friendSnapshot.empty;

      if (isPrivate && !isFriend) {
        navigation.navigate("UserProfile", {
          selectedUser: {
            id: chatUser.uid,
            username: chatUser.username || "Usuario desconocido",
            firstName: userData.firstName || "Nombre desconocido",
            lastName: userData.lastName || "Apellido desconocido",
            profileImage: chatUser.photoUrls?.[0] || "https://via.placeholder.com/150",
            isPrivate: userData.isPrivate || false,
          },
        });
        return;
      }
      if (chatUser.hasStories) {
        const now = Date.now();
      
        const enrichedStories = chatUser.userStories.map((story) => {
          const createdAt = story.createdAt?.toDate ? story.createdAt.toDate() : new Date();
          const expiresAt = story.expiresAt?.toDate ? story.expiresAt.toDate() : new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
          const diffInMs = now - createdAt.getTime();
          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
          
          let timeAgoText = "";
          if (diffInMinutes < 1) {
            timeAgoText = "1m";
          } else if (diffInMinutes < 60) {
            timeAgoText = `${diffInMinutes}m`;
          } else if (diffInMinutes < 1440) {
            timeAgoText = `${Math.floor(diffInMinutes / 60)}h`;
          } else {
            timeAgoText = `${Math.floor(diffInMinutes / 1440)}d`;
          }
          
      
          return {
            ...story,
            createdAt,
            expiresAt,
            timeAgoText,
          };
        });
        console.log("🧪 enrichedStories:", enrichedStories.map(story => ({
          id: story.id,
          storyUrl: story.storyUrl,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
        })));
      
        console.log("🧪 setSelectedStories:", JSON.stringify([{
          uid: chatUser.uid,
          username: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
          profileImage: chatUser.photoUrls?.[0],
          userStories: enrichedStories,
          timeAgoText: enrichedStories[0]?.timeAgoText ?? "0m"
        }], null, 2));
        
        setSelectedStories([
          {
            uid: chatUser.uid,
            username: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
            profileImage: chatUser.photoUrls?.[0],
            userStories: enrichedStories,
            timeAgoText: enrichedStories[0]?.timeAgoText ?? "0m"
          },
        ]);
        const newPreloaded = {};
              for (const story of enrichedStories) {
                if (story.id && story.storyUrl) {
                  try {
                    await ExpoImage.prefetch(story.storyUrl);
                    newPreloaded[story.id] = true;
                  } catch (e) {
                    console.warn("No se pudo precargar:", e.message || e);
                  }
                }
              }
              setPreloadedImages(newPreloaded);
              setIsModalVisible(true);
      }
       else {
        handleChatPressLocalWrapper(chat);
      }
    } catch (error) {
      console.error("Error handling image press:", error);
      Alert.alert(t("indexChatList.error"), t("indexChatList.dontProccessRequest"));
    }
  };

  const handleChatPressLocalWrapper = (chat) => {
    handleChatPressLocal({
      chat,
      setChats,
      navigation,
      handleChatPress,
      userId: user.uid,
      setHasUnreadMessages,
    });
  };

  const handleOptionsPress = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedChats(selectAll ? [] : chats.map((chat) => chat.id));
  };

  const handleCancel = () => {
    setShowMuteOptions(false);
    setSelectedMuteHours(null);
    setIsSelectionMode(false);
  };

  const handleDeleteSelectedChatsLocal = async () => {
    const success = await handleDeleteSelectedChats(selectedChats, user.uid, t);
    if (success) {
      setChats((prevChats) => {
        const updatedChats = prevChats.filter((chat) => !selectedChats.includes(chat.id));
        saveChatsToCache(updatedChats);
        return updatedChats;
      });
      setSelectedChats([]);
      setIsSelectionMode(false);
    }
  };

  const handleMuteSelectedChatsLocal = async () => {
    const updatedMutedChats = await handleMuteSelectedChats(
      selectedChats,
      selectedMuteHours,
      mutedChats,
      user.uid,
      t
    );

    if (updatedMutedChats) {
      setMutedChats(updatedMutedChats);
      setSelectedChats([]);
      setIsSelectionMode(false);
      setShowMuteOptions(false);
    }
  };

  const handleUnmuteChatLocal = async (chatId) => {
    const updatedMutedChats = await handleUnmuteChat(chatId, mutedChats, user.uid, t);
    if (updatedMutedChats) {
      setMutedChats(updatedMutedChats);
    }
  };

  const toggleChatSelection = (chatId) => {
    setSelectedChats((prevSelected) =>
      prevSelected.includes(chatId)
        ? prevSelected.filter((id) => id !== chatId)
        : [...prevSelected, chatId]
    );
  };

  useEffect(() => {
    if (chats.length === 0) return;
  
    const cachedImages = {};
  
    chats.forEach((chat) => {
      if (chat.user?.hasStories && Array.isArray(chat.user.userStories)) {
        const urls = chat.user.userStories
          .map((story) => story.storyUrl)
          .filter(Boolean);
  
        if (urls.length > 0) {
          cachedImages[chat.user.uid] = urls;
        }
      }
    });
  
    if (Object.keys(cachedImages).length > 0) {
      console.log("📦 Historias detectadas desde ChatList:", cachedImages);
    }
  }, [chats]);




  const renderChatItem = ({ item }) => {
    const isMuted = mutedChats.some(
      (mute) => mute.chatId === item.id && new Date(mute.muteUntil) > new Date()
    );
    const getTranslatedLastMessage = (message, lastSenderId) => {
      if (message === "Sent a ...") {
        return lastSenderId === user.uid
          ? t("indexChatList.youSentMedia")
          : t("indexChatList.theySentMedia");
      }
    
      // Para otros mensajes, truncar si es necesario
      return truncateMessage(message, 10); // o el largo que prefieras
    };
    
    

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          isSelectionMode ? toggleChatSelection(item.id) : handleChatPressLocalWrapper(item)
        }
        onLongPress={() => {
          if (isMuted) {
            Alert.alert(
              t("indexChatList.muteChat"),
              t("indexChatList.muteChatConfirmation"),
              [
                { text: t("indexChatList.cancel"), style: "cancel" },
                {
                  text: t("indexChatList.unmuteChat"),
                  onPress: () => handleUnmuteChatLocal(item.id),
                },
              ]
            );
          } else {
            Alert.alert(
              t("indexChatList.deleteChat"),
              t("indexChatList.deleteChatConfirmation"),
              [
                { text: t("indexChatList.cancel"), style: "cancel" },
                { text: t("indexChatList.delete"), onPress: () => handleDeleteChatLocal(item) },
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
        <TouchableOpacity onPress={() => handleImagePress(item)}>
          <View
            style={[
              styles.userImageContainer,
              item.user.hasStories && {
                ...styles.storyIndicator,
                borderColor: isNightMode ? "white" : "black",
              },
              { padding: 2 },
            ]}
          >
           <ExpoImage
           cachePolicy="memory-disk"
              source={{
                uri: item.user.photoUrls?.[0] || "https://via.placeholder.com/150",
              }}
              style={styles.userImage}
            />
          </View>
        </TouchableOpacity>
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
           {getTranslatedLastMessage(item.lastMessage || "", item.lastMessageSenderId)}

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
               {formatTime(item.lastMessageTimestamp, t)}
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
                  ? "transparent"
                  : isNightMode
                  ? "white"
                  : "black",
              borderWidth: selectedMuteHours === option.value ? 1 : 0,
              borderColor: isNightMode ? "transparent" : "transparent",
            },
          ]}
          onPress={() => setSelectedMuteHours(option.value)}
        >
          <Text
            style={[
              styles.muteOptionText,
              {
                color: selectedMuteHours === option.value
                  ? (isNightMode ? "white" : "black")
                  : (isNightMode ? "black" : "white"),
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
        <LinearGradient
          colors={isNightMode ? ["black", "black"] : ["#fff", "#f0f0f0"]}
          style={styles.container}
        >
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => `chat-${item.id}`}
            renderItem={({ item }) => renderChatItem({ item })}
            ListFooterComponent={null}
            contentContainerStyle={{ paddingBottom: 0 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[isNightMode ? "#fff" : "#000"]}
                tintColor={isNightMode ? "#fff" : "#000"}
              />
              
            }
            ListHeaderComponent={
              <>
                <Notes refresh={notesRefresh} />
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
                    placeholder={t("indexChatList.searchPlaceholder")}
                    placeholderTextColor={theme.placeholder}
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                </View>
  
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {t("indexChatList.tittle")}
                  </Text>
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
    setShowMuteOptions(false); // 👈 Esto limpia la opción de mute
    setShowOptionsMenu(false);
  }}
  title={t("indexChatList.deleteChats")}
/>
                    <Menu.Item
                      onPress={() => {
                        setIsSelectionMode(true);
                        setShowMuteOptions(true);
                        setShowOptionsMenu(false);
                      }}
                      title={t("indexChatList.muteChats")}
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
                      {selectAll
                        ? t("indexChatList.selectAll")
                        : t("indexChatList.deselectAll")}
                    </Text>
                  </TouchableOpacity>
                )}
  
                {showMuteOptions && renderMuteOptions()}
              </>
            }
          />

{isSelectionMode && (
  <View style={[
    styles.selectionModeContainer,
    { backgroundColor: theme.selectionModeBackground },
  ]}>
    {!showMuteOptions && (
      <TouchableOpacity
        style={[
          styles.selectionModeButton,
          { backgroundColor: theme.selectionModeButtonBackground },
        ]}
        onPress={handleDeleteSelectedChatsLocal}
      >
        <Text
          style={[
            styles.selectionModeButtonText,
            { color: theme.selectionModeButtonText },
          ]}
        >
          {t("indexChatList.delete")}
        </Text>
      </TouchableOpacity>
    )}

    {showMuteOptions && (
      <TouchableOpacity
        style={[
          styles.selectionModeButton,
          { backgroundColor: theme.selectionModeButtonBackground },
        ]}
        onPress={handleMuteSelectedChatsLocal}
      >
        <Text
          style={[
            styles.selectionModeButtonText,
            { color: theme.selectionModeButtonText },
          ]}
        >
          {t("indexChatList.mute")}
        </Text>
      </TouchableOpacity>
    )}

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
        {t("indexChatList.cancel")}
      </Text>
    </TouchableOpacity>
  </View>
)}


  
          {isModalVisible && (
            <Modal
              visible={isModalVisible}
              animationType="fade"
              transparent={false}
            >
             <StoryViewer
  stories={selectedStories}
  initialIndex={0}
  onClose={async () => {
    setIsModalVisible(false);
    const updatedChats = await checkStories(chats, user.uid);
    if (updatedChats) {
      setChats(updatedChats);
    }
  }}
  unseenStories={{}}
  preloadedImages={preloadedImages}
  navigation={navigation}
/>
            </Modal>
          )}
        </LinearGradient>
    </Provider>
  );
}

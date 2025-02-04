
import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert, 
  Modal,
  RefreshControl
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
  handleChatPressLocal 
} from './utils';

export default function ChatList() {
  const [chats, setChats] = useState([]);
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { setHasUnreadMessages } = useUnreadMessages();

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

          return {
            id: docSnapshot.id,
            user: otherUserData,
            unseenMessagesCount: unseenMessagesSnapshot.size,
            lastMessage: chatData.lastMessage || "",
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
          return dateB - dateA;
        });

      const updatedChats = await checkStories(sortedChats, user.uid);
      setChats(updatedChats);
    } catch (error) {
      console.error("Error refreshing:", error);
    }
    setRefreshing(false);
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
      setChats((prevChats) => prevChats.filter((c) => c.id !== chat.id));
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
        const stories = chatUser.userStories.map((story) => ({
          ...story,
          createdAt: story.createdAt?.toDate ? story.createdAt : Timestamp.fromDate(new Date()),
          expiresAt: story.expiresAt?.toDate ? story.expiresAt : Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        }));
        setSelectedStories([
          {
            uid: chatUser.uid,
            username: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
            profileImage: chatUser.photoUrls?.[0],
            userStories: stories,
          },
        ]);
        setIsModalVisible(true);
      } else {
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
      setChats((prevChats) => prevChats.filter((chat) => !selectedChats.includes(chat.id)));
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
    if (chats.length > 0) {
      const debounceCheckStories = setTimeout(async () => {
        const updatedChats = await checkStories(chats, user.uid);
        if (JSON.stringify(updatedChats) !== JSON.stringify(chats)) {
          setChats(updatedChats);
        }
      }, 300);

      return () => clearTimeout(debounceCheckStories);
    }
  }, [chats]);

  const renderChatItem = ({ item }) => {
    const isMuted = mutedChats.some(
      (mute) => mute.chatId === item.id && new Date(mute.muteUntil) > new Date()
    );

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
            <Image
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
      <SafeAreaView style={[styles.container]}>
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

          <FlatList
            data={filteredChats}
            keyExtractor={(item) => `chat-${item.id}`}
            renderItem={renderChatItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[isNightMode ? "#fff" : "#000"]}
                tintColor={isNightMode ? "#fff" : "#000"}
              />
            }
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
              animationType="slide"
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
                navigation={navigation}
              />
            </Modal>
          )}
        </LinearGradient>
      </SafeAreaView>
    </Provider>
  );
}

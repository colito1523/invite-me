// SearchHistory.js
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { database } from "../../config/firebase";
import { saveSearchHistory } from "./utils";
import StoryViewer from "../../Components/Stories/storyViewer/StoryViewer";
import { styles } from "./styles";

const SearchHistory = ({
  user,
  blockedUsers,
  t,
  navigation,
  theme,
  isNightMode,
}) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStories, setSelectedStories] = useState(null);

  useEffect(() => {
    const loadSearchHistory = async () => {
      if (user) {
        try {
          const savedHistory = await AsyncStorage.getItem(
            `searchHistory_${user.uid}`
          );
          if (savedHistory !== null) {
            const parsedHistory = JSON.parse(savedHistory);

            const updatedHistory = await Promise.all(
              parsedHistory.map(async (item) => {
                const userDocRef = doc(database, "users", item.id);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                  return null;
                }
                const userData = userDoc.data();
                const isPrivate = userData?.isPrivate || false;

                const friendsRef = collection(
                  database,
                  "users",
                  user.uid,
                  "friends"
                );
                const friendsSnapshot = await getDocs(
                  query(friendsRef, where("friendId", "==", item.id))
                );
                const isFriend = !friendsSnapshot.empty;

                const storiesRef = collection(database, "users", item.id, "stories");
                const storiesSnapshot = await getDocs(storiesRef);
                const now = new Date();

                const hasStories = storiesSnapshot.docs.some((storyDoc) => {
                  const storyData = storyDoc.data();
                  return (
                    new Date(storyData.expiresAt.toDate()) > now &&
                    (!isPrivate || isFriend)
                  );
                });

                return {
                  ...item,
                  hasStories,
                  isPrivate,
                  isFriend,
                };
              })
            );

            const filteredHistory = updatedHistory.filter(
              (item) => item && !blockedUsers.includes(item.id)
            );

            setSearchHistory(filteredHistory);
          }
        } catch (error) {
          console.error(t("errorLoadingSearchHistory"), error);
        }
      }
    };

    loadSearchHistory();
  }, [user, blockedUsers, t]);

  const handleUserPress = (selectedUser) => {
    if (blockedUsers.includes(selectedUser.id)) {
      Alert.alert(t("error"), t("cannotInteractWithUser"));
      return;
    }

    // Actualiza el historial: si el usuario no existe se agrega
    const updatedHistory = [...searchHistory];
    const existingUser = updatedHistory.find(
      (item) => item.id === selectedUser.id
    );
    if (!existingUser) {
      updatedHistory.unshift(selectedUser);
      if (updatedHistory.length > 10) updatedHistory.pop();
      setSearchHistory(updatedHistory);
      saveSearchHistory(user, updatedHistory, blockedUsers);
    }

    navigation.navigate("UserProfile", {
      selectedUser: {
        ...selectedUser,
        isPrivate: selectedUser.isPrivate || false,
        isFriend: selectedUser.isFriend || false,
      },
    });
  };

  const removeFromHistory = (userId) => {
    const updatedHistory = searchHistory.filter((user) => user.id !== userId);
    setSearchHistory(updatedHistory);
    saveSearchHistory(user, updatedHistory, blockedUsers);
  };

  const renderHistoryItem = (item, index) => (
    <View key={`history-${item.id}-${index}`} style={styles.historyItem}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("UserProfile", { selectedUser: item })
        }
        style={styles.historyTextContainer}
      >
        <TouchableOpacity
          onPress={async () => {
            if (item.isPrivate) {
              const friendsRef = collection(
                database,
                "users",
                user.uid,
                "friends"
              );
              const friendsSnapshot = await getDocs(
                query(friendsRef, where("friendId", "==", item.id))
              );
              if (friendsSnapshot.empty) {
                navigation.navigate("UserProfile", { selectedUser: item });
                return;
              }
            }
            if (!item.hasStories) {
              navigation.navigate("UserProfile", { selectedUser: item });
            } else {
              try {
                const storiesRef = collection(
                  database,
                  "users",
                  item.id,
                  "stories"
                );
                const storiesSnapshot = await getDocs(storiesRef);
                const now = new Date();

                const userStories = storiesSnapshot.docs
                  .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt,
                    expiresAt: doc.data().expiresAt,
                    storyUrl: doc.data().storyUrl,
                    profileImage:
                      doc.data().profileImage || item.profileImage,
                    uid: item.id,
                    username:
                      doc.data().username ||
                      item.username ||
                      t("unknownUser"),
                    viewers: doc.data().viewers || [],
                    likes: doc.data().likes || [],
                  }))
                  .filter((story) => new Date(story.expiresAt.toDate()) > now);

                if (userStories.length > 0) {
                  setSelectedStories([
                    {
                      uid: item.id,
                      username:
                        `${item.firstName || ""} ${item.lastName || ""}`
                          .trim() ||
                        item.username ||
                        t("unknownUser"),
                      profileImage: item.profileImage,
                      userStories: userStories,
                    },
                  ]);
                  setIsModalVisible(true);
                } else {
                  navigation.navigate("UserProfile", { selectedUser: item });
                }
              } catch (error) {
                console.error(t("errorLoadingStories"), error);
                Alert.alert(t("error"), t("errorLoadingStories"));
              }
            }
          }}
        >
          <View
            style={[
              styles.unseenStoryCircle,
              item.hasStories && {
                borderColor: isNightMode ? "white" : "black",
              },
            ]}
          >
            <Image
              source={{
                uri: item.profileImage || "https://via.placeholder.com/150",
              }}
              style={styles.userImage}
            />
          </View>
        </TouchableOpacity>
        <Text style={[styles.resultText, { color: theme.text }]}>
          {item.username}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeFromHistory(item.id)}>
        <Ionicons name="close" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      {searchHistory.map((item, index) => renderHistoryItem(item, index))}
      {isModalVisible && (
        <Modal visible={isModalVisible} animationType="slide" transparent={false}>
          <StoryViewer
            stories={selectedStories}
            initialIndex={0}
            onClose={() => setIsModalVisible(false)}
            unseenStories={{}}
            navigation={navigation}
          />
        </Modal>
      )}
    </View>
  );
};

export default SearchHistory;

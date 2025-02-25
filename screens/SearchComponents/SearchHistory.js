import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { saveSearchHistory } from "./utils";
import StoryViewer from "../../Components/Stories/storyViewer/StoryViewer";
import { styles } from "./styles";
import { collection, getDocs } from "firebase/firestore";
import { database } from "../../config/firebase"; // Asegúrate de que la ruta sea la correcta

const SearchHistory = ({
  user,
  blockedUsers,
  t,
  navigation,
  theme,
  isNightMode,
  searchHistory,
  setSearchHistory,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStories, setSelectedStories] = useState(null);

  // Al hacer click en la imagen: si el usuario tiene historias, se muestran; si es privado o no tiene historias, se navega al perfil correspondiente.
  const handleHistoryPress = async (item) => {
    if (item.isPrivate) {
      navigation.navigate("PrivateUserProfile", { selectedUser: item });
      return;
    }
    if (!item.hasStories) {
      navigation.navigate("UserProfile", { selectedUser: item });
      return;
    }
    try {
      const storiesRef = collection(database, "users", item.id, "stories");
      const storiesSnapshot = await getDocs(storiesRef);
      const now = new Date();
      const userStories = storiesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
          expiresAt: doc.data().expiresAt,
          storyUrl: doc.data().storyUrl,
          profileImage: doc.data().profileImage || item.profileImage,
          uid: item.id,
          username: doc.data().username || item.username || t("unknownUser"),
          viewers: doc.data().viewers || [],
          likes: doc.data().likes || [],
        }))
        .filter((story) => new Date(story.expiresAt.toDate()) > now);

      if (userStories.length > 0) {
        setSelectedStories([
          {
            uid: item.id,
            username:
              `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
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
      navigation.navigate("UserProfile", { selectedUser: item });
    }

    setTimeout(() => {
      const updatedHistory = searchHistory.filter((u) => u.id !== item.id);
      updatedHistory.unshift(item);
      while (updatedHistory.length > 5) {
        updatedHistory.pop();
      }
      setSearchHistory(updatedHistory);
      saveSearchHistory(user, updatedHistory, blockedUsers);
    }, 500);
  };

  // Al hacer click en el nombre o en cualquier otra parte del contenedor: se navega directamente al perfil (privado o público según corresponda), ignorando las historias.
  const handleNamePress = (item) => {
    if (item.isPrivate) {
      navigation.navigate("PrivateUserProfile", { selectedUser: item });
    } else {
      navigation.navigate("UserProfile", { selectedUser: item });
    }
    setTimeout(() => {
      const updatedHistory = searchHistory.filter((u) => u.id !== item.id);
      updatedHistory.unshift(item);
      while (updatedHistory.length > 5) {
        updatedHistory.pop();
      }
      setSearchHistory(updatedHistory);
      saveSearchHistory(user, updatedHistory, blockedUsers);
    }, 500);
  };

  const removeFromHistory = async (userId) => {
    const updatedHistory = searchHistory.filter((userItem) => userItem.id !== userId);
    setSearchHistory(updatedHistory);
    await saveSearchHistory(user, updatedHistory, blockedUsers);
  };

  const renderHistoryItem = (item, index) => (
    <View key={`history-${item.id}-${index}`} style={styles.historyItem}>
      {/* Click en la imagen para ver historias (o navegar al perfil si no hay historias) */}
      <TouchableOpacity onPress={() => handleHistoryPress(item)}>
        <View style={[styles.unseenStoryCircle, item.hasStories && { borderColor: isNightMode ? "white" : "black" }]}>
          <Image
            source={{ uri: item.profileImage || "https://via.placeholder.com/150" }}
            style={styles.userImage}
          />
        </View>
      </TouchableOpacity>

      {/* Click en el contenedor (nombre) para ir al perfil directamente */}
      <TouchableOpacity onPress={() => handleNamePress(item)} style={styles.historyTextContainer}>
        <Text style={[styles.resultText, { color: theme.text }]}>{item.username}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => removeFromHistory(item.id)}>
        <Ionicons name="close" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );

  const filteredHistory = searchHistory.filter((item) => !blockedUsers.includes(item.id));

  return (
    <View>
      {filteredHistory.slice(0, 5).map((item, index) => renderHistoryItem(item, index))}
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

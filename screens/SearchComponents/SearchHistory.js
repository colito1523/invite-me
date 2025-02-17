import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Modal } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
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
  searchHistory,
  setSearchHistory,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStories, setSelectedStories] = useState(null);

  const handleHistoryPress = async (item) => {
    if (item.isPrivate && !item.isFriend) {
      navigation.navigate("PrivateUserProfile", { selectedUser: item });
    } else {
      navigation.navigate("UserProfile", { selectedUser: item });
    }
  
    // Retrasamos la actualización del historial para evitar refresco antes de la navegación
    setTimeout(() => {
      const updatedHistory = searchHistory.filter((u) => u.id !== item.id);
      updatedHistory.unshift(item);
      while (updatedHistory.length > 5) {
        updatedHistory.pop();
      }
      setSearchHistory(updatedHistory);
      saveSearchHistory(user, updatedHistory, blockedUsers);
    }, 500); // Ajusta este tiempo según el rendimiento de la navegación
  };
  
  

  const removeFromHistory = async (userId) => {
    const updatedHistory = searchHistory.filter((userItem) => userItem.id !== userId);
    setSearchHistory(updatedHistory);
    await saveSearchHistory(user, updatedHistory, blockedUsers);
  };

  const renderHistoryItem = (item, index) => (
    <View key={`history-${item.id}-${index}`} style={styles.historyItem}>
      <TouchableOpacity onPress={() => handleHistoryPress(item)} style={styles.historyTextContainer}>
        <TouchableOpacity onPress={() => handleHistoryPress(item)}>
          <View
            style={[
              styles.unseenStoryCircle,
              item.hasStories && { borderColor: isNightMode ? "white" : "black" },
            ]}
          >
            <Image
              source={{ uri: item.profileImage || "https://via.placeholder.com/150" }}
              style={styles.userImage}
            />
          </View>
        </TouchableOpacity>
        <Text style={[styles.resultText, { color: theme.text }]}>{item.username}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeFromHistory(item.id)}>
        <Ionicons name="close" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );

  // Filtrar el historial para excluir usuarios bloqueados
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

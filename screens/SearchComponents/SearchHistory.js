import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { saveSearchHistory } from "./utils";
import StoryViewer from "../../Components/Stories/storyViewer/StoryViewer";
import { styles } from "./styles";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
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

  const updateHistory = (updatedUser) => {
    setTimeout(() => {
      const updatedHistory = searchHistory.filter((u) => u.id !== updatedUser.id);
      updatedHistory.unshift(updatedUser);
      while (updatedHistory.length > 5) {
        updatedHistory.pop();
      }
      setSearchHistory(updatedHistory);
      saveSearchHistory(user, updatedHistory, blockedUsers);
    }, 500);
  };
    

  // Al hacer click en la imagen: si el usuario tiene historias, se muestran; si es privado o no tiene historias, se navega al perfil correspondiente.
  const handleHistoryPress = async (item) => {
    let updatedUser = item;
    try {
      // Obtener información actualizada del usuario
      const userRef = doc(database, "users", item.id);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        updatedUser = { ...item, ...userData };
  
        // Verifica si el usuario actual es amigo de este usuario
        const friendsRef = collection(database, "users", user.uid, "friends");
        const friendSnapshot = await getDocs(query(friendsRef, where("friendId", "==", updatedUser.id)));
        const isFriend = !friendSnapshot.empty;
  
        // Si el perfil es privado y no eres amigo, navega a PrivateUserProfile
        if (updatedUser.isPrivate && !isFriend) {
          navigation.navigate("PrivateUserProfile", { selectedUser: updatedUser });
          updateHistory(updatedUser);
          return;
        }
  
        // Si tiene historias, carga y muéstralas
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
            profileImage: doc.data().profileImage || updatedUser.profileImage,
            uid: item.id,
            username: doc.data().username || updatedUser.username || t("unknownUser"),
            viewers: doc.data().viewers || [],
            likes: doc.data().likes || [],
          }))
          .filter((story) => new Date(story.expiresAt.toDate()) > now);
  
        if (userStories.length > 0) {
          setSelectedStories([
            {
              uid: item.id,
              username:
                `${updatedUser.firstName || ""} ${updatedUser.lastName || ""}`.trim() ||
                updatedUser.username ||
                t("unknownUser"), // Ahora mostrará el nombre completo si está disponible
              profileImage: updatedUser.profileImage,
              userStories: userStories,
            },
          ]);
          
          setIsModalVisible(true);
        } else {
          navigation.navigate("UserProfile", { selectedUser: updatedUser });
        }
      } else {
        Alert.alert("Error", "Este usuario ya no existe.");
        return;
      }
    } catch (error) {
      console.error(t("errorLoadingStories"), error);
      Alert.alert(t("error"), t("errorLoadingStories"));
      return;
    }
    // Actualiza el historial con la información fresca
    updateHistory(updatedUser);
  };
  
  

  useEffect(() => {
    const checkStoriesAvailability = async () => {
      if (!user) return;
      try {
        // Para cada usuario en el historial, consultamos si tiene historias activas
        const updatedFlags = await Promise.all(
          searchHistory.map(async (item) => {
            const userRef = doc(database, "users", item.id);
            const userSnapshot = await getDoc(userRef);
            if (!userSnapshot.exists()) return { id: item.id, hasStories: false };
  
            const userData = userSnapshot.data();
            const isPrivate = userData.isPrivate || false;
  
            // Si el perfil es privado, verificamos si somos amigos
            let isFriend = false;
            if (isPrivate) {
              const friendsRef = collection(database, "users", user.uid, "friends");
              const friendSnapshot = await getDocs(query(friendsRef, where("friendId", "==", item.id)));
              isFriend = !friendSnapshot.empty;
            }
  
            // Solo verificamos historias si el perfil es público o si somos amigos
            if (!isPrivate || isFriend) {
              const storiesRef = collection(database, "users", item.id, "stories");
              const storiesSnapshot = await getDocs(storiesRef);
              const now = new Date();
              const activeStories = storiesSnapshot.docs
                .map(doc => ({
                  ...doc.data(),
                  expiresAt: doc.data().expiresAt.toDate(),
                }))
                .filter(story => story.expiresAt > now);
  
              return { id: item.id, hasStories: activeStories.length > 0 };
            }
  
            return { id: item.id, hasStories: false }; // Si es privado y no somos amigos
          })
        );
  
        // Actualizamos solo la propiedad "hasStories" en el estado del historial
        setSearchHistory(prev =>
          prev.map(item => {
            const flag = updatedFlags.find(u => u.id === item.id);
            return { ...item, hasStories: flag ? flag.hasStories : false };
          })
        );
      } catch (error) {
        console.error("Error checking stories availability:", error);
      }
    };
  
    const interval = setInterval(checkStoriesAvailability);
    return () => clearInterval(interval);
  }, [searchHistory, user]);
  
  
  
  
  

  // Al hacer click en el nombre o en cualquier otra parte del contenedor: se navega directamente al perfil (privado o público según corresponda), ignorando las historias.
  const handleNamePress = async (item) => {
    let updatedUser = item;
    try {
      const userRef = doc(database, "users", item.id);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        updatedUser = { ...item, ...userSnapshot.data() };
  
        // Verifica si el usuario actual es amigo de este usuario
        const friendsRef = collection(database, "users", user.uid, "friends");
        const friendSnapshot = await getDocs(query(friendsRef, where("friendId", "==", updatedUser.id)));
        const isFriend = !friendSnapshot.empty;
  
        if (updatedUser.isPrivate && !isFriend) {
          navigation.navigate("PrivateUserProfile", { selectedUser: updatedUser });
        } else {
          navigation.navigate("UserProfile", { selectedUser: updatedUser });
        }
      }
    } catch (error) {
      console.error("Error fetching updated user data:", error);
    }
    updateHistory(updatedUser);
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
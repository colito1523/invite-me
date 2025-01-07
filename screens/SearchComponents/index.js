import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  SectionList,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useBlockedUsers } from "../../src/contexts/BlockContext";
import StorySlider from "../../Components/Stories/StorySlider";
import { useTranslation } from "react-i18next";
import { getAuth } from "firebase/auth";
import {
  fetchUsers,
  fetchRecommendations,
  sendFriendRequest,
  saveSearchHistory,
  cancelFriendRequest,
} from "./utils";
import { ActivityIndicator } from "react-native";
import { database } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import StoryViewer from "../../Components/Stories/StoryViewer"; // Added import
import { styles, lightTheme, darkTheme } from "./styles";

export default function Search() {
  const auth = getAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [requestStatus, setRequestStatus] = useState(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // Added state
  const [selectedStories, setSelectedStories] = useState(null); // Added state
  const blockedUsers = useBlockedUsers();
  const { t } = useTranslation();
  const storySliderRef = useRef(); // Added ref

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
    React.useCallback(() => {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: isNightMode ? "black" : "#fff",
        },
        headerTintColor: isNightMode ? "#fff" : "#000",
        headerTitleStyle: {
          color: isNightMode ? "#fff" : "#000",
        },
      });
    }, [isNightMode])
  );

  const theme = isNightMode ? darkTheme : lightTheme;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUsers(searchTerm, setResults),
      fetchRecommendations(user, setRecommendations),
      storySliderRef.current?.loadExistingStories(),
    ]);
    setRefreshing(false);
  }, [fetchUsers, fetchRecommendations, searchTerm, user]);

  useEffect(() => {
    fetchUsers(searchTerm, setResults);
  }, [fetchUsers, searchTerm]);

  useEffect(() => {
    fetchRecommendations(user, setRecommendations);
  }, [fetchRecommendations, user]);

  useEffect(() => {
    const checkFriendRequestStatus = async () => {
      try {
        const requestRef = collection(
          database,
          "users",
          user.uid,
          "friendRequests"
        );
        const existingRequestQuery = query(
          requestRef,
          where("fromId", "==", auth.currentUser.uid)
        );
        const existingRequestSnapshot = await getDocs(existingRequestQuery);

        if (!existingRequestSnapshot.empty) {
          const existingRequest = existingRequestSnapshot.docs[0].data();
          setRequestStatus(existingRequest.status);
        } else {
          setRequestStatus(null);
        }
      } catch (error) {
        console.error(t("errorCheckingFriendRequestStatus"), error);
      }
    };

    checkFriendRequestStatus();
  }, []);

  const renderRecommendationItem = ({ item, index }) => {
    const [status, setStatus] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
      const fetchFriendRequestStatus = async () => {
        try {
          const requestRef = collection(
            database,
            "users",
            item.id,
            "friendRequests"
          );
          const existingRequestQuery = query(
            requestRef,
            where("fromId", "==", auth.currentUser.uid)
          );
          const existingRequestSnapshot = await getDocs(existingRequestQuery);

          if (!existingRequestSnapshot.empty) {
            const existingRequest = existingRequestSnapshot.docs[0].data();
            setStatus(existingRequest.status);
          } else {
            setStatus(null);
          }
        } catch (error) {
          console.error(t("errorCheckingFriendRequestStatus"), error);
        }
      };

      fetchFriendRequestStatus();
    }, [item]);

    const toggleFriendRequest = async () => {
      setIsProcessing(true);

      try {
        if (status === "pending") {
          await cancelFriendRequest(item, setStatus, t); // Pasa 't' aquí
        } else {
          await sendFriendRequest(item, setStatus);
        }
      } catch (error) {
        console.error(t("errorHandlingFriendRequest"), error);
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <TouchableOpacity
        key={`recommendation-${item.id}-${index}`}
        style={styles.recommendationItem}
        onPress={() => handleUserPress(item)}
      >
        <Image
          source={{
            uri: item.profileImage || "https://via.placeholder.com/150",
          }}
          style={styles.userImage}
          cachePolicy="memory-disk"
        />
        <View style={styles.textContainer}>
          <Text style={[styles.resultText, { color: theme.text }]}>
            {item.username}
          </Text>
          {item.firstName && item.lastName && (
            <Text style={[styles.fullName, { color: theme.textSecondary }]}>
              {`${item.firstName} ${item.lastName}`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.addFriendButton,
            { backgroundColor: theme.buttonBackground },
          ]}
          onPress={toggleFriendRequest}
          disabled={isProcessing || status === "accepted"}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="black" />
          ) : status === "pending" ? (
            <Ionicons name="time" size={20} color="black" />
          ) : status === "accepted" ? (
            <Ionicons name="checkmark" size={20} color="black" />
          ) : (
            <Ionicons name="person-add" size={24} color="black" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
                // Verificar el estado actual del perfil
                const userDocRef = doc(database, "users", item.id);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                  return null; // Eliminar usuarios que ya no existen
                }

                const userData = userDoc.data();
                const isPrivate = userData?.isPrivate || false;

                // Verificar si es amigo
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

                // Validar historias solo si es amigo o no es privado
                const storiesRef = collection(
                  database,
                  "users",
                  item.id,
                  "stories"
                );
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

            // Filtrar usuarios bloqueados o eliminados
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
  }, [user, blockedUsers]);

  const handleUserPress = (selectedUser) => {
    if (blockedUsers.includes(selectedUser.id)) {
      Alert.alert(t("error"), t("cannotInteractWithUser"));
      return;
    }

    // Agregar al historial si no existe ya
    const updatedHistory = [...searchHistory];
    const existingUser = updatedHistory.find(
      (item) => item.id === selectedUser.id
    );
    if (!existingUser) {
      updatedHistory.unshift(selectedUser);
      if (updatedHistory.length > 10) updatedHistory.pop();
      setSearchHistory(updatedHistory);
      saveSearchHistory(auth.currentUser, updatedHistory, blockedUsers);
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

  const renderHistoryItem = ({ item, index }) => (
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
                    profileImage: doc.data().profileImage || item.profileImage,
                    uid: item.id,
                    username:
                      doc.data().username || item.username || t("unknownUser"),
                    viewers: doc.data().viewers || [],
                    likes: doc.data().likes || [],
                  }))
                  .filter((story) => new Date(story.expiresAt.toDate()) > now);

                if (userStories.length > 0) {
                  setSelectedStories([
                    {
                      uid: item.id,
                      username:
                        `${item.firstName || ""} ${
                          item.lastName || ""
                        }`.trim() ||
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
                borderColor: isNightMode ? "white" : "black", // Color dinámico
              },
            ]}
          >
            <Image
              source={{
                uri: item.profileImage || "https://via.placeholder.com/150",
              }}
              style={styles.userImage} // Solo dimensiones, sin borde adicional
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

  const renderUserItem = ({ item, index }) => {
    return (
      <View key={`user-${item.id}-${index}`} style={styles.resultItem}>
        <TouchableOpacity
          onPress={async () => {
            if (item.isPrivate) {
              const friendsRef = collection(database, "users", user.uid, "friends");
              const friendsSnapshot = await getDocs(query(friendsRef, where("friendId", "==", item.id)));
              if (friendsSnapshot.empty) {
                navigation.navigate("UserProfile", { selectedUser: item });
                return;
              }
            }
            if (!item.hasStories) {
              handleUserPress(item);
            } else {
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
                    likes: doc.data().likes || []
                  }))
                  .filter((story) => new Date(story.expiresAt.toDate()) > now);
  
                if (userStories.length > 0) {
                  setSelectedStories([{
                    uid: item.id,
                    username: `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.username || t("unknownUser"),
                    profileImage: item.profileImage,
                    userStories: userStories
                  }]);
                  setIsModalVisible(true);
                } else {
                  handleUserPress(item);
                }
              } catch (error) {
                console.error(t("errorLoadingStories"), error);
                Alert.alert(t("error"), t("errorLoadingStories"));
                handleUserPress(item);
              }
            }
          }}
        >
          <View
            style={[
              styles.unseenStoryCircle,
              item.hasStories && {
                borderColor: isNightMode ? "white" : "black", // Color dinámico del borde
              },
            ]}
          >
            <Image
              source={{ uri: item.profileImage || "https://via.placeholder.com/150" }}
              style={styles.userImage} // Imagen interna sin borde adicional
            />
          </View>
        </TouchableOpacity>
  
        <TouchableOpacity
          onPress={() => handleUserPress(item)}
          style={styles.textContainer}
        >
          <Text style={[styles.resultText, { color: theme.text }]}>{item.username}</Text>
          {item.firstName && item.lastName && (
            <Text style={[styles.fullName, { color: theme.textSecondary }]}>
              {`${item.firstName} ${item.lastName}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  

  const sectionsData = [
    {
      title: t("recent"),
      data: searchHistory,
      renderItem: renderHistoryItem,
    },
    {
      title: t("suggestionsForYou"),
      data: recommendations,
      renderItem: renderRecommendationItem,
    },
  ];

  const loadExistingStories = async () => {
    //This function is added to reload stories after closing the StoryViewer
    await loadSearchHistory();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={isNightMode ? ["black", "black"] : ["#fff", "#f0f0f0"]}
        style={styles.container}
      >
        <View style={styles.header}>
          <StorySlider
            ref={storySliderRef}
            eventTitle={t("exampleEvent")}
            selectedDate={new Date()}
          />
        </View>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#333333"
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isNightMode ? "#fff" : "#000" },
            ]}
            placeholder={t("search")}
            placeholderTextColor="#333333"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {searchTerm.length === 0 ? (
          <SectionList
            sections={sectionsData}
            keyExtractor={(item, index) => item.id + index.toString()}
            renderItem={({ section, item }) => section.renderItem({ item })}
            renderSectionHeader={({ section }) =>
              section.data.length > 0 ? (
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {section.title}
                </Text>
              ) : null
            }
            renderSectionFooter={({ section }) =>
              section.title === t("recent") ? (
                <View style={styles.sectionSeparator} />
              ) : null
            }
            ListEmptyComponent={
              <Text style={{ color: theme.text }}>
                {t("noRecommendationsOrHistory")}
              </Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.icon]}
                tintColor={theme.icon}
              />
            }
          />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.icon]}
                tintColor={theme.icon}
              />
            }
          />
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
                await loadExistingStories();
              }}
              unseenStories={{}}
              navigation={navigation}
            />
          </Modal>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

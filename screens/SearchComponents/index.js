import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { Image } from "expo-image";
import { Feather, Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useBlockedUsers } from "../../src/contexts/BlockContext";
import StorySlider from "../../Components/Stories/StorySlider";
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { getAuth } from "firebase/auth"; // Add this line
import { fetchUsers, fetchRecommendations, sendFriendRequest, cancelFriendRequest, saveSearchHistory } from './utils';
import { database, auth } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { styles, lightTheme, darkTheme } from './styles';

export default function Search() {
  const auth = getAuth(); // Add this line
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [requestStatus, setRequestStatus] = useState(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const blockedUsers = useBlockedUsers();
  const { t } = useTranslation();

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(searchTerm, setResults), fetchRecommendations(user, setRecommendations)]);
    setRefreshing(false);
  }, [fetchUsers, fetchRecommendations]);

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
        console.error("Error checking friend request status:", error);
      }
    };

    checkFriendRequestStatus();
  }, []);

  const renderRecommendationItem = ({ item, index }) => {
    const [status, setStatus] = useState(null);

    useEffect(() => {
      const fetchFriendRequestStatus = async () => {
        try {
          const requestRef = collection(database, "users", item.id, "friendRequests");
          const existingRequestQuery = query(requestRef, where("fromId", "==", auth.currentUser.uid));
          const existingRequestSnapshot = await getDocs(existingRequestQuery);

          if (!existingRequestSnapshot.empty) {
            const existingRequest = existingRequestSnapshot.docs[0].data();
            setStatus(existingRequest.status);
          } else {
            setStatus(null);
          }
        } catch (error) {
          console.error("Error checking friend request status:", error);
        }
      };

      fetchFriendRequestStatus();
    }, [item]);

    const toggleFriendRequest = async () => {
      if (status === "pending") {
        await deleteFriendRequest(item, setStatus);
      } else {
        await sendFriendRequest(item, setStatus);
      }
    };

    return (
      <TouchableOpacity
        key={`recommendation-${item.id}-${index}`}
        style={styles.recommendationItem}
        onPress={() => handleUserPress(item)}
      >
        <Image
          source={{ uri: item.profileImage || "https://via.placeholder.com/150" }}
          style={styles.userImage}
          cachePolicy="memory-disk"
        />
        <View style={styles.textContainer}>
          <Text style={[styles.resultText, { color: theme.text }]}>{item.username}</Text>
          {item.firstName && item.lastName && (
            <Text style={[styles.fullName, { color: theme.textSecondary }]}> 
              {`${item.firstName} ${item.lastName}`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addFriendButton, { backgroundColor: theme.buttonBackground }]}
          onPress={toggleFriendRequest}
          disabled={status === "accepted"}
        >
          {status === "pending" ? (
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
            const filteredHistory = parsedHistory.filter(item => !blockedUsers.includes(item.id)); // Filter out blocked users
            setSearchHistory(filteredHistory);
          }
        } catch (error) {
          console.error(t('errorLoadingSearchHistory'), error);
        }
      }
    };

    loadSearchHistory();
  }, [user, blockedUsers]); // Add blockedUsers as a dependency

// En index.js, modifica el handleUserPress
const handleUserPress = (selectedUser) => {
  if (blockedUsers.includes(selectedUser.id)) {
    Alert.alert(t('error'), t('cannotInteractWithUser'));
    return;
  }
  const updatedHistory = [...searchHistory];
  const existingUser = updatedHistory.find((item) => item.id === selectedUser.id);
  if (!existingUser) {
    updatedHistory.unshift(selectedUser);
    if (updatedHistory.length > 10) updatedHistory.pop();
    setSearchHistory(updatedHistory);
    // Aquí pasamos el usuario actual (auth.currentUser)
    saveSearchHistory(auth.currentUser, updatedHistory, blockedUsers);
  }
  navigation.navigate("UserProfile", { 
    selectedUser: selectedUser, 
    imageUri: selectedUser.profileImage 
  });
};

  const removeFromHistory = (userId) => {
    const updatedHistory = searchHistory.filter((user) => user.id !== userId);
    setSearchHistory(updatedHistory);

    saveSearchHistory(user, updatedHistory, blockedUsers);
  };

  const renderHistoryItem = ({ item, index }) => (
    <View 
      key={`history-${item.id}-${index}`}
      style={styles.historyItem}
    >
      <TouchableOpacity
        onPress={() => handleUserPress(item)}
        style={styles.historyTextContainer}
      >
        <Image
          key={`history-image-${item.id}`}
          source={{
            uri: item.profileImage || "https://via.placeholder.com/150",
          }}
          style={styles.userImage}
          cachePolicy="memory-disk"
        />
        <Text style={[styles.resultText, { color: theme.text }]}>{item.username}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeFromHistory(item.id)}>
        <Ionicons name="close" size={20}   color={theme.text} />
      </TouchableOpacity>
    </View>
  );

  const renderUserItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        key={`user-${item.id}-${index}`}
        style={styles.resultItem}
        onPress={() => handleUserPress(item)}
      >
        <Image
          key={`user-image-${item.id}`}
          source={{ uri: item.profileImage || "https://via.placeholder.com/150" }}
          style={styles.userImage}
          cachePolicy="memory-disk"
        />
        <View style={styles.textContainer}>
          <Text style={[styles.resultText, { color: theme.text }]}>{item.username}</Text>
          {item.firstName && item.lastName && (
            <Text
              style={[styles.fullName, { color: theme.textSecondary }]}
            >{`${item.firstName} ${item.lastName}`}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const sectionsData = [
    {
      title: t('recent'),
      data: searchHistory,
      renderItem: renderHistoryItem,
    },
    {
      title: t('suggestionsForYou'),
      data: recommendations,
      renderItem: renderRecommendationItem,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={isNightMode ? ["#1a1a1a", "#000"] : ["#fff", "#f0f0f0"]}
        style={styles.container}
      >
        <View style={styles.header}>
          <StorySlider
            eventTitle={t('exampleEvent')}
            selectedDate={new Date()}
          />
        </View>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="gray"
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isNightMode ? "#fff" : "#000" },
            ]}
            placeholder={t('search')}
            placeholderTextColor="gray"
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
              section.title === t('recent') ? (
                <View style={styles.sectionSeparator} />
              ) : null
            }
            ListEmptyComponent={
              <Text style={{ color: theme.text }}>
                {t('noRecommendationsOrHistory')}
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
      </LinearGradient>
    </SafeAreaView>
  );
}
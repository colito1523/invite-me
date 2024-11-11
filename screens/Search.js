import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  SectionList,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Feather, Ionicons, AntDesign } from "@expo/vector-icons";
import { database, auth } from "../config/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  getDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useBlockedUsers } from "../src/contexts/BlockContext";
import StorySlider from "../Components/Stories/StorySlider";
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

export default function Search() {
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

  const fetchUsers = useCallback(async () => {
    if (searchTerm.trim().length > 0) {
      try {
        const normalizedSearchTerm = searchTerm.toLowerCase();
        const q = query(
          collection(database, "users"),
          where("username", ">=", normalizedSearchTerm),
          where("username", "<=", normalizedSearchTerm + "\uf8ff")
        );

        const querySnapshot = await getDocs(q);
        const userList = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              profileImage:
                data.photoUrls && data.photoUrls.length > 0
                  ? data.photoUrls[0]
                  : "https://via.placeholder.com/150",
            };
          })
          .filter(
            (user) =>
              user.id !== auth.currentUser.uid &&
              !blockedUsers.includes(user.id)
          );

        setResults(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    } else {
      setResults([]);
    }
  }, [searchTerm, blockedUsers]);

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;

    try {
      const friendsRef = collection(database, "users", user.uid, "friends");
      const friendsSnapshot = await getDocs(friendsRef);
      const friendsList = friendsSnapshot.docs.map(
        (doc) => doc.data().friendId
      );

      let potentialFriends = [];
      for (const friendId of friendsList) {
        const friendFriendsRef = collection(
          database,
          "users",
          friendId,
          "friends"
        );
        const friendFriendsSnapshot = await getDocs(friendFriendsRef);
        potentialFriends.push(
          ...friendFriendsSnapshot.docs.map((doc) => doc.data().friendId)
        );
      }

      potentialFriends = potentialFriends.filter(
        (id) =>
          id !== user.uid &&
          !friendsList.includes(id) &&
          !blockedUsers.includes(id)
      );

      const uniquePotentialFriends = [...new Set(potentialFriends)];

      const recommendedUsers = [];
      for (const friendId of uniquePotentialFriends) {
        const userDoc = await getDoc(doc(database, "users", friendId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          recommendedUsers.push({
            id: friendId,
            ...userData,
            profileImage:
              userData.photoUrls && userData.photoUrls.length > 0
                ? userData.photoUrls[0]
                : "https://via.placeholder.com/150",
          });
        }
      }

      setRecommendations(recommendedUsers);
    } catch (error) {
      console.error("Error fetching friend recommendations:", error);
    }
  }, [user, blockedUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchRecommendations()]);
    setRefreshing(false);
  }, [fetchUsers, fetchRecommendations]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

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

  const sendFriendRequest = async (user, setStatus) => {
    if (!auth.currentUser || !user) return;
  
    const currentUser = auth.currentUser;
    const friendsRef = collection(
      database,
      "users",
      currentUser.uid,
      "friends"
    );
    const q = query(friendsRef, where("friendId", "==", user.id));
    const friendSnapshot = await getDocs(q);
  
    if (friendSnapshot.empty) {
      const requestRef = collection(
        database,
        "users",
        user.id,
        "friendRequests"
      );
      const existingRequestQuery = query(
        requestRef,
        where("fromId", "==", currentUser.uid)
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);
  
      const userDocRef = doc(database, "users", currentUser.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const currentUserData = userDocSnapshot.exists()
        ? userDocSnapshot.data()
        : {
            username: t('anonymousUser'),
            photoUrls: ["https://via.placeholder.com/150"],
          };
  
      const profileImage =
        currentUserData.photoUrls && currentUserData.photoUrls.length > 0
          ? currentUserData.photoUrls[0]
          : "https://via.placeholder.com/150";
  
      if (existingRequestSnapshot.empty) {
        try {
          await addDoc(requestRef, {
            fromName: currentUserData.username,
            fromId: currentUser.uid,
            fromImage: profileImage,
            status: "pending",
            createdAt: new Date(),
          });
  
          setStatus("pending");
        } catch (error) {
          console.error(t('errorSendingFriendRequest'), error);
        }
      } else {
        // Request already exists
      }
    } else {
      Alert.alert(t('alreadyFriends'), t('alreadyFriendsMessage'));
    }
  };

  const cancelFriendRequest = async (user, setStatus) => {
    if (!auth.currentUser || !user) return;

    try {
      const requestRef = collection(database, "users", user.id, "friendRequests");
      const existingRequestQuery = query(
        requestRef,
        where("fromId", "==", auth.currentUser.uid)
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      if (!existingRequestSnapshot.empty) {
        const requestId = existingRequestSnapshot.docs[0].id;
        const requestDocRef = doc(database, "users", user.id, "friendRequests", requestId);
        await deleteDoc(requestDocRef);

        setStatus(null);
      }
    } catch (error) {
      console.error(t('errorCancelingFriendRequest'), error);
      Alert.alert(t('error'), t('errorCancelingFriendRequestMessage'));
    }
  };
  
  const renderRecommendationItem = ({ item, index }) => {
    const [status, setStatus] = useState(null);

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
          console.error(t('errorCheckingFriendRequestStatus'), error);
        }
      };

      fetchFriendRequestStatus();
    }, [item]);

    return (
      <TouchableOpacity
        key={`recommendation-${item.id}-${index}`}
        style={styles.recommendationItem}
        onPress={() => handleUserPress(item)}
      >
        <Image
          key={`recommendation-image-${item.id}`}
          source={{ uri: item.profileImage || "https://via.placeholder.com/150" }}
          style={styles.userImage}
          cachePolicy="memory-disk"
        />
        <View style={styles.textContainer}>
          <Text style={[styles.resultText, { color: theme.text }]}>
            {item.username}
          </Text>
          {item.firstName && item.lastName && (
            <Text
              style={[styles.fullName, { color: theme.textSecondary }]}
            >{`${item.firstName} ${item.lastName}`}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.addFriendButton,
            { backgroundColor: theme.buttonBackground },
          ]}
          onPress={() =>
            status === "pending"
              ? cancelFriendRequest(item, setStatus)
              : sendFriendRequest(item, setStatus)
          }
          disabled={status === "accepted"}
        >
          {status === "pending" ? (
            <Feather name="clock" size={20} color="black" />
          ) : status === "accepted" ? (
            <Feather name="check" size={20} color="black" />
          ) : (
            <AntDesign name="adduser" size={24} color="black" />
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
            setSearchHistory(JSON.parse(savedHistory));
          }
        } catch (error) {
          console.error(t('errorLoadingSearchHistory'), error);
        }
      }
    };

    loadSearchHistory();
  }, [user]);

  const saveSearchHistory = async (history) => {
    if (user) {
      try {
        // Convert the history object to a string and encode it safely
        const safeHistory = JSON.stringify(history.map(item => ({
          id: item.id,
          username: item.username,
          firstName: item.firstName || '',
          lastName: item.lastName || '',
          profileImage: item.profileImage || 'https://via.placeholder.com/150'
        })));
        
        await AsyncStorage.setItem(
          `searchHistory_${user.uid}`,
          safeHistory
        );
      } catch (error) {
        console.error(t('errorSavingSearchHistory'), error);
      }
    }
  };

  const handleUserPress = (user) => {
    if (blockedUsers.includes(user.id)) {
      Alert.alert(t('error'), t('cannotInteractWithUser'));
      return;
    }

    const updatedHistory = [...searchHistory];
    const existingUser = updatedHistory.find((item) => item.id === user.id);

    if (!existingUser) {
      updatedHistory.unshift(user);
      if (updatedHistory.length > 10) updatedHistory.pop();
      setSearchHistory(updatedHistory);

      saveSearchHistory(updatedHistory);
    }

    navigation.navigate("UserProfile", { selectedUser: user });
  };

  const removeFromHistory = (userId) => {
    const updatedHistory = searchHistory.filter((user) => user.id !== userId);
    setSearchHistory(updatedHistory);

    saveSearchHistory(updatedHistory);
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
        <Text style={[styles.resultText, { color: theme.text }]}>
          {item.username}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeFromHistory(item.id)}>
        <Feather name="x" size={20}   color={theme.text} />
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
          <Text style={[styles.resultText, { color: theme.text }]}>
            {item.username}
          </Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bbb7b7",
    borderRadius: 20,
    marginHorizontal: 15,
    paddingHorizontal: 10,
    width: "100%",
    alignSelf: "center",
    marginBottom: 15,
    height: 43,
  },
  searchIcon: {
    marginRight: 10,
    color: "#3e3d3d",
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginVertical: 15,
    letterSpacing: 1,
    color: "#4d4d4d",
  },
  sectionSeparator: {
    height: 40,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  historyTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
  },
  fullName: {
    fontSize: 14,
  },
  addFriendButton: {
    padding: 8,
    borderRadius: 5,
  },
});

const lightTheme = {
  background: "#fff",
  text: "black",
  textSecondary: "#666",
  inputBackground: "#f5f5f5",
  placeholder: "#999",
  icon: "black",
  buttonBackground: "#f0f0f0",
};

const darkTheme = {
  background: "#000",
  text: "#fff",
  textSecondary: "#ccc",
  inputBackground: "#1a1a1a",
  placeholder: "#666",
  icon: "black",
  buttonBackground: "#333",
};
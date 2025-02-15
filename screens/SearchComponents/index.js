import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  SectionList,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useBlockedUsers } from "../../src/contexts/BlockContext";
import StorySlider from "../../Components/Stories/storySlider/StorySlider";
import { useTranslation } from "react-i18next";
import { getAuth } from "firebase/auth";
import {
  fetchUsers,
  fetchRecommendations,
  handleUserPress as handleUserPressUtil,
} from "./utils";
import { database } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import RecommendedUserItem from "./RecommendedUserItem";
import SearchHistory from "./SearchHistory";
import StoryViewer from "../../Components/Stories/storyViewer/StoryViewer"; // Added import
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStories, setSelectedStories] = useState(null);
  const [stories, setStories] = useState([]);
  const [unseenStories, setUnseenStories] = useState({});
  const blockedUsers = useBlockedUsers();
  const { t } = useTranslation();
  const storySliderRef = useRef();

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
  

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isNightMode ? "black" : "#fff",
      },
      headerTintColor: isNightMode ? "#fff" : "#000",
      headerTitleStyle: {
        color: isNightMode ? "#fff" : "#000",
      },
    });
  }, [isNightMode]);

  const theme = isNightMode ? darkTheme : lightTheme;

  const onRefresh = useCallback(async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      await Promise.all([
        fetchUsers(searchTerm, setResults),
        fetchRecommendations(user, setRecommendations),
        storySliderRef.current?.loadExistingStories(
          t,
          setStories,
          setUnseenStories,
          false
        ),
      ]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [searchTerm, user, t]);

  useEffect(() => {
    fetchUsers(searchTerm, setResults);
  }, [searchTerm]);

  useEffect(() => {
    fetchRecommendations(user, setRecommendations);
  }, [user]);

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
    return (
      <RecommendedUserItem
        item={item}
        index={index}
        onUserPress={(selectedUser) =>
          handleUserPressUtil(selectedUser, {
            blockedUsers,
            searchHistory,
            setSearchHistory,
            navigation,
            currentUser: auth.currentUser,
            t,
          })
        }
        theme={theme}
      />
    );
  };
  
  const renderUserItem = ({ item, index }) => {
    return (
      <View key={`user-${item.id}-${index}`} style={styles.resultItem}>
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
              handleUserPressUtil(item, {
                blockedUsers,
                searchHistory,
                setSearchHistory,
                navigation,
                currentUser: auth.currentUser,
                t,
              });
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
                        `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
                        item.username ||
                        t("unknownUser"),
                      profileImage: item.profileImage,
                      userStories: userStories,
                    },
                  ]);
                  setIsModalVisible(true);
                } else {
                  handleUserPressUtil(item, {
                    blockedUsers,
                    searchHistory,
                    setSearchHistory,
                    navigation,
                    currentUser: auth.currentUser,
                    t,
                  });
                }
              } catch (error) {
                console.error(t("errorLoadingStories"), error);
                Alert.alert(t("error"), t("errorLoadingStories"));
                handleUserPressUtil(item, {
                  blockedUsers,
                  searchHistory,
                  setSearchHistory,
                  navigation,
                  currentUser: auth.currentUser,
                  t,
                });
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

        <TouchableOpacity
          onPress={() =>
            handleUserPressUtil(item, {
              blockedUsers,
              searchHistory,
              setSearchHistory,
              navigation,
              currentUser: auth.currentUser,
              t,
            })
          }
          style={styles.textContainer}
        >
          <Text style={[styles.resultText, { color: theme.text }]}>
            {item.username}
          </Text>
          {item.firstName && item.lastName && (
            <Text style={[styles.fullName, { color: theme.textSecondary }]}>
              {`${item.firstName} ${item.lastName}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const listHeader = (
    <>
      <StorySlider
        ref={storySliderRef}
        eventTitle={t("exampleEvent")}
        selectedDate={new Date()}
      />
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: isNightMode ? "#fff" : "#000" }]}
          placeholder={t("search")}
          placeholderTextColor="#333333"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>
    </>
  );

  return (
    <LinearGradient
      colors={isNightMode ? ["black", "black"] : ["#fff", "#f0f0f0"]}
      style={styles.container}
    >
      {searchTerm.length === 0 ? (
        <SectionList
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          sections={[
            {
              title: t("recent"),
              data: [null],
              renderItem: () => (
                <SearchHistory
                  user={user}
                  blockedUsers={blockedUsers}
                  t={t}
                  navigation={navigation}
                  theme={theme}
                  isNightMode={isNightMode}
                />
              ),
            },
            {
              title: t("suggestionsForYou"),
              data: recommendations.slice(0, 4),
              renderItem: renderRecommendationItem,
            },
          ]}
          keyExtractor={(item, index) => index.toString()}
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
          stickySectionHeadersEnabled={false}
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
          ListHeaderComponent={listHeader}
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
            onClose={() => setIsModalVisible(false)}
            unseenStories={{}}
            navigation={navigation}
          />
        </Modal>
      )}
    </LinearGradient>
  );
}

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  InteractionManager,
  View,
  TextInput,
  SectionList,
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
import StoryViewer from "../../Components/Stories/storyViewer/StoryViewer";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const [focusKey, setFocusKey] = useState(0);
  const [stories, setStories] = useState([]);
  const [unseenStories, setUnseenStories] = useState({});
  const blockedUsers = useBlockedUsers();
  const { t } = useTranslation();
  const storySliderRef = useRef();

  const user = auth.currentUser;
  const navigation = useNavigation();

  useEffect(() => {
    // Si el usuario no ha escrito nada, cargamos las recomendaciones con un leve retraso
    if (!searchTerm) {
      const timer = setTimeout(() => {
        fetchRecommendations(user, setRecommendations);
      }, 500); // medio segundo de retraso (ajusta a tu gusto)
  
      return () => clearTimeout(timer);
    } else {
      // Si el usuario empieza a teclear, vaciamos las recomendaciones para no bloquear
      setRecommendations([]);
    }
  }, [searchTerm, user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Forzar re-render
      setFocusKey(prev => prev + 1);
  
      // Limpiar todo
      setSearchTerm("");
      setResults([]);
      setRecommendations([]);  // <-- Asegúrate de vaciar

    });
  
    return unsubscribe;
  }, [navigation, user]);

  // Configuración de modo nocturno
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

  // Cargar historial de búsquedas
  useEffect(() => {
    const loadSearchHistory = async () => {
      if (!user) return;
      try {
        const savedHistory = await AsyncStorage.getItem(`searchHistory_${user.uid}`);
        if (savedHistory) {
          setSearchHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error("Error loading search history:", error);
      }
    };
    loadSearchHistory();
  }, [user]);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUsers(searchTerm, setResults),
        storySliderRef.current?.loadExistingStories(t, setStories, setUnseenStories, false),
      ]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [searchTerm, user, t]);
 

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchUsers(searchTerm, setResults);
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);


  useEffect(() => {
    const checkFriendRequestStatus = async () => {
      try {
        const requestRef = collection(database, "users", user.uid, "friendRequests");
        const existingRequestQuery = query(requestRef, where("fromId", "==", auth.currentUser.uid));
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
              const friendsRef = collection(database, "users", user.uid, "friends");
              const friendsSnapshot = await getDocs(query(friendsRef, where("friendId", "==", item.id)));
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
              item.hasStories && { borderColor: isNightMode ? "white" : "black" },
            ]}
          >
            <Image
              source={{ uri: item.profileImage || "https://via.placeholder.com/150" }}
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

  // Encabezado fijo que contiene el StorySlider y la barra de búsqueda (esta última se coloca debajo del StorySlider)
  const listHeader = (
    <>
      <StorySlider
        ref={storySliderRef}
        eventTitle={t("exampleEvent")}
        selectedDate={new Date()}
      />
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: isNightMode ? "#fff" : "#000" }]}
          placeholder={t("search")}
          placeholderTextColor="#333333"
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
    </>
  );

  // Definir las secciones según si hay término de búsqueda o no
// Definir las secciones según si hay término de búsqueda o no
const sections = searchTerm.length === 0
  ? [
      ...(searchHistory.length > 0
        ? [{
            title: t("recent"),
            data: [null], // se usa un valor placeholder para renderizar el SearchHistory
            sectionKey: "recent",
          }]
        : []), // Si no hay historial, no se agrega esta sección
      {
        title: t("suggestionsForYou"),
        data: recommendations.slice(0, 4),
        sectionKey: "suggestions",
      },
    ]
  : [
      {
        title: "",
        data: results,
        sectionKey: "results",
      },
    ];


  const renderSectionItem = ({ item, index, section }) => {
    if (searchTerm.length === 0) {
      if (section.sectionKey === "recent") {
        return (
          <SearchHistory
            user={user}
            blockedUsers={blockedUsers}
            t={t}
            navigation={navigation}
            theme={theme}
            isNightMode={isNightMode}
            searchHistory={searchHistory}
            setSearchHistory={setSearchHistory}
          />
        );
      }
      if (section.sectionKey === "suggestions") {
        return renderRecommendationItem({ item, index });
      }
    } else {
      return renderUserItem({ item, index });
    }
  };

  return (
    <LinearGradient
      colors={isNightMode ? ["black", "black"] : ["#fff", "#f0f0f0"]}
      style={styles.container}
    >
      <SectionList
       key={focusKey}
        ListHeaderComponent={listHeader}
        initialNumToRender={4}
        sections={sections}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderSectionItem}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {section.title}
            </Text>
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
            colors={isNightMode ? ["white"] : ["black"]} // Blanco de noche, negro de día
            tintColor={isNightMode ? "white" : "black"} // También cambia el indicador de carga
          />
        }
        keyboardShouldPersistTaps="handled"
      />
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
    </LinearGradient>
  );
}

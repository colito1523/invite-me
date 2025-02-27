import React, { useState, useEffect, useCallback, useRef } from "react";
import {
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

export default function Search({ route }) {
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
    const loadCachedRecommendations = async () => {
      if (!user) return;
  
      try {
        const cachedData = await AsyncStorage.getItem(`recommendations_${user.uid}`);
        if (cachedData) {
          const { recommendations } = JSON.parse(cachedData);
          setRecommendations(recommendations.map(user => ({
            ...user,
            profileImage: user.profileImage || "https://via.placeholder.com/150",
          })));
          return; // No llamamos a Firebase si ya hay caché
        }
      } catch (error) {
        console.error("Error loading cached recommendations:", error);
      }
  
      fetchRecommendations(user, setRecommendations);
    };
  
    if (!searchTerm) {
      loadCachedRecommendations();
    } else {
      setRecommendations([]);
    }
  }, [searchTerm, user]);
  

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (route.params?.forceStoryUpdate) {
        // Actualizamos silenciosamente el StorySlider
        storySliderRef.current?.loadExistingStories();
        // Limpiamos el parámetro para evitar actualizaciones innecesarias
        navigation.setParams({ forceStoryUpdate: undefined });
      }
    });
  
    return unsubscribe;
  }, [navigation, route.params?.forceStoryUpdate]);

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

 // Dentro de index.js, reemplaza el useEffect que carga el historial de búsqueda por este:

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

  // Cargar historial al montar el componente
  loadSearchHistory();

  // Cargar historial cada vez que la pantalla recupera el foco
  const unsubscribe = navigation.addListener("focus", () => {
    loadSearchHistory();
  });

  return unsubscribe;
}, [navigation, user]);


const onRefresh = useCallback(async () => {
  if (!user) return;
  setRefreshing(true);
  try {
    await Promise.all([
      fetchUsers(searchTerm, setResults),
      fetchRecommendations(user, setRecommendations, true), // Forzar actualización
      storySliderRef.current?.loadExistingStories(),
    ]);
  } catch (error) {
    console.error("Error refreshing:", error);
  } finally {
    setRefreshing(false);
  }
}, [searchTerm, user]);
 

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchUsers(searchTerm, setResults);
    }, 1);
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
        isNightMode={isNightMode}
      />
    );
  };

  const renderUserItem = ({ item, index }) => {
    return (
      <View key={`user-${item.id}-${index}`} style={styles.resultItem}>
        <TouchableOpacity
          onPress={() => {
            // 1) Si el usuario es privado y NO es amigo, navegar a PrivateUserProfile
            if (item.isPrivate && !item.isFriend) {
              navigation.navigate("PrivateUserProfile", { selectedUser: item });
              return;
            }
  
            // 2) Si no tiene historias, navegar directamente al perfil
            if (!item.hasStories) {
              handleUserPressUtil(item, {
                blockedUsers,
                searchHistory,
                setSearchHistory,
                navigation,
                currentUser: auth.currentUser,
                t,
              });
              return;
            }
  
            // 3) Si tiene historias almacenadas en `userStories`, abrir directamente el visor de historias
            if (item.userStories && item.userStories.length > 0) {
              setSelectedStories([
                {
                  uid: item.id,
                  username:
                    `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
                    item.username ||
                    t("unknownUser"),
                  profileImage: item.profileImage,
                  userStories: item.userStories,
                },
              ]);
              setIsModalVisible(true);
            } else {
              // Si por alguna razón `hasStories` es true pero `userStories` está vacío, ir al perfil
              handleUserPressUtil(item, {
                blockedUsers,
                searchHistory,
                setSearchHistory,
                navigation,
                currentUser: auth.currentUser,
                t,
              });
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
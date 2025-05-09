import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
  Dimensions
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { Menu, Provider } from "react-native-paper";
import { auth, database } from "../../config/firebase";
import { collection, doc, getDoc, addDoc, Timestamp, updateDoc } from "firebase/firestore";
import FriendListModal from "../../Components/Modals/FriendListModal";
import Complaints from "../../Components/Complaints/Complaints";
import MutualFriendsModal from "../../Components/Mutual-Friends-Modal/MutualFriendsModal";
import { styles } from "./styles";
import {
  fetchBlockedUsers,
  handleBlockUser,
  handleReport,
  checkHiddenStatus,
  checkHideMyStoriesStatus,
  handleLikeProfile,
  checkLikeStatus,
  fetchUserData,
  fetchFriendCount,
  fetchEvents,
  checkFriendship,
  fetchMutualFriends,
  handleSendMessage,
  handleBoxPress,
  handleToggleHiddenStories,
  toggleHideMyStories,
  toggleUserStatus,
} from "./utils";
import { ActivityIndicator } from "react-native";
import { localEventImages } from "../../src/constants/localEventImages";
import { generateImageKey } from "../Profile/utils"; // ajustá esta ruta según tu estructura

import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

const NameDisplay = ({
  firstName,
  lastName,
  friendCount,
  showFriendCount,
  onFriendListPress,
  showMutualFriends,
  renderMutualFriends,
  showFriendshipButton, // Added prop
  handleToggleFriendshipStatus, // Added prop
  isProcessing, // Added prop
  friendshipStatus, // Added prop
  pendingRequest, // Added prop
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.nameContainer}>
      <View style={styles.nameRow}>
  <Text style={styles.name}>
    {firstName} {lastName}
  </Text>
  {showFriendshipButton && (
    <Pressable
      style={styles.friendshipButton}
      onPress={handleToggleFriendshipStatus}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <AntDesign
          name={
            friendshipStatus
              ? "deleteuser"
              : pendingRequest
              ? "clockcircle"
              : "adduser"
          }
          size={27}
          color="white"
        />
      )}
    </Pressable>
  )}
</View>

      {showFriendCount && (
        <TouchableOpacity
          onPress={onFriendListPress}
          style={styles.friendCountContainer}
        >
          <Text style={styles.friendCountText}>{friendCount} </Text>
        </TouchableOpacity>
      )}
      {showMutualFriends && renderMutualFriends && (
        <View style={styles.mutualFriendsContainer}>
          {renderMutualFriends()}
        </View>
      )}
    </View>
  );
};

export default function UserProfile({ route, navigation }) {
  const { t } = useTranslation();
  const { selectedUser } = route.params || {};
  const [friendCount, setFriendCount] = useState(0);
  const [isNightMode, setIsNightMode] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [friendshipStatus, setFriendshipStatus] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [isFriendListVisible, setIsFriendListVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [firstInterest, setFirstInterest] = useState("");
  const [secondInterest, setSecondInterest] = useState("");
  const [thirdInterest, setThirdInterest] = useState("");
  const [fourthInterest, setFourthInterest] = useState("");
  const [mutualFriends, setMutualFriends] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0); // Added likeCount state
  const [isElementsVisible, setIsElementsVisible] = useState(true);
  const [hideStories, setHideStories] = useState(false);
  const [hideMyStories, setHideMyStories] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const { width: screenWidth } = Dimensions.get("window");
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isMutualFriendsModalVisible, setIsMutualFriendsModalVisible] =
    useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

 // Cargar datos esenciales primero y el resto en paralelo
 useEffect(() => {
  if (!user || !selectedUser) return;
  
  // Función para cargar datos críticos inmediatamente
  const loadInitialData = async () => {
    try {
      // Cargar datos prioritarios para renderizado inicial
      fetchUserData({
        selectedUser,
        setIsPrivate,
        user,
        navigation,
        setPhotoUrls,
        setFirstInterest,
        setSecondInterest,
        setThirdInterest,
        setFourthInterest,
      });
      
      // Cargar datos básicos del usuario para mostrar inmediatamente
      const userDoc = await getDoc(doc(database, "users", selectedUser.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setLikeCount(userData.likeCount || 0);
      }
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
    }
  };
  
  // Función para cargar el resto de los datos en segundo plano
  const loadBackgroundData = async () => {
    try {
      // Cargar todos los datos no críticos en paralelo
      Promise.all([
        // Bloqueos y preferencias
        fetchBlockedUsers({ user, setBlockedUsers }).then(blockedList => {
          // Una vez cargados los bloqueos, cargar eventos
          fetchEvents({
            selectedUser,
            blockedUsers: blockedList,
            setEvents,
            parseEventDate,
          });
        }),
        checkHiddenStatus({ user, selectedUser, setHideStories, setHideMyStories }),
        checkHideMyStoriesStatus({ user, selectedUser, setHideMyStories }),
        checkLikeStatus({ user, selectedUser, setIsLiked }),
        fetchFriendCount({ selectedUser, setFriendCount }),
        checkFriendship({
          user,
          selectedUser,
          setFriendshipStatus,
          setPendingRequest,
        }),
        fetchMutualFriends({ user, selectedUser, setMutualFriends })
      ]);
    } catch (error) {
      console.error("Error cargando datos secundarios:", error);
    }
  };

  // Ejecutar carga inicial inmediatamente
  loadInitialData();
  
  // Cargar datos secundarios después
  loadBackgroundData();
}, [user, selectedUser]); 

  const user = auth.currentUser;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleLongPress = () => {
    setIsElementsVisible(false);
  };

  const handlePressOut = () => {
    setIsElementsVisible(true);
  };

  const handleFriendSelect = (friend) => {
    navigation.navigate("UserProfile", { selectedUser: friend });
    setIsFriendListVisible(false);
  };

  const handleMutualFriendsPress = () => {
    setIsMutualFriendsModalVisible(true);
  };

  const handleReportSubmit = async (reason, description) => {
    try {
      const complaintsRef = collection(database, "complaints");
      const newComplaint = {
        reporterId: user.uid,
        reporterName: user.displayName || t("userProfile.anonymous"),
        reporterUsername: user.email ? user.email.split("@")[0] : "unknown",
        reportedId: selectedUser.id,
        reportedName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        reportedUsername: selectedUser.username || "unknown",
        reason: reason,
        description: description,
        timestamp: Timestamp.now(),
      };
      await addDoc(complaintsRef, newComplaint);
      Alert.alert(t("userProfile.thankYou"), t("userProfile.reportSubmitted"));
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert(
        t("userProfile.error"),
        t("userProfile.reportSubmissionError")
      );
    }
    setIsReportModalVisible(false);
  };

  const handleToggleFriendshipStatus = async () => {
    setIsProcessing(true);

    // Actualización optimista
    const newFriendshipStatus = !friendshipStatus;
    const newPendingRequest = !pendingRequest;

    setFriendshipStatus(newFriendshipStatus);
    setPendingRequest(newPendingRequest);

    try {
      // Realiza la actualización real en el backend
      const {
        friendshipStatus: updatedFriendshipStatus,
        pendingRequest: updatedPendingRequest,
      } = await toggleUserStatus({
        user,
        selectedUser,
        friendCount,
        t,
        friendshipStatus,
      });

      // Actualiza nuevamente con la respuesta real si es necesario
      setFriendshipStatus(updatedFriendshipStatus);
      setPendingRequest(updatedPendingRequest);
    } catch (error) {
      console.error("Error actualizando estado de amistad:", error);

      // Revertir el estado si ocurre un error
      setFriendshipStatus(!newFriendshipStatus);
      setPendingRequest(!newPendingRequest);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigation = async () => {
    try {
      if (auth.currentUser) {
        // 1) Actualizar hasSeenTutorial
        const userRef = doc(database, "users", auth.currentUser.uid);
        await updateDoc(userRef, { hasSeenTutorial: true });
  
        // 2) Obtener userData para saber el selectedCategory
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        // Si necesitas un idioma específico, por ejemplo:
        const selectedCategory =
          userData.preferredLanguage === "en" ? "All" : "Todos";
  
        // 3) Ver si se puede volver atrás
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Home", params: { selectedCategory: t("categories.all") } }],
          });
        }
      }
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };
  

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
      headerShown: false,
    });
  }, [navigation]);

  const parseEventDate = (dateString) => {
    const [day, month] = dateString.split(" ");
    const currentYear = new Date().getFullYear();
    const monthIndex = t("months", { returnObjects: true }).indexOf(
      month.toLowerCase()
    );
    return new Date(currentYear, monthIndex, parseInt(day));
  };

  // useEffect eliminado: estas operaciones ya se realizan en el useEffect unificado anterior
  // Mantener una dependencia en friendshipStatus puede causar ciclos de re-renders innecesarios

  const renderMutualFriends = () => {
    if (mutualFriends.length === 0) {
      return (
        <View style={styles.mutualFriendsContainer}>
          <Text style={styles.noMutualFriendsText}>
            {t("userProfile.noMutualFriends")}
          </Text>
        </View>
      );
    }
  
    return (
      <TouchableOpacity
        onPress={handleMutualFriendsPress}
        style={styles.mutualFriendsContainer}
      >
        <View style={styles.mutualFriendImagesContainer}>
          {Array.isArray(mutualFriends) &&
            mutualFriends.slice(0, 4).map((friend, index) => (
              <Image
                key={friend?.id || index}
                source={{
                  uri:
                    friend?.photoUrls?.[0] || "https://via.placeholder.com/150",
                }}
                style={[
                  styles.mutualFriendImage,
                  { left: index * (screenWidth * 0.05) },
                ]}
                cachePolicy="memory-disk"
              />
            ))}
  
          {mutualFriends.length > 4 && (
            <View
            style={[
              styles.mutualFriendImage,
              styles.mutualFriendCountBubble,
              { 
                left: 4 * (screenWidth * 0.05),
                backgroundColor: isNightMode ? "black" : "#FAEBD7",
                borderColor: isNightMode ? "black" : "#FAEBD7" // Cambio aquí
              },
            ]}
          >
            <Text style={[styles.mutualFriendCountText,{
              color: isNightMode ? "white" : "black", 
              },]}>
              +{mutualFriends.length - 4}
            </Text>
          </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  
  const renderOval = (value) => (
    <View style={styles.oval}>
      <Text style={styles.ovalText}>{value}</Text>
    </View>
  );

  const renderEvents = (start, end) => {
    const userId = auth.currentUser?.uid;

    const filteredEvents = events.slice(start, end).filter((event) => {
      // Mostrar todos los eventos que no sean de tipo "EventoParaAmigos"
      if (event.category && event.category !== "EventoParaAmigos") {
        return true;
      }

      // Mostrar eventos privados solo si el usuario está asistiendo o fue invitado
      if (event.category === "EventoParaAmigos") {
        const isAttending =
          Array.isArray(event.attendees) &&
          event.attendees.some((attendee) => attendee.uid === userId);
        const isInvited =
          Array.isArray(event.invitedFriends) &&
          event.invitedFriends.includes(userId);

        return isAttending || isInvited;
      }

      // No se muestra si no cumple con los requisitos anteriores
      return false;
    });

    return (
      <View style={styles.buttonContainer}>
        {filteredEvents.map((event, index) => (
         <TouchableOpacity
         key={index}
         style={styles.button}
         onPress={() => {
           const imageKey = generateImageKey(event.title);
           const localImage = localEventImages[imageKey];
           handleBoxPress({
             box: { ...event, imageUrl: localImage || event.imageUrl },
             navigation,
             t,
           });
         }}
       >
       
            <Text style={styles.buttonText}>
              {event.title.length > 9
                ? event.title.substring(0, 5) + "..."
                : event.title}{" "}
              {event.date || t("userProfile.noTitle")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  useEffect(() => {
    const fetchLikeCount = async () => {
      if (selectedUser && selectedUser.id) {
        const userDoc = await getDoc(doc(database, "users", selectedUser.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setLikeCount(userData.likeCount || 0);
        }
      }
    };

    fetchLikeCount();
  }, [selectedUser]); // Added useEffect to fetch like count

  return (
    <Provider>
      <ScrollView 
          contentContainerStyle={[
            styles.scrollViewContent,
            { backgroundColor: isNightMode ? "black" : "white" },
            {flexGrow: 1}
          ]}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
          >
        <View style={[styles.container, { backgroundColor: isNightMode ? "black" : "white" }]}>
          {isElementsVisible && (
    <TouchableOpacity
    style={styles.backButton}
    onPress={handleNavigation}
    accessibilityLabel={t("userProfile.backButton")}
  >
    <Ionicons name="arrow-back" size={27} color="white" />
  </TouchableOpacity>
  
    
          )}
          <ScrollView
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewHorizontal}
            onScroll={(event) => {
              const contentOffset = event.nativeEvent.contentOffset;
              const viewSize = event.nativeEvent.layoutMeasurement;
              const pageNum = Math.floor(contentOffset.x / viewSize.width);
              setCurrentImageIndex(pageNum);
            }}
            scrollEventThrottle={16}
          >
            {photoUrls.map((url, index) => (
              <Pressable
                key={index}
                style={[styles.imageContainer, { backgroundColor: isNightMode ? "black" : "white" }]}
                onLongPress={handleLongPress}
                onPressOut={handlePressOut}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.backgroundImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                {isElementsVisible && (
                  <View style={styles.overlay}>
                    <NameDisplay
                      firstName={selectedUser.firstName}
                      lastName={selectedUser.lastName}
                      friendCount={friendCount}
                      showFriendCount={index === 0}
                      onFriendListPress={() => setIsFriendListVisible(true)}
                      showMutualFriends={index === 1}
                      renderMutualFriends={renderMutualFriends}
                      showFriendshipButton={index === 0 || index === 1} // Added prop
                      handleToggleFriendshipStatus={handleToggleFriendshipStatus} // Added prop
                      isProcessing={isProcessing} // Added prop
                      friendshipStatus={friendshipStatus} // Added prop
                      pendingRequest={pendingRequest} // Added prop
                    />
                    <View style={styles.infoContainer}>
                      {index === 0 && (
                        <>
                          <View style={styles.spacer} />
                          {renderEvents(0, 4)}
                        </>
                      )}
                      {index === 1 && (
                        <>
                          <View style={styles.spacer} />
                          {renderEvents(4, 6)}
                        </>
                      )}
                      {index === 2 && (
                        <>
                          <View style={styles.contentWrapper}>
                            <View style={styles.ovalAndIconsContainer}>
                              <View style={styles.ovalWrapper}>
                                <View style={styles.ovalContainer}>
                                  {renderOval(firstInterest)}
                                  {renderOval(secondInterest)}
                                </View>

                                <View style={styles.ovalContainer}>
                                  {renderOval(thirdInterest)}
                                  {renderOval(fourthInterest)}
                                </View>
                              </View>
                              <View style={styles.iconsContainer}>
                                <Pressable
                                  style={styles.friendshipButton}
                                  onPress={handleToggleFriendshipStatus}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <ActivityIndicator
                                      size="small"
                                      color="#fff"
                                    />
                                  ) : (
                                    <AntDesign
                                      name={
                                        friendshipStatus
                                          ? "deleteuser"
                                          : pendingRequest
                                          ? "clockcircle"
                                          : "adduser"
                                      }
                                      size={27}
                                      color="white"
                                    />
                                  )}
                                </Pressable>

                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={() =>
                                    handleLikeProfile({
                                      blockedUsers,
                                      selectedUser,
                                      isLiked,
                                      t,
                                      likeCount,
                                      setIsLiked,
                                      setLikeCount,
                                      user,
                                    })
                                  }
                                >
                                  <AntDesign
                                    name={isLiked ? "heart" : "hearto"}
                                    size={27}
                                    color="white"
                                  />
                                  <Text style={styles.heartCountText}>
                                    {likeCount}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={() =>
                                    handleSendMessage({
                                      blockedUsers,
                                      selectedUser,
                                      navigation,
                                      t,
                                    })
                                  }
                                >
                                  <AntDesign
                                    name="message1"
                                    size={27}
                                    color="white"
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
          {isElementsVisible && (
            <View style={styles.menuContainer}>
              <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={
                  <TouchableOpacity
                    onPress={openMenu}
                    accessibilityLabel={t("userProfile.openOptionsMenu")}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={27}
                      color="white"
                    />
                  </TouchableOpacity>
                }
                contentStyle={styles.menuContent}
              >
                <Menu.Item
                  onPress={() => {
                    handleBlockUser({ user, selectedUser, t }); // Llamar a la nueva función
                    closeMenu();
                  }}
                  title={t("userProfile.block")}
                  titleStyle={{ color: "#FF3B30" }}
                />
                <Menu.Item
                  onPress={() =>
                    handleReport({
                      selectedUser,
                      setIsReportModalVisible,
                      setMenuVisible,
                      t,
                    })
                  }
                  title={t("userProfile.report")}
                />
                <Menu.Item
                  onPress={() =>
                    handleToggleHiddenStories({
                      user,
                      selectedUser,
                      t,
                      setHideStories,
                      hideStories,
                      closeMenu, // Pass closeMenu function
                    })
                  }
                  title={
                    hideStories
                      ? t("userProfile.seeTheirStories")
                      : t("userProfile.hideTheirStories")
                  }
                />
                <Menu.Item
                  onPress={() =>
                    toggleHideMyStories({
                      user,
                      selectedUser,
                      t,
                      setHideMyStories,
                      hideMyStories,
                      closeMenu, // Pass closeMenu function
                    })
                  }
                  title={
                    hideMyStories
                      ? t("userProfile.showMyStories")
                      : t("userProfile.hideMyStories")
                  }
                />
              </Menu>
            </View>
          )}
        </View>
      </ScrollView>
      <FriendListModal
        isVisible={isFriendListVisible}
        onClose={() => setIsFriendListVisible(false)}
        userId={selectedUser.id}
        onFriendSelect={handleFriendSelect}
      />
      <Complaints
        isVisible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSubmit={handleReportSubmit}
      />
      <MutualFriendsModal
        isVisible={isMutualFriendsModalVisible}
        onClose={() => setIsMutualFriendsModalVisible(false)}
        friends={mutualFriends}
      />
    </Provider>
  );
}

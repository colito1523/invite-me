import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { Menu, Provider } from "react-native-paper";
import { auth, database } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
  deleteDoc,
  Timestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import Complaints from "../Complaints/Complaints";
import FriendListModal from '../Modals/FriendListModal';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import MutualFriendsModal from "../Mutual-Friends-Modal/MutualFriendsModal";

const { width, height } = Dimensions.get("window");

const NameDisplay = ({ firstName, lastName, isNightMode, showAddFriendButton, friendshipStatus, pendingRequest, toggleUserStatus, isProcessing, friendCount, mutualFriends, handleMutualFriendsPress }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.nameContainer}>
      <View style={styles.nameAndButtonContainer}>
        <Text style={[styles.name]}>
          {firstName} {lastName}
        </Text>
        {showAddFriendButton && (
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={toggleUserStatus}
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
                color={isNightMode ? "#fff" : "#fff"}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
      {friendCount !== undefined && (
        <View style={styles.friendCountContainer}>
          <Text style={[styles.number, { color: isNightMode ? "#fff" : "#fff" }]}>
            {friendCount}
          </Text>
        </View>
      )}
      {mutualFriends !== undefined && (
        <View style={styles.mutualFriendsContainer}>
          {mutualFriends.length === 0 ? (
            <Text style={[styles.noMutualFriendsText, { color: isNightMode ? "#fff" : "#fff" }]}>
              {t('noMutualFriends')}
            </Text>
          ) : (
           <TouchableOpacity
  onPress={handleMutualFriendsPress}
  style={{ flexDirection: "row", alignItems: "center" }}
>
              <View style={{ flexDirection: "row", height: 40 }}>
                {mutualFriends.slice(0, 4).map((friend, index) => (
                  <Image
                    key={friend.uid}
                    source={{ uri: friend.photoUrls[0] }}
                    style={[styles.mutualFriendImage, { left: index * 30 }]}
                    cachePolicy="memory-disk"
                  />
                ))}
              </View>
              <Text style={[styles.mutualFriendMoreText, { marginLeft: 70, color: isNightMode ? "#fff" : "#fff" }]}>
                {mutualFriends.length > 4
                  ? t('andMoreMutualFriends', { count: mutualFriends.length - 4 })
                  : t('mutualFriends')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default function Component({ route, navigation }) {
  const { t } = useTranslation();
  const { selectedUser } = route.params || {};
  const [friendCount, setFriendCount] = useState(0);
  const [isNightMode, setIsNightMode] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [isFriendListVisible, setIsFriendListVisible] = useState(false);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isMutualFriendsModalVisible, setIsMutualFriendsModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const user = auth.currentUser;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleBlockUser = async () => {
    if (!user || !selectedUser) return;
  
    try {
      // Eliminar relaciones de amistad
      const currentUserFriendRef = collection(
        database,
        "users",
        user.uid,
        "friends"
      );
      const currentFriendQuery = query(
        currentUserFriendRef,
        where("friendId", "==", selectedUser.id)
      );
  
      const selectedUserFriendRef = collection(
        database,
        "users",
        selectedUser.id,
        "friends"
      );
      const selectedFriendQuery = query(
        selectedUserFriendRef,
        where("friendId", "==", user.uid)
      );
  
      const [currentFriendSnapshot, selectedFriendSnapshot] = await Promise.all([
        getDocs(currentFriendQuery),
        getDocs(selectedFriendQuery),
      ]);
  
      currentFriendSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
  
      selectedFriendSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
  
      // Agregar el usuario bloqueado a la lista de bloqueados del usuario actual
      const currentUserRef = doc(database, "users", user.uid);
      await updateDoc(currentUserRef, {
        blockedUsers: arrayUnion(selectedUser.id),
        manuallyBlocked: arrayUnion(selectedUser.id), // Campo adicional para diferenciar bloqueos manuales
      });
  
      // Agregar al usuario actual a la lista de bloqueados del usuario seleccionado
      const selectedUserRef = doc(database, "users", selectedUser.id);
      await updateDoc(selectedUserRef, {
        blockedUsers: arrayUnion(user.uid),
      });
  
      Alert.alert(
        t("userProfile.userBlocked"),
        `${selectedUser.firstName} ${t("userProfile.isBlocked")}`
      );
    } catch (error) {
      console.error("Error blocking user:", error);
      Alert.alert(t("userProfile.error"), t("userProfile.blockError"));
    }
  };
  

  const handleReport = async () => {
    if (!selectedUser || !selectedUser.id) {
      Alert.alert(
        t('userProfile.error'),
        t('userProfile.cannotReportUser')
      );
      return;
    }

    try {
      const userDoc = await getDoc(doc(database, "users", selectedUser.id));

      if (userDoc.exists()) {
        setIsReportModalVisible(true);
        setMenuVisible(false);
      } else {
        Alert.alert(t('userProfile.error'), t('userProfile.couldNotGetUserInfo'));
      }
    } catch (error) {
      console.error(t('userProfile.errorGettingUserData'), error);
      Alert.alert(
        t('userProfile.error'),
        t('userProfile.errorAccessingUserData')
      );
    }
  };

  const handleMutualFriendsPress = () => {
    setIsMutualFriendsModalVisible(true);
  };

  const handleReportSubmit = async (reason, description) => {
    try {
      const complaintsRef = collection(database, "complaints");
      const newComplaint = {
        reporterId: user.uid,
        reporterName: user.displayName || t('userProfile.anonymous'),
        reporterUsername: user.email ? user.email.split("@")[0] : "unknown",
        reportedId: selectedUser.id,
        reportedName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        reportedUsername: selectedUser.username || "unknown",
        reason: reason,
        description: description,
        timestamp: Timestamp.now(),
      };
      await addDoc(complaintsRef, newComplaint);
      Alert.alert(
        t('userProfile.thankYou'),
        t('userProfile.reportSubmitted')
      );
    } catch (error) {
      console.error(t('userProfile.errorSubmittingReport'), error);
      Alert.alert(
        t('userProfile.error'),
        t('userProfile.couldNotSubmitReport')
      );
    }
    setIsReportModalVisible(false);
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

  useEffect(() => {
    const fetchUserData = async () => {
      if (selectedUser && selectedUser.id) {
        const userDoc = await getDoc(doc(database, "users", selectedUser.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.photoUrls && userData.photoUrls.length > 0) {
            setPhotoUrls(userData.photoUrls);
          } else {
            setPhotoUrls(["https://via.placeholder.com/400"]);
          }
        }
      }
    };

    const fetchFriendCount = async () => {
      if (selectedUser && selectedUser.id) {
        const friendsRef = collection(
          database,
          "users",
          selectedUser.id,
          "friends"
        );
        const friendSnapshot = await getDocs(friendsRef);
        setFriendCount(friendSnapshot.size);
      }
    };

    const checkFriendship = async () => {
      if (user && selectedUser && selectedUser.id) {
        const friendsRef = collection(database, "users", user.uid, "friends");
        const q = query(friendsRef, where("friendId", "==", selectedUser.id));
        const friendSnapshot = await getDocs(q);
        setFriendshipStatus(!friendSnapshot.empty);

        const requestRef = collection(
          database,
          "users",
          selectedUser.id,
          "friendRequests"
        );
        const requestSnapshot = await getDocs(
          query(requestRef, where("fromId", "==", user.uid))
        );
        setPendingRequest(!requestSnapshot.empty);
      }
    };

    const fetchMutualFriends = async () => {
      if (user && selectedUser && selectedUser.id) {
        const userFriendsRef = collection(
          database,
          "users",
          user.uid,
          "friends"
        );
        const selectedUserFriendsRef = collection(
          database,
          "users",
          selectedUser.id,
          "friends"
        );

        const [userFriendsSnapshot, selectedUserFriendsSnapshot] =
          await Promise.all([
            getDocs(userFriendsRef),
            getDocs(selectedUserFriendsRef),
          ]);

        const userFriendIds = new Set(
          userFriendsSnapshot.docs.map((doc) => doc.data().friendId)
        );
        const mutualFriendIds = selectedUserFriendsSnapshot.docs
          .map((doc) => doc.data().friendId)
          .filter((id) => userFriendIds.has(id));

        const mutualFriendsData = await Promise.all(
          mutualFriendIds.map(async (id) => {
            const friendDoc = await getDoc(doc(database, "users", id));
            return friendDoc.data();
          })
        );

        setMutualFriends(mutualFriendsData);
      }
    };

    fetchUserData();
    fetchFriendCount();
    checkFriendship();
    fetchMutualFriends();
  }, [selectedUser, user]);

  const toggleUserStatus = async () => {
    if (!user || !selectedUser) return;

    setIsProcessing(true);

    // Verificar si ya hay una solicitud pendiente de la otra persona
  const currentUserRequestsRef = collection(
    database,
    "users",
    user.uid,
    "friendRequests"
  );
  const existingRequestFromThemQuery = query(
    currentUserRequestsRef,
    where("fromId", "==", selectedUser.id)
  );
  const existingRequestFromThemSnapshot = await getDocs(
    existingRequestFromThemQuery
  );

  if (!existingRequestFromThemSnapshot.empty) {
    Alert.alert(
        t('userProfile.error'),
        t('userProfile.TheyAreAlreadyFriends')
      );
    setIsProcessing(false);
    return;
  }

    const friendsRef = collection(database, "users", user.uid, "friends");
    const q = query(friendsRef, where("friendId", "==", selectedUser.id));
    const friendSnapshot = await getDocs(q);

    if (friendSnapshot.empty) {
      const requestRef = collection(
        database,
        "users",
        selectedUser.id,
        "friendRequests"
      );
      const existingRequestQuery = query(
        requestRef,
        where("fromId", "==", user.uid)
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      const userDocRef = doc(database, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      const currentUser = userDocSnapshot.exists()
        ? userDocSnapshot.data()
        : {
            username: t('anonymousUser'),
            profileImage: "https://via.placeholder.com/150",
          };

      const profileImage =
        currentUser.photoUrls && currentUser.photoUrls.length > 0
          ? currentUser.photoUrls[0]
          : "https://via.placeholder.com/150";

      if (existingRequestSnapshot.empty) {
        try {
          await addDoc(requestRef, {
            fromName: currentUser.username,
            fromId: user.uid,
            fromImage: profileImage,
            status: "pending",
            timestamp: Timestamp.now(),
          });

          setPendingRequest(true);
        } catch (error) {
          console.error(t('errorSendingFriendRequest'), error);
          Alert.alert(t('error'), t('couldNotSendFriendRequest'));
        }
      } else {
        try {
          existingRequestSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });

          setPendingRequest(false);
        } catch (error) {
          console.error(t('errorCancelingFriendRequest'), error);
        }
      }
    } else {
      Alert.alert(
        t('actionNotAllowed'),
        t('cannotRemoveFriendFromPrivateProfile')
      );
    }

    setIsProcessing(false);
  };

  const handleFriendSelect = (friend) => {
    navigation.navigate("UserProfile", { selectedUser: friend });
    setIsFriendListVisible(false);
  };

  return (
    <Provider>
      <LinearGradient
        colors={isNightMode ? ["#1a1a1a", "#000"] : ["#fff", "#f0f0f0"]}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('goBack')}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isNightMode ? "#fff" : "#fff"}
            />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{
                    uri:
                      index === 0
                        ? photoUrls[0]
                        : "https://via.placeholder.com/400",
                  }}
                  cachePolicy="memory-disk"
                  style={[
                    styles.backgroundImage,
                    index === 0 && styles.firstImageOverlay,
                    (index === 1 || index === 2) && styles.blankImageOverlay,
                  ]}
                  contentFit="cover"
                />
                <View style={styles.overlay}>
                  <NameDisplay
                    firstName={selectedUser.firstName}
                    lastName={selectedUser.lastName}
                    isNightMode={isNightMode}
                    showAddFriendButton={index === 0}
                    friendshipStatus={friendshipStatus}
                    pendingRequest={pendingRequest}
                    toggleUserStatus={toggleUserStatus}
                    isProcessing={isProcessing}
                    friendCount={index === 0 ? friendCount : undefined}
                    mutualFriends={index === 1 ? mutualFriends : undefined}
                    handleMutualFriendsPress={handleMutualFriendsPress}
                  />
                  <View style={styles.infoContainer}>
                    {index === 0 && (
                      <>
                        <View style={styles.rectanglesContainer}>
                          <View style={styles.topRectanglesRow}>
                            <View style={styles.rectangle} />
                            <View style={styles.rectangle} />
                          </View>
                          <View style={styles.bottomRectangle} />
                        </View>
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <View style={styles.horizontalRectanglesContainer}>
                          <View style={styles.rectangle} />
                          <View style={styles.rectangle} />
                        </View>
                      </>
                    )}
                    {index === 2 && (
                      <View style={styles.addFriendContainer}>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.menuContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <TouchableOpacity
                  onPress={openMenu}
                  accessibilityLabel={t('openOptionsMenu')}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={24}
                    color={isNightMode ? "#fff" : "#fff"}
                  />
                </TouchableOpacity>
              }
            >
              <Menu.Item
    onPress={() => {
      handleBlockUser(); // Llama a la nueva función
      closeMenu();
    }}
    title={t("userProfile.block")}
    titleStyle={{ color: "#FF3B30" }}
  />
              <Menu.Item onPress={handleReport} title={t('userProfile.report')} />
            </Menu>
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
      </LinearGradient>

      <MutualFriendsModal
  isVisible={isMutualFriendsModalVisible}
  onClose={() => setIsMutualFriendsModalVisible(false)}
  friends={mutualFriends}
/>
    </Provider>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  imageContainer: {
    width: width,
    height: "100%",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  firstImageOverlay: {
    opacity: 0.3,
  },
  blankImageOverlay: {
    opacity: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "flex-end",
    paddingBottom: 40,
  },
  infoContainer: {
    padding: 20,
  },
  nameContainer: {
    position: "absolute",
    top: 550,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  nameAndButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
    marginRight: 10, // Add some space between the name and the button
  },
  spacer: {
    height: 150,
  },
  friendCountContainer: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 40,
  },
  number: {
    fontSize: 24,
    fontWeight: "bold",
  },
  rectanglesContainer: {
    alignItems: "center",
  },
  topRectanglesRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  rectangle: {
    width: 160,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 5,
  },
  bottomRectangle: {
    width: 160,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  menuContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  mutualFriendsContainer: {
    marginTop: 20,
  },
  mutualFriendImagesContainer: {
    flexDirection: "row",
    height: 40,
  },
  mutualFriendImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "absolute",
  },
  mutualFriendMoreText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  noMutualFriendsText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  horizontalRectanglesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  addFriendContainer: {
    alignItems: "flex-end",
    marginTop: 20,
  },
  addFriendButton: {
    padding: 10,
    borderRadius: 20,
  },
});
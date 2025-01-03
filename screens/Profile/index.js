import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { auth, database, storage } from "../../config/firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { Provider } from "react-native-paper";
import FriendListModal from "../../Components/Modals/FriendListModal";
import { useTranslation } from "react-i18next";
import BlockedListModal from "../../Components/BlockedUsers/BlockedUsers";
import MenuSection from "../ProfileComponents/MenuSection";
import EventsSection from "../ProfileComponents/EventsSection";
import { FlatList } from "react-native-gesture-handler";
import { styles } from "./styles";
import { fetchUserData, setFetchUserData, handleTogglePrivacy, handleHeartPress, checkLikeStatus, fetchFriendCount, fetchHeartCount, pickImage, handleBoxPress } from "./utils"; 

const NameDisplay = React.memo(({
  name,
  surname,
  friendCount,
  isEditing,
  setName,
  setSurname,
  nameInputRef,
  surnameInputRef,
  handleFriendCountClick,
  displayFriendCount,
}) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.nameContainer, isEditing && styles.nameContainerEditing]}>
      {/* Condicional para modo edición o visualización */}
      <View style={[
          styles.nameAndSurnameContainer,
          isEditing && styles.nameAndSurnameContainerEditing,
        ]}>
        {isEditing ? (
          <>
            <TextInput
              ref={nameInputRef}
              style={[styles.editableText, styles.editableTextEditing]}
              value={name}
              onChangeText={setName}
              placeholder={t("profile.namePlaceholder")}
              placeholderTextColor="#bbb"
            />
            <TextInput
              ref={surnameInputRef}
              style={[styles.editableText, styles.editableTextEditing]}
              value={surname}
              onChangeText={setSurname}
              placeholder={t("profile.surnamePlaceholder")}
              placeholderTextColor="#bbb"
            />
          </>
        ) : (
          <Text style={styles.text}>
            {name} {surname}
          </Text>
        )}
      </View>

      {/* Condicional para mostrar cantidad de amigos */}
      {!isEditing && displayFriendCount && (
        <TouchableOpacity onPress={handleFriendCountClick} style={styles.friendCountContainer}>
          <Text style={styles.friendsText}>
            {friendCount > 0 ? friendCount : t("profile.loading")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export default function Profile({ navigation }) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [photoUrls, setPhotoUrls] = useState(["", "", ""]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const [events, setEvents] = useState([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFriendListVisible, setIsFriendListVisible] = useState(false);
  const [firstHobby, setFirstHobby] = useState("");
  const [secondHobby, setSecondHobby] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [firstInterest, setFirstInterest] = useState("");
  const [secondInterest, setSecondInterest] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isElementsVisible, setIsElementsVisible] = useState(true);
  const [heartCount, setHeartCount] = useState(0);
  const [isHearted, setIsHearted] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isBlockedListVisible, setIsBlockedListVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const { t } = useTranslation()
  const [screenCategory, setScreenCategory] = useState("");

  const nameInputRef = useRef(null);
  const surnameInputRef = useRef(null);

  const handleLongPress = () => {
    setIsElementsVisible(false);
  };

  const handlePressOut = () => {
    setIsElementsVisible(true);
  };

  useEffect(() => {
    fetchUserData({setBlockedUsers, setUserData});
  }, []);

  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    console.log(`Tamaño de la pantalla - Ancho: ${width}, Alto: ${height}`);
  }, []);

   useEffect(() => {
    const { width, height } = Dimensions.get("window");

    if (width === 411 && height === 835) {
      setScreenCategory("small");
    } else if (width === 430 && height === 932) {
      setScreenCategory("large");
    } else {
      setScreenCategory("default");
    }
  }, []);

  

  useEffect(() => {
    checkLikeStatus({setIsHearted});
    fetchFriendCount({setFriendCount});
    setFetchUserData({
        setName, 
        setSurname, 
        setIsPrivate, 
        setPhotoUrls, 
        setUsername, 
        setFriendCount, 
        setFirstHobby, 
        setSecondHobby, 
        setRelationshipStatus, 
        setFirstInterest, 
        setSecondInterest
    });
    fetchHeartCount({setHeartCount});
}, [auth.currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % photoUrls.filter((url) => url).length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [photoUrls]);

  const validateInput = (input) => {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑçÇ\s]+$/.test(input);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setMenuVisible(false);
  };

  const handleSaveChanges = async () => {
    if (!validateInput(name) || !validateInput(surname)) {
      Alert.alert(t("profile.error"), t("profile.nameValidationError"));
      return;
    }

    if (!name.trim() || !surname.trim()) {
      Alert.alert(t("profile.error"), t("profile.allFieldsRequired"));
      return;
    }

    const user = auth.currentUser;
    if (user) {
      setIsLoading(true);

      try {
        const updatedPhotoUrls = await Promise.all(
          photoUrls.map(async (url, index) => {
            try {
              if (url.startsWith("file://")) {
                const imageRef = ref(
                  storage,
                  `profileImages/${user.uid}_${index}.jpg`
                );
                const response = await fetch(url);
                const blob = await response.blob();
                await uploadBytes(imageRef, blob);
                return await getDownloadURL(imageRef);
              }
              return url;
            } catch (error) {
              console.error("Error al cargar la imagen:", error);
              throw error; // Propaga el error para que el catch principal lo capture
            }
          })
        );

        const updatedData = {
          firstName: name,
          lastName: surname,
          photoUrls: updatedPhotoUrls,
          firstHobby,
          secondHobby,
          relationshipStatus,
          firstInterest,
          secondInterest,
        };

        await updateDoc(doc(database, "users", user.uid), updatedData);
        setPhotoUrls(updatedPhotoUrls);
        setIsEditing(false);
      } catch (error) {
        console.error("Error guardando los datos:", error);
        Alert.alert(t("profile.error"), t("profile.saveChangesError"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderSaveButton = () => {
    return (
        <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveChanges}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <Text style={styles.saveButtonText}>
                    {t("profile.saveChanges")}
                </Text>
            )}
        </TouchableOpacity>
    );
};

  useEffect(() => {
    const fetchEvents = async () => {
      const user = auth.currentUser;
      if (user) {
        const unsubscribe = onSnapshot(
          collection(database, "users", user.uid, "events"),
          (snapshot) => {
            const eventsList = snapshot.docs.map((doc) => {
              const data = doc.data();
              let formattedDate = t("profile.noDate");

              if (data.date?.seconds) {
                formattedDate = new Date(
                  data.date.seconds * 1000
                ).toLocaleDateString(t("locale"), {
                  day: "numeric",
                  month: "short",
                });
              } else if (typeof data.date === "string") {
                formattedDate = data.date;
              }

              return {
                id: doc.id,
                ...data,
                formattedDate,
              };
            });
            setEvents(eventsList);
          },
          (error) => {
            console.error("Error fetching events: ", error);
          }
        );
        return () => unsubscribe();
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const renderPhotoEditor = () => {
    return (
        <View style={styles.photoEditorContainer}>
            {photoUrls.map((url, index) => (
                <View key={index} style={styles.photoContainer}>
                    {url ? (
                        <Image
                            source={{ uri: url }}
                            style={styles.photoThumbnail}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View style={styles.emptyPhoto} />
                    )}
                    <TouchableOpacity
                        onPress={() => pickImage(index, ImagePicker, photoUrls, setPhotoUrls)}
                        style={styles.photoButton}
                    >
                        <Text style={styles.photoButtonText}>
                            {url ? t("profile.change") : t("profile.add")}
                        </Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
};

  const handleFriendSelect = async (friend) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(database, "users", user.uid));
      const blockedUsers = userDoc.data()?.blockedUsers || [];

      if (blockedUsers.includes(friend.id)) {
        Alert.alert(t("profile.error"), t("profile.dontInteract"));
        return;
      }

      navigation.navigate("UserProfile", { selectedUser: friend });
      setIsFriendListVisible(false);
    } catch (error) {
      console.error("Error al seleccionar amigo:", error);
    }
  };

  const renderEditableOval = (value, setValue, placeholder) => {
    if (isEditing) {
        return (
            <TextInput
                style={[styles.oval, styles.ovalInput]}
                value={value}
                onChangeText={setValue}
                placeholder={placeholder}
                maxLength={12}
            />
        );
    }
    return (
        <View style={styles.oval}>
            <Text style={styles.ovalText}>{value}</Text>
        </View>
    );
};

  return (
    <Provider>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{flex: 1}}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollViewContent,
            {flexGrow: 1}
          ]}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.container}>
          {isElementsVisible && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={27}
                color="white"
                style={styles.iconShadow}
              />
            </TouchableOpacity>
          )}

          {isElementsVisible && (
            <MenuSection
              menuVisible={menuVisible}
              setMenuVisible={setMenuVisible}
              handleEditProfile={handleEditProfile}
              handleTogglePrivacy={() => handleTogglePrivacy({isPrivate, setIsPrivate, t})}
              isPrivate={isPrivate}
              t={t}
              blockedUsers={blockedUsers}
              setIsBlockedListVisible={setIsBlockedListVisible}
            />
          )}

          {/* FlatList en lugar de ScrollView */}
          <FlatList
            data={photoUrls.filter((url) => url)} // Filtra URLs válidas
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const contentOffset = event.nativeEvent.contentOffset;
              const viewSize = event.nativeEvent.layoutMeasurement;
              setCurrentImageIndex(Math.floor(contentOffset.x / viewSize.width));
            }}
            keyExtractor={(item, index) => `photo-${index}`}
            renderItem={({ item, index }) => (
              <Pressable
                style={styles.imageContainer}
                onLongPress={handleLongPress}
                onPressOut={handlePressOut}
              >
                <Image
                  source={{ uri: item }}
                  style={styles.backgroundImage}
                  contentFit="cover"
                 cachePolicy="memory-disk"
                  placeholder={{ uri: "placeholder-image-url" }} // Placeholder
                />
                {isElementsVisible && (
                  <View style={styles.overlay}>
                    <NameDisplay
                      name={name}
                      surname={surname}
                      friendCount={friendCount}
                      isEditing={isEditing}
                      setName={setName}
                      setSurname={setSurname}
                      nameInputRef={nameInputRef}
                      surnameInputRef={surnameInputRef}
                      handleFriendCountClick={() => setIsFriendListVisible(true)}
                      displayFriendCount={index === 0}
                    />
                    {index === 0 && !isEditing && (
                      <EventsSection
                        events={events.slice(0, 4)}
                        handleBoxPress={(event) => handleBoxPress({ event, navigation, t })} // Pass event correctly
                        t={t}
                      />
                    )}
                    {index === 0 && isEditing && (
                      <>
                        {renderPhotoEditor()}
                        {renderSaveButton()}
                      </>
                    )}
                    {index === 1 && (
                      <EventsSection
                        events={events.slice(4, 6)}
                        handleBoxPress={(event) => handleBoxPress({ event, navigation, t })} // Pass event correctly
                        t={t}
                      />
                    )}
                    {index === 2 && (
                      <>
                        <View style={styles.contentWrapper}>
                          <View style={styles.ovalAndIconsContainer}>
                            <View style={styles.ovalWrapper}>
                              <View style={styles.ovalContainer}>
                                {renderEditableOval(
                                  firstHobby,
                                  setFirstHobby,
                                  t("profile.hobby1")
                                )}
                                {renderEditableOval(
                                  secondHobby,
                                  setSecondHobby,
                                  t("profile.hobby2")
                                )}
                              </View>

                              <View style={styles.ovalContainer}>
                                {renderEditableOval(
                                  firstInterest,
                                  setFirstInterest,
                                  t("profile.interest1")
                                )}
                                {renderEditableOval(
                                  secondInterest,
                                  setSecondInterest,
                                  t("profile.interest2")
                                )}
                              </View>
                            </View>

                            <View style={styles.iconsContainer}>
                            <TouchableOpacity style={styles.iconButton}>
                                <AntDesign
                                  name="adduser"
                                  size={27}
                                  color="white"
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => handleHeartPress({isHearted, heartCount, setIsHearted, setHeartCount})}
                              >
                                <AntDesign
                                  name={isHearted ? "heart" : "hearto"}
                                  size={27}
                                  color="white"
                                />
                                <Text style={styles.heartCountText}>
                                  {heartCount}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.iconButton}>
                                <AntDesign
                                  name="message1"
                                  size={27}
                                  color="white"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                        {isEditing && renderSaveButton()}
                      </>
                    )}
                  </View>
                )}
              </Pressable>
            )}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <FriendListModal
        isVisible={isFriendListVisible}
        onClose={() => setIsFriendListVisible(false)}
        userId={auth.currentUser.uid}
        onFriendSelect={handleFriendSelect}
        updateFriendCount={(count) => setFriendCount(count)}
      />

      <BlockedListModal
        isVisible={isBlockedListVisible}
        onClose={() => setIsBlockedListVisible(false)}
        blockedUsers={blockedUsers}
      />

    </Provider>
  );
}
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { auth, database, storage } from "../config/firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  addDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { Provider } from "react-native-paper";
import FriendListModal from "../Components/Modals/FriendListModal";
import { useTranslation } from "react-i18next";
import BlockedListModal from "../Components/BlockedUsers/BlockedUsers";
import MenuSection from "./ProfileComponents/MenuSection";
import EventsSection from "./ProfileComponents/EventsSection";
import { FlatList } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

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
  const { t } = useTranslation();
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

  const nameInputRef = useRef(null);
  const surnameInputRef = useRef(null);

  const handleLongPress = () => {
    setIsElementsVisible(false);
  };

  const handlePressOut = () => {
    setIsElementsVisible(true);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
  
        const userDoc = await getDoc(doc(database, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
  
          // Otros estados relevantes
          setBlockedUsers(data.blockedUsers || []); // Asegúrate de que blockedUsers se actualice
          setUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
  
    fetchUserData();
  }, []);


  const handleTogglePrivacy = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const newPrivacyState = !isPrivate;
        await updateDoc(doc(database, "users", user.uid), {
          isPrivate: newPrivacyState,
        });
        setIsPrivate(newPrivacyState);
        Alert.alert(
          t("profile.privacyChangeSuccess"),
          t("profile.privacyChangeMessage", {
            state: newPrivacyState ? t("profile.private") : t("profile.public"),
          })
        );
      } catch (error) {
        console.error("Error updating privacy state:", error);
        Alert.alert(t("profile.error"), t("profile.privacyUpdateError"));
      }
    }
  };
/*
  const handleFriendCountClick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(database, "users", user.uid));
      const blockedUsers = userDoc.data()?.blockedUsers || [];

      const friendsSnapshot = await getDocs(
        collection(database, "users", user.uid, "friends")
      );

      const filteredFriends = friendsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((friend) => !blockedUsers.includes(friend.friendId));

      navigation.navigate("FriendList", { friends: filteredFriends });
      setIsFriendListVisible(true);
    } catch (error) {
      console.error("Error al cargar la lista de amigos:", error);
    }
  };
*/
  const handleHeartPress = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Actualización optimista del estado local
    const newIsHearted = !isHearted;
    const newHeartCount = isHearted ? heartCount - 1 : heartCount + 1;
    setIsHearted(newIsHearted);
    setHeartCount(newHeartCount);

    try {
      const likesRef = collection(database, "users", user.uid, "likes");
      const likeQuery = query(likesRef, where("userId", "==", user.uid));
      const likeSnapshot = await getDocs(likeQuery);

      const batch = writeBatch(database);

      if (likeSnapshot.empty) {
        // Añadir un nuevo "like"
        const userDoc = await getDoc(doc(database, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const profileImage =
            userData.photoUrls && userData.photoUrls.length > 0
              ? userData.photoUrls[0]
              : "https://via.placeholder.com/150";

          // Añadir "like" al usuario
          const newLikeRef = doc(collection(database, "users", user.uid, "likes"));
          batch.set(newLikeRef, {
            userId: user.uid,
            username: userData.username || "Usuario",
            profileImage,
            likedAt: serverTimestamp(),
          });

          // Actualizar contador de "likes"
          const userRef = doc(database, "users", user.uid);
          batch.update(userRef, {
            likeCount: newHeartCount,
          });
        }
      } else {
        // Eliminar "like" existente
        const likeDoc = likeSnapshot.docs[0];

        // Eliminar el "like"
        batch.delete(doc(database, "users", user.uid, "likes", likeDoc.id));

        // Actualizar contador de "likes"
        const userRef = doc(database, "users", user.uid);
        batch.update(userRef, {
          likeCount: newHeartCount,
        });
      }

      await batch.commit();
    } catch (error) {
      console.error("Error handling heart press:", error);

      // Revertir el estado local si ocurre un error
      setIsHearted(!newIsHearted);
      setHeartCount(isHearted ? heartCount + 1 : heartCount - 1);

      Alert.alert("Error", "Ocurrió un error al procesar tu acción. Intenta de nuevo.");
    }
  };

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const likesRef = collection(database, "users", user.uid, "likes");
          const likeQuery = query(likesRef, where("userId", "==", user.uid));
          const likeSnapshot = await getDocs(likeQuery);

          if (!likeSnapshot.empty) {
            setIsHearted(true);
          } else {
            setIsHearted(false);
          }
        }
      } catch (error) {
        console.error("Error verificando el estado del like:", error);
      }
    };

    checkLikeStatus();
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchFriendCount = async () => {
      console.log("fetchFriendCount running");
      try {
        const user = auth.currentUser;
        if (user) {
          const friendsSnapshot = await getDocs(
            collection(database, "users", user.uid, "friends")
          );
          console.log("Number of friends:", friendsSnapshot.size);
          setFriendCount(friendsSnapshot.size);
        } else {
          console.log("No user is currently signed in");
        }
      } catch (error) {
        console.error("Error fetching friend count:", error);
      }
    };

    fetchFriendCount();
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(database, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.firstName || "");
          setSurname(data.lastName || "");
          setIsPrivate(data.isPrivate || false);
          if (data.photoUrls && data.photoUrls.length > 0) {
            setPhotoUrls(data.photoUrls);
          }
          if (data.username) setUsername(data.username);
          const friendsSnapshot = await getDocs(
            collection(database, "users", user.uid, "friends")
          );
          setFriendCount(friendsSnapshot.size);
          setFirstHobby(data.firstHobby || "");
          setSecondHobby(data.secondHobby || "");
          setRelationshipStatus(data.relationshipStatus || "");
          setFirstInterest(data.firstInterest || "");
          setSecondInterest(data.secondInterest || "");
        }
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchHeartCount = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const likesRef = collection(database, "users", user.uid, "likes");
          const likeSnapshot = await getDocs(likesRef);
          setHeartCount(likeSnapshot.size);
        }
      } catch (error) {
        console.error("Error obteniendo la cantidad de likes:", error);
      }
    };

    fetchHeartCount();
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
    return /^[a-zA-Z]+$/.test(input);
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
        Alert.alert(
          "Error",
          "Ocurrió un problema al guardar los cambios. Intenta nuevamente."
        );
      } finally {
        setIsLoading(false);
      }
    }
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

  const checkAndRemoveExpiredEvents = (eventsList) => {
    const currentDate = new Date();
    const user = auth.currentUser;
    const filteredEvents = eventsList.filter((event) => {
      const eventDate = parseEventDate(event.date);
      const timeDifference = currentDate - eventDate;
      const hoursPassed = timeDifference / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        deleteDoc(doc(database, "users", user.uid, "events", event.id))
          .then(() => console.log(`Event ${event.id} removed successfully`))
          .catch((error) =>
            console.error(`Error removing event ${event.id}:`, error)
          );
        return false;
      }
      return true;
    });

    return filteredEvents;
  };

  const parseEventDate = (dateString) => {
    let dateToParse;

    if (typeof dateString === "string") {
      dateToParse = dateString;
    } else if (dateString?.toDate) {
      dateToParse = dateString.toDate().toLocaleDateString(t("locale"), {
        day: "numeric",
        month: "short",
      });
    } else {
      console.error("Invalid date format:", dateString);
      return new Date();
    }

    const [day, month] = dateToParse.split(" ");
    const currentYear = new Date().getFullYear();
    const monthIndex = t("months", { returnObjects: true }).indexOf(
      month.toLowerCase()
    );

    return new Date(currentYear, monthIndex, parseInt(day));
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleAddEvent = async (event) => {
    const user = auth.currentUser;
    if (user) {
      const eventsRef = collection(database, "users", user.uid, "events");
      const eventsSnapshot = await getDocs(eventsRef);

      const eventCount = eventsSnapshot.size;

      if (eventCount >= 6) {
        Alert.alert(t("profile.limitReached"), t("profile.eventLimitMessage"));
        return;
      }

      try {
        await addDoc(eventsRef, {
          title: event.title,
          date: event.date,
          imageUrl: event.imageUrl,
        });
        setEvents([...events, event]);
        Alert.alert(t("profile.eventSaved"), t("profile.eventSavedMessage"));
      } catch (error) {
        console.error("Error adding event: ", error);
        Alert.alert(t("profile.error"), t("profile.eventAddError"));
      }
    }
  };

  const pickImage = async (index) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Se necesita acceso a la galería para subir fotos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const newPhotoUrls = [...photoUrls];
      newPhotoUrls[index] = result.assets[0].uri;
      setPhotoUrls(newPhotoUrls);
      console.log("Nueva URL de imagen:", result.assets[0].uri); // Agregar log para revisar el URI
    }
  };

  const handleBoxPress = (event) => {
    const coordinates = event.coordinates || { latitude: 0, longitude: 0 };
    navigation.navigate("BoxDetails", {
      box: {
        title: event.title || t("profile.noTitle"),
        imageUrl: event.imageUrl || "https://via.placeholder.com/150",
        dateArray: event.dateArray || [],
        hours: event.hours || {},
        phoneNumber: event.phoneNumber || t("profile.noNumber"), // Asegura que se pase phoneNumber
        locationLink: event.locationLink || t("profile.noLocation"),
        coordinates: coordinates,
      },
      selectedDate: event.date || t("profile.noDate"),
    });
  };

  const renderEditableField = (
    field,
    value,
    setValue,
    placeholder,
    inputRef
  ) => {
    if (isEditing) {
      return (
        <View style={styles.editableFieldContainer}>
          <Text style={styles.fieldLabel}>{placeholder}</Text>
          <TextInput
            ref={inputRef}
            style={styles.editableText}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
          />
        </View>
      );
    }
    return <Text style={styles.text}>{value || placeholder}</Text>;
  };

  const renderPhotoEditor = () => {
    return (
      <View style={styles.photoEditorContainer}>
        {photoUrls.map((url, index) => (
          <View key={index} style={styles.photoContainer}>
            {url ? (
              <Image
                source={{ uri: url }}
                style={styles.photoThumbnail}
                cachePolicy="none"
              />
            ) : (
              <View style={styles.emptyPhoto} />
            )}
            <TouchableOpacity
              onPress={() => pickImage(index)}
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
        Alert.alert("Error", "No puedes interactuar con este usuario.");
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

  const renderEvents = (start, end) => (
    <View style={styles.buttonContainer}>
      {events.slice(start, end).map((event) => (
        <TouchableOpacity
          key={event.id}
          style={styles.button}
          onPress={() => handleBoxPress(event)}
        >
          <Text style={styles.buttonText}>
            {event.title.length > 9
              ? event.title.substring(0, 5) + "..."
              : event.title}{" "}
            {event.category === "EventoParaAmigos"
              ? event.date
              : event.formattedDate || t("profile.noDate")}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          {isElementsVisible && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isNightMode ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          )}

          {isElementsVisible && (
            <MenuSection
              menuVisible={menuVisible}
              setMenuVisible={setMenuVisible}
              handleEditProfile={handleEditProfile}
              handleTogglePrivacy={handleTogglePrivacy}
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
                  cachePolicy="none"
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
                        handleBoxPress={handleBoxPress}
                        t={t}
                      />
                    )}
                    {index === 0 && isEditing && (
                      <>
                        {renderPhotoEditor()}
                        <TouchableOpacity
                          style={styles.saveButton}
                          onPress={handleSaveChanges}
                        >
                          <Text style={styles.saveButtonText}>
                            {t("profile.saveChanges")}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {index === 1 && (
                      <EventsSection
                        events={events.slice(4, 6)}
                        handleBoxPress={handleBoxPress}
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
                                  size={24}
                                  color="white"
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.iconButton}
                                onPress={handleHeartPress}
                              >
                                <AntDesign
                                  name={isHearted ? "heart" : "hearto"}
                                  size={24}
                                  color="white"
                                />
                                <Text style={styles.heartCountText}>
                                  {heartCount}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.iconButton}>
                                <AntDesign
                                  name="message1"
                                  size={24}
                                  color="white"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                        {isEditing && (
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveChanges}
                          >
                            <Text style={styles.saveButtonText}>
                              {t("profile.saveChanges")}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                )}
              </Pressable>
            )}
          />
        </View>
      </ScrollView>

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

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  imageContainer: {
    width: width,
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
  nameContainerEditing: {
    top: "70%", // Centra verticalmente
    left: "50%", // Centra horizontalmente
    transform: [{ translateX: -width * 0.25 }, { translateY: -height * 0.25 }], // Ajuste para centrar completamente
    alignItems: "center", // Centra el contenido dentro
  },
  nameAndSurnameContainer: {
    marginBottom: 10,
  },
  nameAndSurnameContainerEditing: {
    flexDirection: "row", // Muestra nombre y apellido en la misma línea
    gap: 10, // Espacio entre los campos de nombre y apellido
  },
  friendCountContainer: {
    alignItems: "flex-start",
  },
  text: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
  editableText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
    paddingBottom: 5,
  },
  editableTextEditing: {
    textAlign: "center", // Alinea el texto en el centro del campo en modo edición
  },
  friendsText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  spacer: {
    height: 150,
  },
  editableFieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 10,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  menuContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  menuContent: {
    marginTop: 60, // Ajusta este valor para mover las opciones del menú hacia abajo
    borderRadius: 10,
  },
  photoEditorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  photoContainer: {
    alignItems: "center",
    marginHorizontal: 5,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  emptyPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ccc",
  },
  photoButton: {
    marginTop: 5,
    padding: 5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
  },
  photoButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  ovalContainer: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: 30,
  },
  centerOvalContainer: {
    alignItems: "center",
  },
  oval: {
    width: "48%",
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  ovalText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  ovalInput: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  contentWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ovalAndIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  ovalWrapper: {
    flex: 1,
  },
  iconsContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginLeft: 10,
    gap: 10,
  },
  iconButton: {
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  heartCountText: {
    color: "white",
    fontSize: 16,
    marginTop: 5,
    textAlign: "center",
  },
});

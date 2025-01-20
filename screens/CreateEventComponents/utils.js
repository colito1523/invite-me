import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { Alert } from "react-native";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { database, auth, storage } from "../../config/firebase";
import * as ImagePicker from "expo-image-picker";

export const fetchFriends = async (setFriends) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const friendsRef = collection(database, "users", user.uid, "friends");
      const friendsSnapshot = await getDocs(friendsRef);

      const userDocRef = doc(database, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const blockedUsers = userDocSnapshot.data()?.blockedUsers || [];

      const friendsList = friendsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((friend) => !blockedUsers.includes(friend.friendId));

      setFriends(friendsList);
    } catch (error) {
      console.error("Error al cargar los amigos:", error);
    }
  }
};

export const sendInvitationNotifications = async (
  eventData,
  eventId,
  selectedFriends
) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const userDocRef = doc(database, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const userData = userDocSnapshot.data();
      const profileImage = userData.photoUrls ? userData.photoUrls[0] : null;

      const blockedUsers = userData?.blockedUsers || [];

      for (const friendDocId of selectedFriends) {
        if (blockedUsers.includes(friendDocId)) {
          continue;
        }

        const friendDocRef = doc(
          database,
          "users",
          user.uid,
          "friends",
          friendDocId
        );
        const friendDocSnapshot = await getDoc(friendDocRef);
        const friendData = friendDocSnapshot.data();

        if (friendData && friendData.friendId) {
          const notificationRef = collection(
            database,
            "users",
            friendData.friendId,
            "notifications"
          );
          await addDoc(notificationRef, {
            fromId: user.uid,
            fromName: userData.username,
            fromImage: profileImage,
            eventTitle: eventData.title,
            eventImage: eventData.image,
            eventDate: eventData.timestamp,
            date: eventData.date,
            day: eventData.day,
            hour: eventData.hour,
            address: eventData.address,
            description: eventData.description,
            phoneNumber: eventData.phoneNumber || "No disponible",
            eventCategory: eventData.category,
            Admin: eventData.Admin, // Asegúrate de incluir el admin
            eventId: eventId,
            type: "invitation",
            status: "pending",
            timestamp: new Date(),
            seen: false,
            expirationDate: eventData.expirationDate, // Agregar expirationDate
          });
        }
      }
    } catch (error) {
      console.error("Error al enviar notificaciones:", error);
    }
  }
};

export const pickImage = async (setImage) => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
};

export const handleSubmit = async (
  title,
  day,
  hour,
  address,
  description,
  image,
  selectedFriends,
  setIsSubmitting,
  blockedUsers,
  t,
  navigation
) => {
  if (blockedUsers.includes(auth.currentUser.uid)) {
    Alert.alert(t("createEvent.error"), t("createEvent.blockedError"));
    return;
  }

  if (
    !title ||
    !day ||
    !hour ||
    !address ||
    !description ||
    !image ||
    selectedFriends.length === 0
  ) {
    Alert.alert(
      t("createEvent.requiredFields"),
      t("createEvent.fillAllFields")
    );
    return;
  }
  setIsSubmitting(true);

  const user = auth.currentUser;
  if (user) {
    try {
      const userDocRef = doc(database, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const userData = userDocSnapshot.data();

      const response = await fetch(image);
      const blob = await response.blob();
      const imageRef = ref(
        storage,
        `EventosParaAmigos/${user.uid}_${Date.now()}.jpg`
      );
      await uploadBytes(imageRef, blob);

      const imageUrl = await getDownloadURL(imageRef);

      const eventDateTime = new Date(day);
      eventDateTime.setHours(hour.getHours(), hour.getMinutes());

      const expirationDate = new Date(
        eventDateTime.getTime() + 24 * 60 * 60 * 1000
      );

      const dateText = day.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      }).split(' ').reverse().join(' ');
      

      const realFriendIds = await Promise.all(
        selectedFriends.map(async (friendDocId) => {
          const friendDocRef = doc(
            database,
            "users",
            user.uid,
            "friends",
            friendDocId
          );
          const friendDocSnapshot = await getDoc(friendDocRef);
          return friendDocSnapshot.exists()
            ? friendDocSnapshot.data().friendId
            : null;
        })
      );

      const eventData = {
        userId: user.uid,
        username: userData.username,
        title,
        category: "EventoParaAmigos",
        day: day.toLocaleDateString(),
        date: dateText,
        hour: hour.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        address,
        description,
        image: imageUrl,
        timestamp: new Date(),
        invitedFriends: realFriendIds.filter((id) => id !== null),
        expirationDate: expirationDate,
        Admin: user.uid,
      };

      const docRef = await addDoc(
        collection(database, "EventsPriv"),
        eventData
      );

      await updateDoc(docRef, { eventId: docRef.id });

      await sendInvitationNotifications(
        { ...eventData, eventId: docRef.id },
        docRef.id,
        selectedFriends
      );

      Alert.alert(t("createEvent.success"), t("createEvent.eventCreated"));
      navigation.navigate("Home", {
        screen: "Home",
        params: { selectedCategory: "all" },
      });
    } catch (error) {
      console.error("Error creating event: ", error);
      Alert.alert(t("createEvent.error"), t("createEvent.eventCreationError"));
    } finally {
      setIsSubmitting(false);
    }
  }
};

export const onChangeDate = (
  event,
  selectedDate,
  setShowDatePicker,
  setDay,
  day
) => {
  const currentDate = selectedDate || day;
  setShowDatePicker(false);
  setDay(currentDate);
};

export const onChangeTime = (
  event,
  selectedTime,
  setShowTimePicker,
  setHour,
  hour
) => {
  const currentTime = selectedTime || hour;
  setShowTimePicker(false);
  setHour(currentTime);
};

export const toggleFriendSelection = (friendId, setSelectedFriends) => {
  setSelectedFriends((prevSelected) =>
    prevSelected.includes(friendId)
      ? prevSelected.filter((id) => id !== friendId)
      : [...prevSelected, friendId]
  );
};

export const closeDateTimePicker = (setShowDatePicker, setShowTimePicker) => {
  setShowDatePicker(false);
  setShowTimePicker(false);
};

import React, { useState, useEffect } from "react";
import { TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { database } from "../../config/firebase";
import { sendFriendRequest, cancelFriendRequest } from "./utils";
import { useTranslation } from "react-i18next";
import { styles } from "./styles";

const RecommendedUserItem = ({ item, index, onUserPress, theme }) => {
  const auth = getAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        console.error(t("errorCheckingFriendRequestStatus"), error);
      }
    };

    fetchFriendRequestStatus();
  }, [item]);

  const toggleFriendRequest = async () => {
    setIsProcessing(true);
    try {
      if (status === "pending") {
        await cancelFriendRequest(item, setStatus, t);
      } else {
        await sendFriendRequest(item, setStatus);
      }
    } catch (error) {
      console.error(t("errorHandlingFriendRequest"), error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TouchableOpacity
      key={`recommendation-${item.id}-${index}`}
      style={styles.recommendationItem}
      onPress={() => onUserPress(item)}
    >
    <Image
  key={item.profileImage} // Forzar re-render cuando cambia la imagen
  source={{
    uri: item.lowQualityProfileImage || item.profileImage,
    cache: "force-cache",
  }}
  style={styles.userImage}
  contentFit="cover"
  defaultSource={require("../../assets/perfil.jpg")}
/>
      <View style={styles.textContainer}>
        <Text style={[styles.resultText, { color: theme.text }]}>
          {item.username}
        </Text>
        {item.firstName && item.lastName && (
          <Text style={[styles.fullName, { color: theme.textSecondary }]}>
            {`${item.firstName} ${item.lastName}`}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.addFriendButton, { backgroundColor: theme.buttonBackground }]}
        onPress={toggleFriendRequest}
        disabled={isProcessing || status === "accepted"}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="black" />
        ) : status === "pending" ? (
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

export default React.memo(RecommendedUserItem);

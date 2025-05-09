import React, { useState, useEffect } from "react";
import { TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { auth } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { database } from "../../config/firebase";
import { sendFriendRequest, cancelFriendRequest } from "./utils";
import { useTranslation } from "react-i18next";
import { styles } from "./styles";

const RecommendedUserItem = ({ item, index, onUserPress, theme, isNightMode }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchFriendRequestStatus = async () => {
      try {
        // Si ya son amigos, no mostrar el botón
        if (item.isFriend) {
          setStatus('accepted');
          return;
        }

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

  // Si ya son amigos, no renderizar este componente
  if (item.isFriend) {
    return null;
  }

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
        source={{
          uri: item.profileImage,
          cache: "force-cache",
        }}
        style={styles.userImageRecommender}
        contentFit="cover"
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

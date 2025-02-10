import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

const InviteFriendsModal = ({
  modalVisible,
  closeModal,
  isNightMode,
  searchText,
  handleSearch,
  filteredFriends,
  renderFriendItem,
  attendeesList,
}) => {
  const { t } = useTranslation();
  const [invitedFriends, setInvitedFriends] = useState([]);

  useEffect(() => {
    if (modalVisible) {
      // Aquí podrías cargar algo si es necesario
    }
  }, [modalVisible, attendeesList]);

  const handleInvite = (friendId) => {
    setInvitedFriends([...invitedFriends, friendId]);

    // Feedback háptico para iOS y Android
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(t("userProfile.success"), t("boxDetails.friendInvitedMessage"));
  };

  const renderFriendItemWithInvite = ({ item }) => {
    const isInvited = invitedFriends.includes(item.friendId);
    return renderFriendItem({ item, isInvited, onInvite: handleInvite });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={{ flex: 1 }}>

        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={[styles.friendsModalContent, isNightMode && styles.friendsModalContentNight]}>
            <Text style={[styles.modalTitle, isNightMode && styles.modalTitleNight]}>
              {t("boxDetails.inviteFriendsTitle")}
            </Text>
            <TextInput
              style={[styles.searchInput, isNightMode && styles.searchInputNight]}
              placeholder={t("boxDetails.searchFriendsPlaceholder")}
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={handleSearch}
            />
            <FlatList
              data={filteredFriends}
              renderItem={renderFriendItemWithInvite}
              keyExtractor={(item) => item.friendId.toString()}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InviteFriendsModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  friendsModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    width: "80%",
    maxHeight: "80%",
  },
  friendsModalContentNight: {
    backgroundColor: "#1a1a1a",
  },
  modalTitle: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalTitleNight: {
    color: "white",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    padding: 10,
    marginBottom: 10,
    color: "#333",
    fontSize: 16,
  },
  searchInputNight: {
    borderColor: "#444",
    color: "white",
    backgroundColor: "#333",
  },
});

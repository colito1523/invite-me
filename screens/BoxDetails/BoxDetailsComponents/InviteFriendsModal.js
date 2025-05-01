import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  Pressable,
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
      // Puedes realizar alguna acción al abrir el modal
    }
  }, [modalVisible, attendeesList]);

  const handleInvite = (friendId) => {
    setInvitedFriends([...invitedFriends, friendId]);

    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

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
      <View style={styles.modalOverlay}>
        {/* Overlay que cierra el modal al tocar fuera */}
        <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

        {/* Contenido del modal */}
        <View
          style={[
            styles.friendsModalContent,
            isNightMode && styles.friendsModalContentNight,
          ]}
        >
          <Text
            style={[
              styles.modalTitle,
              isNightMode && styles.modalTitleNight,
            ]}
          >
            {t("boxDetails.inviteFriendsTitle")}
          </Text>

          <TextInput
            style={[
              styles.searchInput,
              isNightMode && styles.searchInputNight,
            ]}
            placeholder={t("boxDetails.searchFriendsPlaceholder")}
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={handleSearch}
          />

          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItemWithInvite}
            keyExtractor={(item) => item.friendId.toString()}
            style={{ maxHeight: 300 }} // Limita la altura de la lista
            showsVerticalScrollIndicator={false}
          />
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
    justifyContent: "center",
    alignItems: "center",
  },
  friendsModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    width: "90%",
  },
  friendsModalContentNight: {
    backgroundColor: "#1a1a1a",
  },
  modalTitle: {
    color: "black",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalTitleNight: {
    color: "white",
  },
  searchInput: {
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: "#333",
  },
  searchInputNight: {
    borderColor: "#333",
    color: "white",
    backgroundColor: "#333",
  },
});

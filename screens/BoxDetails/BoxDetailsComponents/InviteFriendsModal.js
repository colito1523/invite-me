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
} from "react-native";
import { useTranslation } from "react-i18next";

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
    }
  }, [modalVisible, attendeesList]);

  const handleInvite = (friendId) => {
    setInvitedFriends([...invitedFriends, friendId]);
    Alert.alert(
      t("boxDetails.success"),
      t("boxDetails.friendInvitedMessage")
    );
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
      <TouchableWithoutFeedback onPress={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.friendsModalContent,
                isNightMode && styles.friendsModalContentNight,
              ]}
            >
              {/* Título del modal */}
              <Text
                style={[
                  styles.modalTitle,
                  isNightMode && styles.modalTitleNight,
                ]}
              >
                {t("boxDetails.inviteFriendsTitle")}
              </Text>

              {/* Barra de búsqueda */}
              <TextInput
                style={[
                  styles.searchInput,
                  isNightMode && styles.searchInputNight,
                ]}
                placeholder={t("boxDetails.searchFriendsPlaceholder")}
                placeholderTextColor={isNightMode ? "#888" : "#888"}
                value={searchText}
                onChangeText={handleSearch}
              />

              {/* Lista de amigos */}
              <FlatList
                data={filteredFriends}
                renderItem={renderFriendItemWithInvite}
                keyExtractor={(item) => item.friendId.toString()}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    borderColor: "black",
    color: "white",
    backgroundColor: "#333",
  },
});
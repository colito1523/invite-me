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
      // Lógica adicional si es necesaria
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

    Alert.alert(
      t("userProfile.success"),
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
      {/* 
        El primer TouchableWithoutFeedback se usa para cerrar el modal al tocar fuera,
        pero hay que tener cuidado de no interceptar los gestos de scroll dentro del contenido.
      */}
      <TouchableWithoutFeedback onPress={closeModal}>
        <View style={styles.modalOverlay}>
          {/* Evitamos que este TouchableWithoutFeedback bloquee los toques dentro */}
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.friendsModalContent,
                isNightMode && styles.friendsModalContentNight,
              ]}
            >
              {/* Título */}
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

              {/* Contenedor con altura fija para mostrar 5 items y permitir scroll */}
              <View style={styles.flatListContainer}>
                <FlatList
                  nestedScrollEnabled={true} // Habilita el scroll anidado
                  data={filteredFriends}
                  renderItem={renderFriendItemWithInvite}
                  keyExtractor={(item) => item.friendId.toString()}
                  showsVerticalScrollIndicator={true}
                />
              </View>
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
  flatListContainer: {
    // Con una altura de 250px se mostrarán aproximadamente 5 items
    height: 250,
  },
});

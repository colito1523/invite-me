import React from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Text,
  StyleSheet,
} from "react-native";
import { Entypo, Ionicons, FontAwesome } from "@expo/vector-icons";
import { auth } from "../../../config/firebase";
import { useTranslation } from 'react-i18next';

const Header = ({
  navigation,
  boxData,
  isNightMode,
  menuVisible,
  toggleMenu,
  handleEditImage,
  handleEditEvent,
  handleDeleteEvent,
  isProcessing,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.headerContainer}>
      {/* Botón Volver */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.backButtonCircle}>
          <Entypo name="chevron-left" size={24} color={"black"} />
        </View>
      </TouchableOpacity>

      {/* Menú del Administrador */}
      {boxData?.Admin === auth.currentUser?.uid && boxData.category === "EventoParaAmigos" && (
        <View style={styles.backButtonCircle}>
        <TouchableOpacity onPress={toggleMenu} >
          <Entypo name="dots-three-vertical" size={24} color={"black"} />
        </TouchableOpacity>
          </View>
      )}

      {/* Modal del Menú */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => toggleMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => toggleMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              onPress={handleEditImage}
              style={styles.editEventButton}
              disabled={isProcessing}
            >
              <Text style={styles.editEventText}>
                {isProcessing ? t('header.updating') : t('header.editImage')}
                <Ionicons name="image" size={15} color="black" />
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEditEvent}
              style={styles.editEventButton}
            >
              <Text style={styles.editEventText}>
                {t('header.editEvent')}
                <Ionicons name="pencil" size={15} color="black" />
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteEvent}
              style={styles.deleteEventButton}
            >
              <Text style={styles.deleteEventText}>
                {t('header.deleteEvent')}
                <FontAwesome name="trash" size={15} color="white" />
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 30,
    width: "100%",
    position: "absolute",
    top: 62,
    zIndex: 10,
  },
  backButton: {
    paddingLeft: 20,
  },
  backButtonCircle: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "white", // Gris
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  editEventButton: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  editEventText: {
    color: "black",
    fontWeight: "bold",
  },
  deleteEventButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
  },
  deleteEventText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default Header;

import React from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Text,
  StyleSheet,
} from "react-native";
import { Entypo, Ionicons, FontAwesome } from "@expo/vector-icons";
import { auth } from "../../config/firebase";

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
}) => (
  <View style={styles.headerContainer}>
    {/* Botón Volver */}
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
    >
      <Entypo
        name="chevron-left"
        size={24}
        color={isNightMode ? "#000" : "#000"}
      />
    </TouchableOpacity>

    {/* Menú del Administrador */}
    {boxData?.Admin === auth.currentUser?.uid && boxData.category === "EventoParaAmigos" && (
      <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
        <Entypo
          name="dots-three-vertical"
          size={24}
          color={isNightMode ? "#000" : "#000"}
        />
      </TouchableOpacity>
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
              {isProcessing ? "Actualizando..." : "Editar Imagen "}
              <Ionicons name="image" size={15} color="black" />
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEditEvent}
            style={styles.editEventButton}
          >
            <Text style={styles.editEventText}>
              Editar Evento{" "}
              <Ionicons name="pencil" size={15} color="black" />
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteEvent}
            style={styles.deleteEventButton}
          >
            <Text style={styles.deleteEventText}>
              Eliminar Evento{" "}
              <FontAwesome name="trash" size={15} color="white" />
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  </View>
);

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    width: "100%",
    position: "absolute",
    top: 0,
    zIndex: 10,
  },
  backButton: { paddingLeft: 20 },
  menuButton: { paddingRight: 20 },
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
  editEventText: { color: "black", fontWeight: "bold" },
  deleteEventButton: { backgroundColor: "black", padding: 10, borderRadius: 5 },
  deleteEventText: { color: "white", fontWeight: "bold" },
});

export default Header;

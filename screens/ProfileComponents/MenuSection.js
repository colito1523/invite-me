import React from "react";
import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Menu } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, deleteUser } from "firebase/auth";

const MenuSection = ({
  menuVisible,
  setMenuVisible,
  handleEditProfile,
  handleTogglePrivacy,
  isPrivate,
  t,
  blockedUsers,
  setIsBlockedListVisible,
}) => {
  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const auth = getAuth();
              const user = auth.currentUser;

              if (user) {
                await deleteUser(user);
                Alert.alert("Cuenta eliminada", "Tu cuenta ha sido eliminada exitosamente.");
              } else {
                Alert.alert("Error", "No se encontró un usuario autenticado.");
              }
            } catch (error) {
              if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                  "Error",
                  "Debes iniciar sesión nuevamente para eliminar tu cuenta."
                );
              } else {
                Alert.alert("Error", "No se pudo eliminar tu cuenta. Intenta nuevamente.");
              }
            }
          },
        },
      ]
    );
  };
  return (
    <View style={styles.menuContainer}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <Menu.Item onPress={handleEditProfile} title={t("profile.editProfile")} />
        <Menu.Item
          onPress={() => setIsBlockedListVisible(true)}
          title="Usuarios bloqueados"
          disabled={blockedUsers.length === 0}
        />
        <Menu.Item
          onPress={handleTogglePrivacy}
          title={isPrivate ? t("profile.makePublic") : t("profile.makePrivate")}
        />
        <Menu.Item
          onPress={handleDeleteAccount}
          title="Eliminar cuenta"
          titleStyle={{ color: "red" }}
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default MenuSection;
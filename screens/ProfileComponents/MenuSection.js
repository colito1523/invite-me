import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Menu } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

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

import React from "react";
import { View, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { Menu } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, deleteUser } from "firebase/auth";
import { useTranslation } from "react-i18next";

const MenuSection = ({
  menuVisible,
  setMenuVisible,
  handleEditProfile,
  handleTogglePrivacy,
  isPrivate,
  blockedUsers,
  setIsBlockedListVisible,
}) => {
  const { t } = useTranslation();

  const handleDeleteAccount = () => {
    Alert.alert(
      t("profileMenuSections.deleteAccount"),
      t("profileMenuSections.deleteAccountQuestions"),
      [
        {
          text: t("chatUsers.cancel"),
          style: "cancel",
        },
        {
          text: t("chatUsers.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              const auth = getAuth();
              const user = auth.currentUser;

              if (user) {
                await deleteUser(user);
                Alert.alert(t("profileMenuSections.success"), t("profileMenuSections.accountDeleted"));
              } else {
                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.noAuthenticatedUser"));
              }
            } catch (error) {
              if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                  t("profileMenuSections.error"),
                  t("profileMenuSections.recentLoginRequired")
                );
              } else {
                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.deleteAccountError"));
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
            <Ionicons name="ellipsis-vertical" size={27} color="white" />
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <Menu.Item onPress={handleEditProfile} title={t("profile.editProfile")} />
        <Menu.Item
          onPress={() => setIsBlockedListVisible(true)}
          title={t("blockedUsers.modalTitle")}
          disabled={blockedUsers.length === 0}
        />
        <Menu.Item
          onPress={handleTogglePrivacy}
          title={isPrivate ? t("profile.makePublic") : t("profile.makePrivate")}
        />
        <Menu.Item
          onPress={handleDeleteAccount}
          title={t("profileMenuSections.deleteAccount")}
          titleStyle={{ color: "red" }}
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 80 : 40,
    right: 20,
    zIndex: 10,
  },
  menuContent: {
    marginTop: 60, // Ajusta este valor para mover las opciones del menú hacia abajo
    borderRadius: 10,
  },
});

export default MenuSection;
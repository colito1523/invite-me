import React from "react";
import { View, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { Menu } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { database } from "../../config/firebase";
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
          onPress: () => {
            Alert.prompt(
              t("profileMenuSections.confirmEmail"),
              t("profileMenuSections.enterEmail"),
              [
                {
                  text: t("chatUsers.cancel"),
                  style: "cancel",
                },
                {
                  text: t("profileMenuSections.continue"),
                  style: "default",
                  onPress: (email) => {
                    if (!email) {
                      Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.emailRequired"));
                      return;
                    }
  
                    Alert.prompt(
                      t("profileMenuSections.confirmPassword"),
                      t("profileMenuSections.enterPassword"),
                      [
                        {
                          text: t("chatUsers.cancel"),
                          style: "cancel",
                        },
                        {
                          text: t("chatUsers.delete"),
                          style: "destructive",
                          onPress: async (password) => {
                            if (!password) {
                              Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.passwordRequired"));
                              return;
                            }
  
                            try {
                              const auth = getAuth();
                              const user = auth.currentUser;
                              const credential = EmailAuthProvider.credential(email, password);
  
                              // Reautenticar usuario
                              await reauthenticateWithCredential(user, credential);
  
                              // Eliminar datos de Firestore
                              await deleteDoc(doc(database, "users", user.uid));
  
                              // Eliminar usuario de la autenticación
                              await deleteUser(user);
  
                              Alert.alert(
                                t("profileMenuSections.success"),
                                t("profileMenuSections.accountDeleted"),
                                [
                                  {
                                    text: t("chatUsers.ok"),
                                    onPress: () => {
                                      navigation.reset({
                                        index: 0,
                                        routes: [{ name: "Login" }], // Redirige al login después de eliminar la cuenta
                                      });
                                    },
                                  },
                                ]
                              );
                            } catch (error) {
                              if (error.code === "auth/wrong-password" || error.code === "auth/user-mismatch") {
                                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.invalidCredentials"));
                              } else {
                                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.deleteAccountError"));
                              }
                            }
                          },
                        },
                      ],
                      "secure-text"
                    );
                  },
                },
              ],
              "plain-text"
            );
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
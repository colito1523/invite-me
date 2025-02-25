import React, { useCallback } from "react";
import { View, TouchableOpacity, StyleSheet, Alert, Platform, Modal, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../config/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const MenuSection = React.memo(({
  menuVisible,
  setMenuVisible,
  handleEditProfile,
  handleTogglePrivacy,
  isPrivate,
  blockedUsers,
  setIsBlockedListVisible,
}) => {
  const { t } = useTranslation();

  const closeMenu = useCallback(() => setMenuVisible(false), [setMenuVisible]);

  const handleDeleteAccount = useCallback(() => {
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
                      Alert.alert(
                        t("profileMenuSections.error"),
                        t("profileMenuSections.emailRequired"),
                      );
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
                              Alert.alert(
                                t("profileMenuSections.error"),
                                t("profileMenuSections.passwordRequired"),
                              );
                              return;
                            }
  
                            try {
                              const auth = getAuth();
                              const user = auth.currentUser;
                              const credential = EmailAuthProvider.credential(
                                email,
                                password,
                              );
  
                              await reauthenticateWithCredential(user, credential);
                              await deleteDoc(doc(database, "users", user.uid));
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
                                        routes: [{ name: "Login" }],
                                      });
                                    },
                                  },
                                ],
                              );
                            } catch (error) {
                              if (
                                error.code === "auth/wrong-password" ||
                                error.code === "auth/user-mismatch"
                              ) {
                                Alert.alert(
                                  t("profileMenuSections.error"),
                                  t("profileMenuSections.invalidCredentials"),
                                );
                              } else {
                                Alert.alert(
                                  t("profileMenuSections.error"),
                                  t("profileMenuSections.deleteAccountError"),
                                );
                              }
                            }
                          },
                        },
                      ],
                      "secure-text",
                    );
                  },
                },
              ],
              "plain-text",
            );
          },
        },
      ],
    );
  }, [t]);

  const handleChangePasswordAlert = () => {
    Alert.prompt(
      t("profileMenuSections.currentPasswordTitle"),
      t("profileMenuSections.currentPasswordMessage"),
      [
        {
          text: t("chatUsers.cancel"),
          style: "cancel",
        },
        {
          text: t("profileMenuSections.continue"),
          onPress: async (currentPassword) => {
            if (!currentPassword) {
              Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.passwordRequired"));
              return;
            }
  
            const user = auth.currentUser;
  
            if (!user || !user.email) {
              Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.userNotFound"));
              return;
            }
  
            try {
              const trimmedPassword = currentPassword.trim();
              const credential = EmailAuthProvider.credential(user.email, trimmedPassword);
              await reauthenticateWithCredential(user, credential);
  
              Alert.prompt(
                t("profileMenuSections.newPasswordTitle"),
                t("profileMenuSections.newPasswordMessage"),
                [
                  {
                    text: t("chatUsers.cancel"),
                    style: "cancel",
                  },
                  {
                    text: t("profileMenuSections.continue"),
                    onPress: (newPassword) => {
                      if (!newPassword) {
                        Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.newPasswordRequired"));
                        return;
                      }
  
                      // Validación de la nueva contraseña
                      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
                      if (!passwordRegex.test(newPassword)) {
                        Alert.alert(
                          t("profileMenuSections.error"),
                          t("profileMenuSections.invalidPassword") // Mensaje de error traducido
                        );
                        return;
                      }
  
                      Alert.prompt(
                        t("profileMenuSections.confirmPasswordTitle"),
                        t("profileMenuSections.confirmPasswordMessage"),
                        [
                          {
                            text: t("chatUsers.cancel"),
                            style: "cancel",
                          },
                          {
                            text: t("profileMenuSections.accept"),
                            onPress: async (confirmPassword) => {
                              if (!confirmPassword) {
                                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.confirmPasswordRequired"));
                                return;
                              }
                              if (newPassword !== confirmPassword) {
                                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.passwordMismatch"));
                                return;
                              }
                              try {
                                await updatePassword(user, newPassword);
                                Alert.alert(t("profileMenuSections.success"), t("profileMenuSections.passwordChanged"));
                              } catch (error) {
                                console.error("Error al cambiar la contraseña:", error);
                                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.passwordChangeFailed"));
                              }
                            },
                          },
                        ],
                        "secure-text"
                      );
                    },
                  },
                ],
                "secure-text"
              );
            } catch (error) {
              if (error.code === "auth/wrong-password") {
                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.invalidCurrentPassword"));
              } else {
                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.passwordVerificationFailed"));
              }
            }
          },
        },
      ],
      "secure-text"
    );
  };

  return (
    <View style={styles.menuContainer}>
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-vertical" size={Math.min(width, height) * 0.06} color="white" />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleEditProfile();
                closeMenu();
              }}
            >
              <Text style={styles.menuItemText}>{t("profile.editProfile")}</Text>
            </TouchableOpacity>

            {blockedUsers.length > 0 && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsBlockedListVisible(true);
                  closeMenu();
                }}
              >
                <Text style={styles.menuItemText}>{t("blockedUsers.modalTitle")}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleTogglePrivacy();
                closeMenu();
              }}
            >
              <Text style={styles.menuItemText}>
                {isPrivate ? t("profile.makePublic") : t("profile.makePrivate")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={() => {
                handleDeleteAccount();
                closeMenu();
              }}
            >
              <Text style={styles.deleteMenuItemText}>{t("profileMenuSections.deleteAccount")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
  style={styles.menuItem}
  onPress={() => {
    handleChangePasswordAlert();
    closeMenu();
  }}
>
  <Text style={styles.menuItemText}>{t("profileMenuSections.changePassword")}</Text>
</TouchableOpacity>


          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  menuContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? height * 0.1 : height * 0.05, // top responsivo: 10% para iOS, 5% para Android
    right: width * 0.05, // 5% del ancho desde la derecha
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: Math.min(width, height) * 0.03, // radio de borde del 3% de la dimensión menor
    padding: width * 0.05, // padding del 5% del ancho
    width: "60%",
    alignItems: "center",
  },
  menuItem: {
    paddingVertical: height * 0.02, // padding vertical del 2% de la altura
    width: "100%",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: Math.min(width, height) * 0.04, // tamaño de fuente relativo
    color: "#333",
    textAlign: "center",
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  deleteMenuItemText: {
    fontSize: Math.min(width, height) * 0.04,
    color: "red",
    textAlign: "center",
  },
});

export default MenuSection;

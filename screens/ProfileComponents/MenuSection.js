import React, { useCallback, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Alert, Platform, Modal, Text, Dimensions, ActivityIndicator, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../config/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, getAuth, deleteUser } from "firebase/auth";
import { getFirestore, deleteDoc, doc, collection, getDocs, writeBatch } from "firebase/firestore";
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
  navigation,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [step, setStep] = useState(1);


  const closeMenu = useCallback(() => setMenuVisible(false), [setMenuVisible]);

  const handleDeleteAccount = useCallback(async () => {
    console.log("Iniciando eliminación de cuenta...");

    Alert.alert(
      t("profileMenuSections.deleteAccount"),
      t("profileMenuSections.deleteAccountQuestions"),
      [
        {
          text: t("chatUsers.cancel"),
          style: "cancel",
        },
        {
          text: t("profileMenuSections.continue"),
          style: "destructive",
          onPress: () => {
            console.log("Usuario confirmó eliminación.");

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

                    console.log("Email ingresado:", email);

                    Alert.prompt(
                      t("profileMenuSections.confirmPassword"),
                      t("profileMenuSections.enterPassword"),
                      [
                        {
                          text: t("chatUsers.cancel"),
                          style: "cancel",
                        },
                        {
                          text: t("profileMenuSections.continue"),
                          style: "destructive",
                          onPress: async (password) => {
                            if (!password) {
                              Alert.alert(
                                t("profileMenuSections.error"),
                                t("profileMenuSections.passwordRequired"),
                              );
                              return;
                            }

                            console.log("Contraseña ingresada:", password);
                            setLoading(true); // Mostrar indicador de carga

                            try {
                              const auth = getAuth();
                              const database = getFirestore();
                              const user = auth.currentUser;

                              if (!user) {
                                console.log("Error: No hay usuario autenticado.");
                                Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.userNotFound"));
                                setLoading(false);
                                return;
                              }

                              console.log("Usuario autenticado:", user.uid);

                              const credential = EmailAuthProvider.credential(email, password);
                              console.log("Reautenticando usuario...");

                              await reauthenticateWithCredential(user, credential);
                              console.log("Reautenticación exitosa.");

                              console.log("Eliminando usuario de Firestore...");
                              await deleteDoc(doc(database, "users", user.uid));
                              console.log("Documento eliminado de Firestore.");

                              const batch = writeBatch(database);
                              const promises = [];

                              const usersSnapshot = await getDocs(collection(database, "users"));
                              usersSnapshot.forEach((userDoc) => {
                                const friendsCollection = collection(userDoc.ref, "friends");
                                const friendRequestsCollection = collection(userDoc.ref, "friendRequests");
                                const notificationsCollection = collection(userDoc.ref, "notifications");
                                const likesCollection = collection(userDoc.ref, "likes");
                                const storiesCollection = collection(userDoc.ref, "stories");

                                promises.push(
                                  getDocs(friendsCollection).then((friendsSnapshot) => {
                                    friendsSnapshot.forEach((friendDoc) => {
                                      const friendData = friendDoc.data();
                                      if (friendData.friendId === user.uid) {
                                        batch.delete(friendDoc.ref);
                                      }
                                    });
                                  }),

                                  getDocs(friendRequestsCollection).then((friendRequestsSnapshot) => {
                                    friendRequestsSnapshot.forEach((requestDoc) => {
                                      const requestData = requestDoc.data();
                                      if (requestData.fromId === user.uid) {
                                        batch.delete(requestDoc.ref);
                                      }
                                    });
                                  }),

                                  getDocs(notificationsCollection).then((notificationsSnapshot) => {
                                    notificationsSnapshot.forEach((notificationDoc) => {
                                      const notificationData = notificationDoc.data();
                                      if (notificationData.fromId === user.uid) {
                                        batch.delete(notificationDoc.ref);
                                      }
                                    });
                                  }),

                                  getDocs(likesCollection).then((likesSnapshot) => {
                                    likesSnapshot.forEach((likeDoc) => {
                                      const likeData = likeDoc.data();
                                      if (likeData.userId === user.uid) {
                                        batch.delete(likeDoc.ref);
                                      }
                                    });
                                  }),

                                  getDocs(storiesCollection).then((storiesSnapshot) => {
                                    storiesSnapshot.forEach((storyDoc) => {
                                      const storyData = storyDoc.data();
                                      const updatedLikes = storyData.likes.filter(like => like.uid !== user.uid);
                                      const updatedViewers = storyData.viewers.filter(viewer => viewer.uid !== user.uid);

                                      if (updatedLikes.length !== storyData.likes.length || updatedViewers.length !== storyData.viewers.length) {
                                        batch.update(storyDoc.ref, {
                                          likes: updatedLikes,
                                          viewers: updatedViewers,
                                        });
                                      }
                                    });
                                  })
                                );
                              });

                              const chatsSnapshot = await getDocs(collection(database, "chats"));
                              chatsSnapshot.forEach((chatDoc) => {
                                const chatData = chatDoc.data();
                                if (chatData.participants.includes(user.uid)) {
                                  batch.delete(chatDoc.ref);
                                }
                              });

                              await Promise.all(promises);
                              await batch.commit();

                              console.log("Usuario eliminado de la lista de amigos, solicitudes de amistad, notificaciones, likes, viewers en historias y chats de otros usuarios.");

                              console.log("Eliminando usuario de Firebase Authentication...");
                              await deleteUser(user);
                              console.log("Usuario eliminado de Firebase Authentication.");

                              Alert.alert(
                                t("profileMenuSections.success"),
                                t("profileMenuSections.accountDeleted"),
                                [
                                  {
                                    text: t("chatUsers.success"),
                                    onPress: () => {
                                      console.log("Redirigiendo a Login...");
                                      navigation.reset({
                                        index: 0,
                                        routes: [{ name: "Login" }],
                                      });
                                    },
                                  },
                                ],
                              );
                            } catch (error) {
                              console.log("Error al eliminar la cuenta:", error);
                              Alert.alert(
                                t("profileMenuSections.error"),
                                t("profileMenuSections.deleteAccountError"),
                              );
                            } finally {
                              setLoading(false); // Ocultar indicador de carga
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
  }, [t, navigation]);
  
  const handleChangePasswordAlert = () => {
    if (Platform.OS === "ios") {
      // iOS: mantener uso de Alert.prompt con flujo completo
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
                const credential = EmailAuthProvider.credential(user.email, currentPassword.trim());
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
  
                        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
                        if (!passwordRegex.test(newPassword)) {
                          Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.invalidPassword"));
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
    } else {
      // Android: iniciar flujo por etapas con modal
      setPasswordModalVisible(true);
      setStep(1); // empezamos por la etapa 1: contraseña actual
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
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
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <>
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
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {Platform.OS === "android" && (
    <Modal visible={passwordModalVisible} transparent animationType="fade">
      <View style={styles.overlayCentered}>
        <View style={styles.androidAlertModal}>
          <Text style={styles.androidAlertTitle}>
            {step === 1
              ? t("profileMenuSections.currentPasswordTitle")
              : step === 2
              ? t("profileMenuSections.newPasswordTitle")
              : t("profileMenuSections.confirmPasswordTitle")}
          </Text>
  
          {step === 1 && (
            <TextInput
              placeholder={t("profileMenuSections.currentPasswordMessage")}
              placeholderTextColor="#999"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.androidAlertInput}
            />
          )}
          {step === 2 && (
            <TextInput
              placeholder={t("profileMenuSections.newPasswordMessage")}
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.androidAlertInput}
            />
          )}
          {step === 3 && (
            <TextInput
              placeholder={t("profileMenuSections.confirmPasswordMessage")}
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.androidAlertInput}
            />
          )}
  
          <View style={styles.androidAlertButtons}>
            <TouchableOpacity
              style={styles.androidAlertButton}
              onPress={() => {
                setPasswordModalVisible(false);
                setStep(1);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              <Text style={styles.androidAlertCancelText}>{t("chatUsers.cancel")}</Text>
            </TouchableOpacity>
  
            <TouchableOpacity
              style={styles.androidAlertButton}
              onPress={async () => {
                const user = auth.currentUser;
  
                if (!user || !user.email) {
                  Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.userNotFound"));
                  return;
                }
  
                if (step === 1) {
                  if (!currentPassword) {
                    Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.passwordRequired"));
                    return;
                  }
                  try {
                    const credential = EmailAuthProvider.credential(user.email, currentPassword.trim());
                    await reauthenticateWithCredential(user, credential);
                    setStep(2);
                  } catch (error) {
                    Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.invalidCurrentPassword"));
                  }
                }
  
                if (step === 2) {
                  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
                  if (!newPassword) {
                    Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.newPasswordRequired"));
                    return;
                  }
                  if (!passwordRegex.test(newPassword)) {
                    Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.invalidPassword"));
                    return;
                  }
                  setStep(3);
                }
  
                if (step === 3) {
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
                    setPasswordModalVisible(false);
                    setStep(1);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  } catch (error) {
                    Alert.alert(t("profileMenuSections.error"), t("profileMenuSections.passwordChangeFailed"));
                  }
                }
              }}
            >
              <Text style={styles.androidAlertConfirmText}>
                {step === 3 ? t("profileMenuSections.accept") : t("profileMenuSections.continue")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )}
     

    </View>
    
  );
});

const styles = StyleSheet.create({
  menuContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? height * 0.1 : height * 0.1, // top responsivo: 10% para iOS, 5% para Android
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
  overlayCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  androidAlertModal: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  androidAlertTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
    color: "#111",
  },
  androidAlertInput: {
    borderWidth: 1,
    borderRadius:50,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 15,
    marginBottom: 15,
    color: "#000",
  },
  androidAlertButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  androidAlertButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  androidAlertCancelText: {
    fontSize: 16,
    color: "#888",
  },
  androidAlertConfirmText: {
    fontSize: 16,
    color: "black", // estilo iOS-like
    fontWeight: "600",
  },
  
});

export default MenuSection;

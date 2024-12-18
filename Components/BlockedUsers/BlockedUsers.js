import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert } from "react-native";
import { Image } from "expo-image";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { database, auth } from "../../config/firebase"; // Asegúrate de importar correctamente Firebase
import { useTranslation } from "react-i18next";

export default function BlockedListModal({ isVisible, onClose, blockedUsers }) {
  const [userDetails, setUserDetails] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const currentUser = auth.currentUser;
  
      if (!currentUser) {
        console.error(t("blockedUsers.notAuthenticatedError"));
        return;
      }
  
      try {
        // Obtener los datos del usuario actual
        const currentUserRef = doc(database, "users", currentUser.uid);
        const currentUserDoc = await getDoc(currentUserRef);
  
        if (!currentUserDoc.exists()) {
          console.error(t("blockedUsers.noUserDataError"));
          return;
        }
  
        const currentUserData = currentUserDoc.data();
  
        // Filtrar solo los usuarios bloqueados manualmente
        const manuallyBlockedUsers =
          currentUserData.manuallyBlocked || []; // Obtener manualmente bloqueados
  
        const usersData = [];
  
        for (const uid of blockedUsers) {
          if (manuallyBlockedUsers.includes(uid)) {
            try {
              const userDoc = await getDoc(doc(database, "users", uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                usersData.push({
                  uid,
                  username: data.username,
                  profileImage: data.photoUrls?.[0] || "https://via.placeholder.com/150",
                });
              }
            } catch (error) {
              console.error(`Error fetching data for UID ${uid}:`, error);
            }
          }
        }
  
        setUserDetails(usersData);
      } catch (error) {
        console.error(t("blockedUsers.noUserDataError"), error);
      }
    };
  
    if (blockedUsers && blockedUsers.length > 0) {
      fetchUserDetails();
    }
  }, [blockedUsers]);
  

  const handleUnblockUser = async (uid) => {
    const currentUser = auth.currentUser;
  
    if (!currentUser) {
      Alert.alert(t("blockedUsers.notAuthenticatedError"));
      return;
    }
  
    try {
      // Obtener los datos del usuario actual
      const currentUserRef = doc(database, "users", currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
  
      if (!currentUserDoc.exists()) {
      
        return;
      }
  
      const currentUserData = currentUserDoc.data();
  
      // Verificar si el usuario a desbloquear está en la lista de manuallyBlocked
      if (
        !currentUserData.manuallyBlocked ||
        !currentUserData.manuallyBlocked.includes(uid)
      ) {
        Alert.alert(t("blockedUsers.cannotUnblockError"));
        return;
      }
  
      const blockedUserRef = doc(database, "users", uid);
  
      // Eliminar del array de bloqueados del usuario actual
      await updateDoc(currentUserRef, {
        blockedUsers: arrayRemove(uid),
        manuallyBlocked: arrayRemove(uid),
      });
  
      // Eliminar al usuario actual del array de bloqueados del otro usuario
      await updateDoc(blockedUserRef, {
        blockedUsers: arrayRemove(currentUser.uid),
      });
  
      // Actualizar la lista localmente
      setUserDetails((prev) => prev.filter((user) => user.uid !== uid));
  
    
    } catch (error) {
      console.error(t("blockedUsers.unblockError"), error);
      Alert.alert(t("blockedUsers.unblockError"));
    }
  };
  

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("blockedUsers.modalTitle")}</Text>
          <FlatList
            data={userDetails}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <View style={styles.blockedUserItem}>
                <Image
                  source={{ uri: item.profileImage }}
                  style={styles.profileImage}
                  cachePolicy="memory-disk"
                />
                <Text style={styles.username}>
                  {item.username}
                </Text>
                <TouchableOpacity
                  style={styles.unblockButton}
                  onPress={() => handleUnblockUser(item.uid)}
                >
                  <Text style={styles.unblockButtonText}>{t("blockedUsers.unblockButtonText")}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t("blockedUsers.closeButtonText")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  blockedUserItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Asegura que el botón esté a la derecha
    marginVertical: 10,
    width: "100%",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    flex: 1, // Asegura que el texto ocupe espacio flexible
  },
  unblockButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "black",
    borderRadius: 5,
  },
  unblockButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "black",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

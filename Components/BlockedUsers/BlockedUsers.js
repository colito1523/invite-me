import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert } from "react-native";
import { Image } from "expo-image";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { database, auth } from "../../config/firebase";

export default function BlockedListModal({ isVisible, onClose, manuallyBlocked }) {
  const [userDetails, setUserDetails] = useState([]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const usersData = [];
      for (const uid of manuallyBlocked) {
        try {
          const userDoc = await getDoc(doc(database, "users", uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            usersData.push({
              uid,
              firstName: data.firstName,
              lastName: data.lastName,
              profileImage: data.photoUrls?.[0] || "https://via.placeholder.com/150",
            });
          }
        } catch (error) {
          console.error(`Error fetching data for UID ${uid}:`, error);
        }
      }
      setUserDetails(usersData);
    };

    if (manuallyBlocked && manuallyBlocked.length > 0) {
      fetchUserDetails();
    }
  }, [manuallyBlocked]);

  const handleUnblockUser = async (uid) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert("Error", "No estás autenticado.");
      return;
    }

    try {
      const currentUserRef = doc(database, "users", currentUser.uid);

      // Eliminar del array de bloqueos manuales
      await updateDoc(currentUserRef, {
        manuallyBlocked: arrayRemove(uid),
      });

      // Actualizar la lista localmente
      setUserDetails((prev) => prev.filter((user) => user.uid !== uid));

      Alert.alert("Éxito", "El usuario ha sido desbloqueado.");
    } catch (error) {
      console.error("Error al desbloquear al usuario:", error);
      Alert.alert("Error", "No se pudo desbloquear al usuario.");
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Usuarios bloqueados</Text>
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
                  {item.firstName} {item.lastName}
                </Text>
                <TouchableOpacity
                  style={styles.unblockButton}
                  onPress={() => handleUnblockUser(item.uid)}
                >
                  <Text style={styles.unblockButtonText}>Desbloquear</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
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

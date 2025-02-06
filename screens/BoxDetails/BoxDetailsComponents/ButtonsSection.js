import React, { useState } from "react";
import { View, Pressable, Text, StyleSheet, ActivityIndicator, Alert, Platform  } from "react-native";
import { auth } from "../../../config/firebase";
import * as Haptics from "expo-haptics"; // Para feedback háptico en iOS

const ButtonsSection = ({
  isEventSaved,
  isProcessing,
  handleAddEvent,
  handleRemoveFromEvent,
  setModalVisible,
  t,
  box,
  boxData,
}) => {
  const [isLoading, setIsLoading] = useState(false); // Indicador local de carga
  const showInviteButton =
  box?.category !== "EventoParaAmigos" || // Siempre mostrar para eventos generales
  (box?.category === "EventoParaAmigos" && boxData?.Admin === auth.currentUser?.uid); // Mostrar solo si el usuario es el Admin

  const handleButtonPress = async () => {
    if (isLoading) return; // Evita múltiples clics mientras está en proceso
    setIsLoading(true); // Muestra el indicador de carga
     // Agregar feedback háptico en iOS
     if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      if (isEventSaved) {
        await handleRemoveFromEvent(); // Llama a la función para "No Voy"
      } else {
        // Aquí se imprime en consola los datos que se están enviando
        await handleAddEvent(); // Llama a la función para "Voy"
      }
    } catch (error) {
      console.error("Error al cambiar el estado del evento:", error);
    } finally {
      setIsLoading(false); // Oculta el indicador de carga
    }
  };

  const handleInvitePress = () => {
    // Agregar feedback háptico en iOS
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isEventSaved) {
      setModalVisible(true);
    } else {
      // Agregar feedback háptico en iOS
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Alert.alert(
        t("boxDetails.error"),
        t("boxDetails.attendFirstMessage")
      );
    }
  };

  return (
    <View style={styles.buttonContainer}>
      {/* Botón Participar/No Participar */}
      <Pressable
        style={[styles.button, isEventSaved && styles.activeButton]}
        disabled={isProcessing || isLoading} // Desactiva el botón mientras se procesa
        onPress={handleButtonPress}
      >
        {isLoading ? (
          <ActivityIndicator color="white" /> // Indicador de carga
        ) : (
          <Text style={styles.buttonText}>
            {isEventSaved ? t("boxDetails.notGoingButton") : t("boxDetails.goingButton")}
          </Text>
        )}
      </Pressable>

      {/* Botón Invitar Amigos */}
      {showInviteButton && (
        <Pressable
          style={styles.button}
          onPress={handleInvitePress}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>{t("boxDetails.inviteButton")}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  activeButton: { backgroundColor: "rgba(255, 255, 255, 0.6)" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default ButtonsSection;

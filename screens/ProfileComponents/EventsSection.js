import React, { useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const EventsSection = ({ events, handleBoxPress, t }) => {
  const handlePress = (event) => {
    handleBoxPress(event);
  };

  useEffect(() => {}, [events]);

  return (
    <View style={styles.buttonContainer}>
      {events.map((event) => (
        <TouchableOpacity
          key={event.id}
          style={styles.button}
          onPress={() => handlePress(event)}
        >
          <Text style={styles.buttonText}>
            {event.title.length > 9
              ? `${event.title.substring(0, 5)}...`
              : event.title}{" "}
            {event.category === "EventoParaAmigos"
              ? event.date
              : event.formattedDate || t("profile.noDate")}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: height * 0.05, // 5% de la altura de la pantalla
    gap: width * 0.03, // 3% del ancho de la pantalla como separación entre botones
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: height * 0.01, // 2% de la altura
    paddingHorizontal: width * 0.05, // 5% del ancho
    borderRadius: Math.min(width, height) * 0.05, // 5% de la dimensión menor para un radio responsivo
    margin: width * 0.01, // margen de 1% del ancho
  },
  buttonText: {
    color: "#fff",
    fontSize: Math.min(width, height) * 0.04, // tamaño de fuente relativo a la pantalla
    fontWeight: "bold",
  },
});

export default EventsSection;

import React from "react";
import { useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet} from "react-native";
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Categorías de pantalla
const isSmallScreen = screenWidth <= 411 && screenHeight <= 850; // Pantallas pequeñas
const isMediumScreen = screenWidth > 411 && screenWidth <= 430 && screenHeight <= 932; // Pantallas medianas

const EventsSection = ({ events, handleBoxPress, t }) => {
 
const handlePress = (event) => {
 
  handleBoxPress(event);
};


useEffect(() => {
}, [events]);
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
    marginBottom: isSmallScreen ? 10 : isMediumScreen ? 60 : 80, // Diferentes márgenes según la categoría
    gap: 10,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: isSmallScreen ? 10 : isMediumScreen ? 13 : 30, // Diferentes márgenes según la categoría
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EventsSection;
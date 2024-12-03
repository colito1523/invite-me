import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

const EventsSection = ({ events, handleBoxPress, t }) => {
const handlePress = (event) => {
  console.log("Event details:", event);
  handleBoxPress(event);
};

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
    marginBottom: 10,
    gap: 10,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
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
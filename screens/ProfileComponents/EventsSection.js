import React, { useCallback } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const EventsSection = React.memo(({ events, handleBoxPress, t }) => {
  const handlePress = useCallback((event) => {
    handleBoxPress(event);
  }, [handleBoxPress]);

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
});

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: height * 0.05,
    gap: width * 0.03,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.05,
    borderRadius: Math.min(width, height) * 0.05,
    margin: width * 0.01,
  },
  buttonText: {
    color: "#fff",
    fontSize: Math.min(width, height) * 0.04,
    fontWeight: "bold",
  },
});

export default EventsSection;

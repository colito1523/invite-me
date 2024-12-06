import React from "react";
import { View } from "react-native";
import Box from "../../Components/Boxs/Box";
import DotIndicator from "../../Components/Dots/DotIndicator";

const EventItem = ({ item, handleBoxPress, selectedDate, styles }) => (
  <View style={styles.boxContainer}>
    <Box
      imageUrl={item.imageUrl}
      title={item.title}
      onPress={() => handleBoxPress(item)}
      selectedDate={selectedDate}
      date={item.date}
      isPrivateEvent={item.category === "EventoParaAmigos"}
    />
    {item.attendees && item.attendees.length > 0 && (
      <DotIndicator
        profileImages={item.attendees.map((attendee) => attendee.profileImage)}
        attendeesList={item.attendees}
      />
    )}
  </View>
);

export default React.memo(EventItem);

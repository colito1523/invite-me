import React from "react";
import { View } from "react-native";
import Box from "../../Components/Boxs/Box";
import DotIndicator from "../../Components/Dots/DotIndicator";

const EventListHeader = ({ privateEvents, handleBoxPress, styles }) => (
  <View style={styles.sectionContainer}>
    {privateEvents.map((event, index) => (
      <View style={styles.boxContainer} key={index}>
        <Box
          imageUrl={event.image || event.imageUrl}
          title={event.title}
          onPress={() => handleBoxPress(event)}
          selectedDate={event.date}
          date={event.date}
          isPrivateEvent={true}
        />
        {event.attendees && event.attendees.length > 0 && (
          <DotIndicator
            profileImages={event.attendees.map(
              (attendee) => attendee.profileImage
            )}
            attendeesList={event.attendees}
          />
        )}
      </View>
    ))}
  </View>
);

export default React.memo(EventListHeader);

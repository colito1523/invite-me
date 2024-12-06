import React from "react";
import { FlatList } from "react-native";
import EventItem from "./EventItem";
import EventListHeader from "./EventListHeader";

const EventList = ({
  filteredBoxData,
  privateEvents,
  handleBoxPress,
  selectedDate,
  styles,
}) => {
  return (
    <FlatList
      data={filteredBoxData.flatMap((group) => group.data)}
      renderItem={({ item }) => (
        <EventItem
          item={item}
          handleBoxPress={handleBoxPress}
          selectedDate={selectedDate}
          styles={styles}
        />
      )}
      keyExtractor={(item) => item.title}
      ListHeaderComponent={
        <EventListHeader
          privateEvents={privateEvents}
          handleBoxPress={handleBoxPress}
          styles={styles}
        />
      }
    />
  );
};

export default React.memo(EventList);

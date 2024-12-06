import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CalendarPicker from "../CalendarPicker";
import { dayStyles, nightStyles } from "./styles";

const Header = ({ isNightMode, toggleMenu, handleDateChange, setLoading }) => {
  const currentStyles = isNightMode ? nightStyles : dayStyles;

  return (
    <View style={currentStyles.headerContainer}>
      <TouchableOpacity style={{ marginLeft: 10 }} onPress={toggleMenu}>
        <Ionicons
          name="menu"
          size={24}
          color={isNightMode ? "white" : "black"}
        />
      </TouchableOpacity>

      <CalendarPicker
        onDateChange={handleDateChange}
        style={currentStyles.calendarPicker}
        setLoading={setLoading}
      />
    </View>
  );
};

export default Header;

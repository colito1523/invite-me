import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { dayStyles, nightStyles } from "./styles"; // Import both day and night styles

const TabBar = ({
  isNightMode,
  profileImage,
  unreadNotifications,
  unreadMessages,
}) => {
  const navigation = useNavigation();
  const styles = isNightMode ? nightStyles : dayStyles; // Choose styles based on isNightMode

  return (
    <View style={styles.tabBar}> 
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <Ionicons
          name="home"
          size={24}
          color={isNightMode ? "white" : "black"} // Ajuste dinámico del color
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Search")}>
        <Ionicons
          name="search"
          size={24}
          color={isNightMode ? "white" : "black"}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <Ionicons
            name="person-circle"
            size={24}
            color={isNightMode ? "white" : "black"}
          />
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
        <Ionicons
          name="notifications"
          size={24}
          color={isNightMode ? "white" : "black"}
        />
        {unreadNotifications && (
          <>
           {console.log("Renderizando indicador de notificaciones")}
          <View style={[styles.unreadIndicator, { backgroundColor: "red" }]} />
          </>

        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
        <Ionicons
          name="mail"
          size={25}
          color={isNightMode ? "white" : "black"}
        />
        {unreadMessages && (
          <View style={[styles.unreadIndicator, { backgroundColor: "red" }]} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default TabBar;

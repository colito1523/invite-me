import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

const TabBar = ({
  navigation,
  isNightMode,
  profileImage,
  unreadNotifications,
  unreadMessages,
  styles,
  navigateToProfile
}) => {
  return (
    <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons
            name="home"
            size={24}
            color={isNightMode ? "white" : "black"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Search")}>
          <Ionicons
            name="search"
            size={24}
            color={isNightMode ? "white" : "black"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={navigateToProfile}>
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
            <View
              style={[styles.unreadIndicator, { backgroundColor: "red" }]}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
          <Ionicons
            name="mail"
            size={25}
            color={isNightMode ? "white" : "black"}
          />
          {unreadMessages && (
            <View
              style={[styles.unreadIndicator, { backgroundColor: "red" }]}
            />
          )}
        </TouchableOpacity>
      </View>
  );
};

export default React.memo(TabBar);

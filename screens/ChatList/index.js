import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, Feather } from "@expo/vector-icons";
import { auth, database } from "../../config/firebase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Menu, Provider } from "react-native-paper";
import Notes from "../../Components/Notes/Notes";
import { fetchChats, formatTime, handleChatPress, handleDeleteChat } from "./utils";
import { styles, darkTheme, lightTheme } from "./styles";

const muteOptions = [
  { label: "1 hora", value: 1 },
  { label: "4 horas", value: 4 },
  { label: "8 horas", value: 8 },
  { label: "24 horas", value: 24 },
];

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const [hiddenChats, setHiddenChats] = useState([]);
  const [showHiddenChats, setShowHiddenChats] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedHiddenChat, setSelectedHiddenChat] = useState(null);
  const [password, setPassword] = useState("");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const user = auth.currentUser;
  const navigation = useNavigation();
  const theme = isNightMode ? darkTheme : lightTheme;

  const checkTime = () => {
    const currentHour = new Date().getHours();
    setIsNightMode(currentHour >= 19 || currentHour < 6);
  };
  const interval = setInterval(checkTime, 60000);
  useEffect(() => {

    checkTime();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isNightMode ? "#1a1a1a" : "#fff",
      },
      headerTintColor: isNightMode ? "#fff" : "#000",
      headerLeft: () => (
        <Ionicons
          name="arrow-back"
          size={24}
          color={isNightMode ? "#fff" : "#000"}
          style={{ marginLeft: 10 }}
          onPress={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation, isNightMode]);

  useFocusEffect(
    useCallback(() => {
      
  
      fetchChats();
    }, [user?.uid])
  );
  
  const filtered = chats.filter((chat) =>
    chat.user.username.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    setFilteredChats(filtered);
  }, [chats, searchText]);

  const handleOptionsPress = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        isSelectionMode ? toggleChatSelection(item.id) : handleChatPress({chat :item, user, navigation})
      }
      onLongPress={() =>
        !isSelectionMode &&
        Alert.alert(
          "Eliminar Chat",
          "¿Estás seguro de que deseas eliminar este chat?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", onPress: () => handleDeleteChat({chat : item, user, setChats}) },
          ]
        )
      }
    >
      {isSelectionMode && (
        <View
          style={[
            styles.checkbox,
            selectedChats.includes(item.id) && styles.checkboxSelected,
          ]}
        />
      )}
      <Image
        source={{
          uri: item.user.photoUrls?.[0] || "https://via.placeholder.com/150",
        }}
        style={styles.userImage}
      />
      <View style={styles.chatInfo}>
        <Text
          style={[
            styles.chatTitle,
            { fontWeight: item.unseenMessagesCount > 0 ? "bold" : "normal" },
            { color: isNightMode ? "white" : "black" },
          ]}
        >
          {item.user.username || "Usuario desconocido"}
        </Text>
        {item.unseenMessagesCount === 0 && (
          <Text
            style={[
              styles.lastMessagePreview,
              { color: isNightMode ? "white" : "black" },
            ]}
          >
            {truncateMessage(item.lastMessage || "")}
          </Text>
        )}
      </View>
      <View style={styles.timeAndUnreadContainer}>
        {item.unseenMessagesCount > 0 ? (
          <View style={styles.unseenCountContainer}>
            <Text style={styles.unseenCountText}>
              {item.unseenMessagesCount}
            </Text>
          </View>
        ) : (
          <Text style={[styles.lastMessageTime, { color: isNightMode ? "white" : "black" }]}>
            {formatTime(item.lastMessageTimestamp)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  

  return (
    <Provider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <LinearGradient
          colors={isNightMode ? ["#1a1a1a", "#000"] : ["#fff", "#f0f0f0"]}
          style={styles.container}
        >
          <Notes />
          <View
            style={[styles.searchContainer, { borderColor: theme.borderColor }]}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.icon}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Pesquisar"
              placeholderTextColor={theme.placeholder}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Mensajes</Text>
            <Menu
              visible={showOptionsMenu}
              onDismiss={() => setShowOptionsMenu(false)}
              anchor={
                <TouchableOpacity onPress={handleOptionsPress}>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={24}
                    color={theme.icon}
                    style={styles.dotsIcon}
                  />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  setIsSelectionMode(true);
                  setShowOptionsMenu(false);
                }}
                title="Borrar Mensajes"
              />
              <Menu.Item
                onPress={() => {
                  setIsSelectionMode(true);
                  setShowMuteOptions(true);
                  setShowOptionsMenu(false);
                }}
                title="Silenciar Notificaciones"
              />
            </Menu>
          </View>

          {isSelectionMode && (
            <TouchableOpacity
              style={[
                styles.selectAllButton,
                { backgroundColor: theme.buttonBackground },
              ]}
              onPress={handleSelectAll}
            >
              <Text style={[styles.selectAllText, { color: theme.buttonText }]}>
                {selectAll ? "Deseleccionar todos" : "Seleccionar todos"}
              </Text>
            </TouchableOpacity>
          )}

          {showMuteOptions && (
            <View
              style={[
                styles.muteOptionsContainer,
                { backgroundColor: theme.muteOptionsBackground },
              ]}
            >
              {muteOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.muteOption,
                    { backgroundColor: theme.muteOptionBackground },
                  ]}
                  onPress={() => handleMuteSelectedChats(option.value)}
                >
                  <Text
                    style={[
                      styles.muteOptionText,
                      { color: theme.muteOptionText },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <FlatList
            data={showHiddenChats ? hiddenChats : filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
          />

          {isSelectionMode && (
            <View
              style={[
                styles.selectionModeContainer,
                { backgroundColor: theme.selectionModeBackground },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.selectionModeButton,
                  { backgroundColor: theme.selectionModeButtonBackground },
                ]}
                onPress={handleDeleteSelectedChats}
              >
                <Text
                  style={[
                    styles.selectionModeButtonText,
                    { color: theme.selectionModeButtonText },
                  ]}
                >
                  Borrar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectionModeButton,
                  { backgroundColor: theme.selectionModeButtonBackground },
                ]}
                onPress={() => setShowMuteOptions(true)}
              >
                <Text
                  style={[
                    styles.selectionModeButtonText,
                    { color: theme.selectionModeButtonText },
                  ]}
                >
                  Silenciar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectionModeButton,
                  { backgroundColor: theme.selectionModeButtonBackground },
                ]}
                onPress={() => setIsSelectionMode(false)}
              >
                <Text
                  style={[
                    styles.selectionModeButtonText,
                    { color: theme.selectionModeButtonText },
                  ]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </SafeAreaView>
    </Provider>
  );
}
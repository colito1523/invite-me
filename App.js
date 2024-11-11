import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import * as Font from "expo-font";
import { BlockProvider } from "./src/contexts/BlockContext";
import { Provider as PaperProvider } from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Home from "./screens/Home";
import Search from "./screens/Search";
import ForgotPassword from "./screens/ForgotPassword";
import Profile from "./screens/Profile";
import Notifications from "./screens/Notifications";
import UserProfile from "./screens/UserProfile";
import PrivateUserProfile from "./Components/Privado/PrivateUserProfile";
import CreateEvent from "./screens/CreateEvent";
import BoxDetails from "./screens/BoxDetails";
import ChatUsers from "./screens/ChatUsers";
import ChatList from "./screens/ChatList";
import AudioPlayer from "./screens/AudioPlayer";
import Tutorial from './screens/Tutorial';

import { auth, database } from "./config/firebase";

import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

const Stack = createStackNavigator();
const AuthenticatedUserContext = React.createContext({});
const LANGUAGE_KEY = '@app_language';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};

function ChatStack() {
  return (
    <BlockProvider>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Search" component={Search} options={{ headerTitle: "" }} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="UserProfile" component={UserProfile} options={{ headerShown: false }} />
        <Stack.Screen name="CreateEvent" component={CreateEvent} options={{ headerShown: false }} />
        <Stack.Screen name="BoxDetails" component={BoxDetails} options={{ headerShown: false }} />
        <Stack.Screen name="ChatUsers" component={ChatUsers} options={{ headerShown: false }} />
        <Stack.Screen name="ChatList" component={ChatList} options={{ headerTitle: "" }} />
        <Stack.Screen name="PrivateUserProfile" component={PrivateUserProfile} options={{ headerShown: false }} />
        <Stack.Screen name="AudioPlayer" component={AudioPlayer} />
        <Stack.Screen name="Tutorial" component={Tutorial} options={{ headerShown: false }} />
      </Stack.Navigator>
    </BlockProvider>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, setUser } = React.useContext(AuthenticatedUserContext);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        const userDoc = doc(database, "users", authenticatedUser.uid);
        const userSnapshot = await getDoc(userDoc);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <ChatStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const [isI18nInitialized, setIsI18nInitialized] = React.useState(false);

  React.useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          NotoSerifKhitan: require("./assets/fonts/NotoSerifKhitanSmallScript-Regular.ttf"),
          Parisienne: require("./assets/fonts/Parisienne-Regular.ttf"),
          AlexBrush: require("./assets/fonts/AlexBrush-Regular.ttf"),
          PlaywriteAUSA: require("./assets/fonts/PlaywriteAUSA-VariableFont_wght.ttf"),
          "Roboto-Light": require("./assets/fonts/Roboto-Light.ttf"),
          "Lato-Black": require("./assets/fonts/Lato-Black.ttf"),
        });
        console.log("Fonts loaded successfully");
        setFontsLoaded(true);
      } catch (error) {
        console.error("Error loading fonts", error);
      }
    };

    const initializeI18n = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          await i18n.changeLanguage(savedLanguage);
        }
        setIsI18nInitialized(true);
      } catch (error) {
        console.error('Error initializing i18n:', error);
        setIsI18nInitialized(true); // Set to true even on error to allow app to continue
      }
    };

    loadFonts();
    initializeI18n();
  }, []);

  if (!fontsLoaded || !isI18nInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthenticatedUserProvider>
      <PaperProvider>
        <RootNavigator />
      </PaperProvider>
    </AuthenticatedUserProvider>
  );
}
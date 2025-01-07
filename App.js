import React, { useEffect, useState, createContext, useContext } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc, updateDoc } from "firebase/firestore"; // Añadir updateDoc para actualizar Firestore
import * as Font from "expo-font";
import { BlockProvider } from "./src/contexts/BlockContext";
import { Provider as PaperProvider } from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import useNotifications from "./src/hooks/useNotifications"; // Importa el hook personalizado
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Importa esto
import { UnreadMessagesProvider } from './src/hooks/UnreadMessagesContext';
import { DateProvider } from "./src/hooks/DateContext";


import Login from "./screens/LoginComponents/index";
import Signup from "./screens/SignUpComponents/index";
import Home from "./screens/HomeComponents/index";
import Search from "./screens/SearchComponents/index";
import ForgotPassword from "./screens/ForgotPassword";
import Profile from "./screens/Profile/index";
import Notifications from "./screens/Notifications/index";
import UserProfile from "./screens/UserProfile/index";
import PrivateUserProfile from "./Components/Privado/PrivateUserProfile";
import CreateEvent from "./screens/CreateEventComponents/index";
import BoxDetails from "./screens/BoxDetails/index";
import ChatUsers from "./screens/ChatUsers/index";
import ChatList from "./screens/ChatList/index";
import AudioPlayer from "./screens/AudioPlayer";
import Tutorial from './screens/Tutorial';
import EventRecommendations from './Components/EventRecomendation/event-recommendations';
import StoryViewer from './Components/Stories/StoryViewer';

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

export const LanguageContext = createContext(); // Export LanguageContext

const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          i18n.changeLanguage(savedLanguage);
          setSelectedLanguage(savedLanguage);
        } else if (auth.currentUser) {
          const userRef = doc(database, "users", auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const preferredLanguage = userDoc.data().preferredLanguage;
            if (preferredLanguage) {
              i18n.changeLanguage(preferredLanguage);
              setSelectedLanguage(preferredLanguage);
              await AsyncStorage.setItem(LANGUAGE_KEY, preferredLanguage);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };
    loadSavedLanguage();
  }, []);

  const changeLanguage = async (lang) => {
    await i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      if (auth.currentUser) {
        const userRef = doc(database, "users", auth.currentUser.uid);
        await updateDoc(userRef, { preferredLanguage: lang });
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ selectedLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

function ChatStack() {
  return (
    <BlockProvider>
       <DateProvider>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Search" component={Search} options={{ headerTitle: "" }} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="UserProfile" component={UserProfile} options={{ headerShown: false }} />
        <Stack.Screen name="CreateEvent" component={CreateEvent} options={{ headerShown: false }} />
        <Stack.Screen name="EventRecommendations" component={EventRecommendations} options={{ headerShown: false }}  />
        <Stack.Screen name="BoxDetails" component={BoxDetails} options={{ headerShown: false }} />
        <Stack.Screen name="ChatUsers" component={ChatUsers} options={{ headerShown: false }} />
        <Stack.Screen name="ChatList" component={ChatList} options={{ headerTitle: "" }} />
        <Stack.Screen name="PrivateUserProfile" component={PrivateUserProfile} options={{ headerShown: false }} />
        <Stack.Screen name="AudioPlayer" component={AudioPlayer} />
        <Stack.Screen name="Tutorial" component={Tutorial} options={{ headerShown: false }} />
        <Stack.Screen name="StoryViewer" component={StoryViewer} options={{ headerShown: false }} />
      </Stack.Navigator>
      </DateProvider>
    </BlockProvider>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen 
        name="Login" 
        component={Login} 
        options={{ gestureEnabled: false }}
      />
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
        await getDoc(userDoc); // Obtener los datos del usuario (puedes agregar lógica según tus necesidades)
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
        <ActivityIndicator size={50} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <ChatStack />
      ) : (
        <Stack.Navigator 
          screenOptions={{ headerShown: false }}
          initialRouteName="Login"
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const [isI18nInitialized, setIsI18nInitialized] = React.useState(false);

  const expoPushToken = useNotifications(); // Usa el hook de notificaciones

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
        } else if (auth.currentUser) {
          // Fetch preferred language from Firestore
          const userRef = doc(database, "users", auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const preferredLanguage = userDoc.data().preferredLanguage;
            if (preferredLanguage) {
              await i18n.changeLanguage(preferredLanguage);
              await AsyncStorage.setItem(LANGUAGE_KEY, preferredLanguage);
            }
          }
        }
        setIsI18nInitialized(true);
      } catch (error) {
        console.error('Error initializing i18n:', error);
        setIsI18nInitialized(true);
      }
    };

    const updatePushTokenInFirestore = async () => {
      if (auth.currentUser && expoPushToken) {
        try {
          const userRef = doc(database, 'users', auth.currentUser.uid);
          await updateDoc(userRef, { expoPushToken: expoPushToken });
       
        } catch (error) {
          console.error("Error actualizando expoPushToken:", error);
        }
      }
    };

    loadFonts();
    initializeI18n();
    updatePushTokenInFirestore();
  }, [expoPushToken]);

  if (!fontsLoaded || !isI18nInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size={50} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
       <SafeAreaProvider>
    <AuthenticatedUserProvider>
    <UnreadMessagesProvider> 
      <PaperProvider>
        <LanguageProvider>
        <RootNavigator />
        </LanguageProvider>
      </PaperProvider>
      </UnreadMessagesProvider>
    </AuthenticatedUserProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

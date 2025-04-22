import "dotenv/config";

export default {
  android: {
    config: {
      googleMaps: {
        apiKey: "AIzaSyD0qVS4hUiuJGxoQLTt49SUNnj9kIP-cn8",
      },
    },
  },
  ios: {
    config: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
  expo: {
    name: "Invite Me",
    slug: "invite-me",
    version: "2.0.8",
    orientation: "portrait",
    icon: "./assets/nuevo_logo.png",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "com.airesSoftStudio.inviteMe",
      supportsTablet: false,
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        NSCameraUsageDescription: "Access to the camera is required to upload stories.",
  NSPhotoLibraryUsageDescription: "Access to the photo library is required to upload stories.",
   NSMicrophoneUsageDescription: "Access to the al Microphone for record voices in videos",
  NSPhotoLibraryAddUsageDescription: "Permission is needed to save photos to your gallery.",
  NSUserNotificationsUsageDescription: "Access is required to send you important notifications about events and updates.",
  NSLocationWhenInUseUsageDescription: "Access to your location is needed to show nearby events.",
  NSLocationAlwaysUsageDescription: "Constant access to your location is required to send location-based notifications.",
  ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: "com.airesSoftStudio.inviteMe",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/nuevo_logo.png",
        backgroundColor: "#EBDCD5",
      },
      notification: {
        icon: "./assets/nuevo_logo.png",
        color: "#EBDCD5",
        iosDisplayInForeground: true,
        androidMode: "default",
        androidCollapsedTitle: "Invite Me",
      },
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "RECORD_AUDIO",
      ],
      softwareKeyboardLayoutMode: "pan",
      allowBackup: true,
      jsEngine: "hermes",
    },
    "expo-build-properties": {
      android: {
        compileSdkVersion: 33,
        targetSdkVersion: 33,
        buildToolsVersion: "33.0.2",
      },
    },
    web: {
      favicon: "./assets/nuevo_logo.png",
    },
    extra: {
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      projectId: process.env.PROJECT_ID,
      storageBucket: process.env.STORAGE_BUCKET,
      messagingSenderId: process.env.MESSAGING_SENDER_ID,
      appId: process.env.APP_ID,
      eas: {
        projectId: "2f585478-2f32-4de0-a5fe-edc97d5c9ab0",
      },
    },
    owner: "patomagan",
    plugins: [
      "expo-secure-store",
      "expo-font",
      ["expo-camera"], // Agrega el plugin de expo-camera aquí
    ],
    updates: {
      url: "https://u.expo.dev/2f585478-2f32-4de0-a5fe-edc97d5c9ab0",
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: {
      policy: "sdkVersion"
    },
    newArchEnabled: true,
  },
};
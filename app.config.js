import "dotenv/config";

export default {
  expo: {
    name: "Invite Me",
    slug: "invite-me",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/Logo_Invite_Me.png",  
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/Logo_Invite_Me.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "Se necesita acceso a la cámara para subir historias",
        NSPhotoLibraryUsageDescription: "Se necesita acceso a la galería para subir historias",
        NSPhotoLibraryAddUsageDescription: "Se necesita permiso para guardar fotos en tu galería"
      }
    },
    android: {
      package: "com.airesSoft.inviteMe",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/Logo_Invite_Me.png",
        backgroundColor: "#ffffff"
      },
      notification: {
        icon: "./assets/notification-icon.png",
        color: "#FFFFFF"
      },
      permissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"] // Agrega permisos explícitos
    },
    web: {
      favicon: "./assets/Logo_Invite_Me.png"
    },
    extra: {
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      projectId: process.env.PROJECT_ID,
      storageBucket: process.env.STORAGE_BUCKET,
      messagingSenderId: process.env.MESSAGING_SENDER_ID,
      appId: process.env.APP_ID,
      eas: {
        projectId: "7e15b633-dd47-4035-86d3-96443bfdab66"
      }
    },
    plugins: [
      "expo-secure-store",
      "expo-font",
      ["expo-camera"] // Agrega el plugin de expo-camera aquí
    ],
    updates: {
      url: "https://u.expo.dev/7e15b633-dd47-4035-86d3-96443bfdab66"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    newArchEnabled: true
  }
};

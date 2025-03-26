import React, { useEffect, useState, useRef } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { database } from '../config/firebase';
import Constants from 'expo-constants';

const APP_STORE_URL = 'https://apps.apple.com/app/id6740990112';

const ForceUpdate = ({ children }) => {
  const alertVisible = useRef(false); // 🔒 control real
  const [hasShownOnce, setHasShownOnce] = useState(false); // solo para mostrar una vez

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const checkVersion = async () => {
      try {
        const docRef = doc(database, 'config', 'appVersion');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const latestVersion = docSnap.data().ios;
          const currentVersion =
            Constants.expoConfig?.version ||
            Constants.manifest?.version ||
            '0.0.0';

          if (
            compareVersions(currentVersion, latestVersion) < 0 &&
            !alertVisible.current
          ) {
            showUpdateAlert();
          }
        }
      } catch (e) {
        console.log('Error checking version:', e);
      }
    };

    checkVersion();
    const intervalId = setInterval(checkVersion, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const showUpdateAlert = () => {
    alertVisible.current = true;

    Alert.alert(
      'New version available',
      'You must update the app to continue.',
      [
        {
          text: 'Update',
          onPress: () => {
            Linking.openURL(APP_STORE_URL);
            // dejamos visible el alert en loop después de cerrar
            setTimeout(() => {
              alertVisible.current = false;
              showUpdateAlert(); // vuelve a aparecer
            }, 500); // pequeño delay para evitar stack
          },
        },
      ],
      {
        cancelable: false,
        onDismiss: () => {
          alertVisible.current = false;
        },
      }
    );
  };

  return children;
};

const compareVersions = (v1, v2) => {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const a = v1Parts[i] || 0;
    const b = v2Parts[i] || 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
};

export default ForceUpdate;

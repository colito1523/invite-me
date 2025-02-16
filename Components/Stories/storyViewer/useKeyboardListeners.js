// useKeyboardListeners.js
import { useState, useEffect } from "react";
import { Keyboard } from "react-native";

export default function useKeyboardListeners() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Se suscribe a los eventos de teclado de React Native
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    // Limpieza al desmontar el componente
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Retorna simplemente el estado de si el teclado está visible
  return isKeyboardVisible;
}

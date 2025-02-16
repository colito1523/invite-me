// useBackHandler.js
import { useEffect } from "react";
import { BackHandler } from "react-native";

export default function useBackHandler(onBackAction) {
  useEffect(() => {
    const backAction = () => {
      onBackAction?.();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [onBackAction]);
}

// hooks/useLocationAndTime.js
import { useState, useEffect } from "react";
import * as Location from "expo-location";

export const useLocationAndTime = () => {
  const [locationGranted, setLocationGranted] = useState(false);
  const [country, setCountry] = useState(null);
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationGranted(true);
        const location = await Location.getCurrentPositionAsync({});
        const geocode = await Location.reverseGeocodeAsync(location.coords);
        if (geocode.length > 0) {
          setCountry(geocode[0].country || null);
          console.log("País detectado:", detectedCountry); // Agregar el console.log aquí
          setCountry(detectedCountry);
        }
      }
    };

    requestLocationPermission();

    const checkNightMode = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkNightMode();
    const interval = setInterval(checkNightMode, 60000);

    return () => clearInterval(interval);
  }, []);

  return { locationGranted, country, isNightMode };
};
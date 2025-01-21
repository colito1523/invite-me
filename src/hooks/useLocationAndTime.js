// hooks/useLocationAndTime.js
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { doc, updateDoc } from "firebase/firestore";
import { auth, database } from "../../config/firebase";

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
          const detectedCountry = geocode[0].country || null;
          const detectedCity = geocode[0].city || null;
          console.log("País detectado:", detectedCountry);
          console.log("Ciudad detectada:", detectedCity);

          // Get coordinates of the detected location
          const userLat = location.coords.latitude;
          const userLon = location.coords.longitude;

          // Reference coordinates for Madrid and Lisboa
          const madridCoords = { lat: 40.4168, lon: -3.7038, name: "Madrid" };
          const lisboaCoords = { lat: 38.7223, lon: -9.1393, name: "Lisboa" };

          // Calculate distances
          const distanceToMadrid = Math.sqrt(
            Math.pow(userLat - madridCoords.lat, 2) + 
            Math.pow(userLon - madridCoords.lon, 2)
          );

          const distanceToLisboa = Math.sqrt(
            Math.pow(userLat - lisboaCoords.lat, 2) + 
            Math.pow(userLon - lisboaCoords.lon, 2)
          );

          const nearestCity = distanceToMadrid < distanceToLisboa ? madridCoords.name : lisboaCoords.name;
          const nearestCountry = distanceToMadrid < distanceToLisboa ? "España" : "Portugal";
          console.log("Ciudad más cercana:", nearestCity);
          console.log("País configurado más cercano:", nearestCountry);

          // Save nearest city and country to user's document
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(database, "users", user.uid);
            await updateDoc(userRef, {
              nearestCity: nearestCity,
              nearestCountry: nearestCountry
            });
          }

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
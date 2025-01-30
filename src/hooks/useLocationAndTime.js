
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { doc, updateDoc } from "firebase/firestore";
import { auth, database } from "../../config/firebase";

export const useLocationAndTime = () => {
  const [locationGranted, setLocationGranted] = useState(true);
  const [country, setCountry] = useState("Portugal");
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === "granted") {
          setLocationGranted(true);
          const location = await Location.getCurrentPositionAsync({});
          const geocode = await Location.reverseGeocodeAsync(location.coords);
          
          if (geocode.length > 0) {
            const detectedCountry = geocode[0].country || null;
            const detectedCity = geocode[0].city || null;
            
            const userLat = location.coords.latitude;
            const userLon = location.coords.longitude;

            const madridCoords = { lat: 40.4168, lon: -3.7038, name: "Madrid" };
            const lisboaCoords = { lat: 38.7223, lon: -9.1393, name: "Lisboa" };

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

            if (auth.currentUser) {
              const userRef = doc(database, "users", auth.currentUser.uid);
              await updateDoc(userRef, {
                nearestCity: nearestCity,
                nearestCountry: nearestCountry
              });
            }

            setCountry(detectedCountry);
          }
        } else {
          // Si no se otorgan permisos, establecer Lisboa como predeterminado
          setLocationGranted(true); // Mantenemos esto como true para que la app funcione
          setCountry("Portugal");
          
          if (auth.currentUser) {
            const userRef = doc(database, "users", auth.currentUser.uid);
            await updateDoc(userRef, {
              nearestCity: "Lisboa",
              nearestCountry: "Portugal"
            });
          }
        }
      } catch (error) {
        console.error("Error al solicitar permisos de ubicación:", error);
        // En caso de error, también establecemos Lisboa como predeterminado
        setLocationGranted(true);
        setCountry("Portugal");
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

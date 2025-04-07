import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { doc, updateDoc } from "firebase/firestore";
import { auth, database } from "../../config/firebase";

export const useLocationAndTime = () => {
  const [locationGranted, setLocationGranted] = useState(true);
  const [country, setCountry] = useState("Portugal");
  const [city, setCity] = useState(null); 
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

            // Lista de ciudades disponibles
            const cities = [
              { name: "Madrid", lat: 40.4168, lon: -3.7038, country: "España" },
              { name: "Barcelona", lat: 41.3851, lon: 2.1734, country: "España" },
              { name: "Lisboa", lat: 38.7223, lon: -9.1393, country: "Portugal" },
              { name: "Londres", lat: 51.5074, lon: -0.1278, country: "Inglaterra" },
            ];

            // Buscar la ciudad más cercana
            let nearestCity = null;
            let nearestDistance = Infinity;

            cities.forEach((city) => {
              const distance = Math.sqrt(
                Math.pow(userLat - city.lat, 2) + Math.pow(userLon - city.lon, 2)
              );
              if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestCity = city;
              }
            });

            // LOG: Mostrar resultados por consola
            console.log("🌍 Ubicación actual:", {
              lat: userLat,
              lon: userLon,
              ciudadDetectada: detectedCity,
              paisDetectado: detectedCountry,
            });

            console.log("📍 Ciudad más cercana según coordenadas:", nearestCity);

            // Guardar en Firestore
            if (auth.currentUser && nearestCity) {
              const userRef = doc(database, "users", auth.currentUser.uid);
              await updateDoc(userRef, {
                nearestCity: nearestCity.name,
                nearestCountry: nearestCity.country,
                detectedLocation: {
                  city: detectedCity,
                  country: detectedCountry,
                },
              });
              setCountry(nearestCity.country);
              setCity(nearestCity.name);
            }
          }
        } else {
          // Si no se otorgan permisos, usar Lisboa como predeterminado
          setLocationGranted(true);
          setCountry("Portugal");

          if (auth.currentUser) {
            const userRef = doc(database, "users", auth.currentUser.uid);
            await updateDoc(userRef, {
              nearestCity: "Lisboa",
              nearestCountry: "Portugal",
              detectedLocation: {
                city: null,
                country: null,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error al solicitar permisos de ubicación:", error);
        setLocationGranted(true);
        setCountry("Portugal");

        if (auth.currentUser) {
          const userRef = doc(database, "users", auth.currentUser.uid);
          await updateDoc(userRef, {
            nearestCity: "Lisboa",
            nearestCountry: "Portugal",
            detectedLocation: {
              city: null,
              country: null,
            },
          });
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

  return { locationGranted, country, city, isNightMode };
};

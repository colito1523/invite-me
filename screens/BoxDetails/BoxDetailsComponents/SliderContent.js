import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, Linking, TouchableOpacity  } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useTranslation } from "react-i18next";


const { width } = Dimensions.get("window");

const SliderContent = ({
  box,
  boxData,
  isNightMode,
  isFromNotification,
  showDescription,
}) => {
  const [mapRegion, setMapRegion] = useState(null);
  const [markerCoordinate, setMarkerCoordinate] = useState(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      if (!box?.coordinates) {
        console.warn("Coordenadas no disponibles para este evento.");
        return;
      }

      const { latitude, longitude } = box.coordinates;

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        console.warn("Coordenadas inválidas");
        return;
      }

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      if (isMounted) {
        setMapRegion(newRegion);
        setMarkerCoordinate({ latitude, longitude });
      }
    };

    // Pequeño retraso para asegurar que los componentes estén montados
    const timer = setTimeout(() => {
      initializeMap();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      setMapRegion(null);
      setMarkerCoordinate(null);
    };
  }, [box?.coordinates]); // Escuchar cambios específicos en coordenadas

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.slider}
    >
      {/* Primer Slider: Mapa o Descripción */}
      <View style={styles.sliderPart}>
        {showDescription ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {boxData.description ||
                t("SliderContent.descriptionNotAvailable")}
            </Text>
          </View>
        ) : mapRegion ? (
          <View style={styles.mapContainer}>
            {mapRegion && (
              <MapView
              provider={Platform.OS === "android" ? "google" : undefined}
                style={styles.map}
                initialRegion={mapRegion}
                region={mapRegion}
                onRegionChangeComplete={(region) => setMapRegion(region)}
                onError={(error) => console.error('Error al cargar el mapa:', error)}
                loadingEnabled={true}
                loadingIndicatorColor="#999999"
                loadingBackgroundColor="#ffffff"
                moveOnMarkerPress={false}
                showsUserLocation={Platform.OS === "ios"}
                toolbarEnabled={true}
                zoomEnabled={true}
                zoomControlEnabled={true}
                minZoomLevel={10}
                maxZoomLevel={20}
              >
                {markerCoordinate && (
                  <Marker
                    coordinate={markerCoordinate}
                    title={box?.title || "Evento"}
                    description={box?.description || ""}
                  />
                )}
              </MapView>
            )}
          </View>
        ) : (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {boxData.description ||
                t("SliderContent.descriptionNotAvailable")}
            </Text>
          </View>
        )}
      </View>

      {/* Segundo Slider: Horarios */}
   {/* Segundo Slider: Horarios o Detalles para Festivities */}
<View style={styles.sliderPart}>
  <View style={styles.hoursContainer}>
    {box.category !== "EventoParaAmigos" &&
box.category === "Festivities" &&
(box.details || boxData.details)? (
      <View style={styles.descriptionContainer}>
       
        <Text style={styles.descriptionText}>
        {(box.details?.[i18n.language] || boxData.details?.[i18n.language]) ??
  box.details ?? boxData.details ?? t("SliderContent.descriptionNotAvailable")}
</Text>
      </View>
    ) : box.category === "EventoParaAmigos" && box.day && box.hour ? (
      <View style={styles.notificationHours}>
        <Text style={styles.hoursText}>
          {`${t("SliderContent.hour")}: ${box.hour}`}
        </Text>
        <Text style={styles.dayText}>{box.day}</Text>
      </View>
    ) : isFromNotification && (box.hour || box.day) ? (
      <View style={styles.notificationHours}>
        <Text style={styles.hoursText}>
          {`${t("SliderContent.hours")}: ${
            box.hour || t("SliderContent.notAvailable")
          }`}
        </Text>
        <Text style={styles.dayText}>
          {`${t("SliderContent.day")}: ${
            box.day || t("SliderContent.notAvailable")
          }`}
        </Text>
      </View>
    ) : (
      <View style={styles.hoursContent}>
        <View style={styles.column}>
          {Object.keys(boxData.hours || {}).map((day, index) => (
            <Text key={index} style={styles.dayText}>
              {box.category === "EventoParaAmigos" ? (
                <Text>{day}</Text>
              ) : (
                <Text>{t(`days.${day.toLowerCase()}`)}</Text>
              )}
            </Text>
          ))}
        </View>
        <View style={styles.column}>
          {Object.keys(boxData.hours || {}).map((day, index) => (
            <Text key={index} style={styles.timeText}>
              {["Cerrado", "Fechado", "Closed"].includes(
                boxData.hours[day]
              )
                ? t("SliderContent.closed")
                : boxData.hours[day] || t("SliderContent.notAvailable")}
            </Text>
          ))}
        </View>
      </View>
    )}
  </View>
</View>


      {/* Tercer Slider: Ubicación o Contacto */}
      <View style={styles.sliderPart}>
        {boxData.address ? (
          <View style={styles.addressContainer}>
            <Text style={styles.addressTitle}>
              {t("SliderContent.location")}
            </Text>
            <Text style={styles.addressText}>
              {boxData.address || t("SliderContent.locationNotAvailable")}
            </Text>
          </View>
        ) : (
          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>
              {t("SliderContent.contact")}
            </Text>
            <TouchableOpacity
            onPress={() => {
              const phoneNumber = boxData.number || boxData.phoneNumber || box.phoneNumber;
              if (phoneNumber) {
                Linking.openURL(`tel:${phoneNumber}`);
              }
            }}> 
            <Text style={[styles.contactText, { textDecorationLine: "underline", color: "white"}]}>
              {boxData.number ||
                boxData.phoneNumber ||
                box.phoneNumber ||
                t("SliderContent.noContactNumber")}
            </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};



const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Definir categorías de pantalla
const isSmallScreen = screenWidth <= 412 && screenHeight <= 850; // Pantallas pequeñas
const isMediumScreen = screenWidth > 412 && screenWidth <= 430 && screenHeight <= 932; // Pantallas medianas

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "white",
    marginBottom: 60,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    textAlign: "center",
  },
  slider: {
    width: width,
    height: 250,
    marginTop: 150,
  },
  sliderPart: {
    width: width * 0.9,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 10,
  },
  mapContainer: {
    width: width * 0.75,
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  hoursContainer: {
    width: "100%",
    alignItems: "center",
  },
  hoursContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  column: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dayText: {
    color: "white",
    fontWeight: "700",
    fontSize: isSmallScreen ? 11 : isMediumScreen ? 12 : 12, // Márgenes dinámicos
    marginBottom: 5,
    textAlign: "right",
    paddingRight: 0,
    marginVertical: 2,
  },
  timeText: {
    color: "white",
    fontWeight: "700",
    fontSize: isSmallScreen ? 11 : isMediumScreen ? 12 : 12, // Márgenes dinámicos
    marginBottom: 5,
    textAlign: "left",
    marginVertical: 2,
    paddingLeft: 0,
  },
  contactContainer: {
    padding: 15,
    alignItems: "center",
    width: "90%",
  },
  contactTitle: {
    color: "white",
    fontSize: isSmallScreen ? 16 : isMediumScreen ? 18 : 18, // Márgenes dinámicos
    fontWeight: "bold",
    marginBottom: 10,
  },
  contactText: {
    color: "white",
    fontSize: isSmallScreen ? 16 : isMediumScreen ? 18 : 18, // Márgenes dinámicos
  },
  descriptionContainer: {
    padding: 15,
    alignItems: "center",
    width: "90%",
  },
  descriptionText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  addressContainer: {
    padding: 15,
    alignItems: "center",
    width: "90%",
  },
  addressTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  addressText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  notificationHours: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  hoursText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
  descriptionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default SliderContent;

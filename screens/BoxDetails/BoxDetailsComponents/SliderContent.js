import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

const SliderContent = ({ box, boxData, isNightMode, isFromNotification, showDescription }) => {
  const [mapRegion, setMapRegion] = useState(null);
  const [markerCoordinate, setMarkerCoordinate] = useState(null);
  const { t } = useTranslation();
  

  useEffect(() => {
    // Reinicia el mapa al cambiar las coordenadas del evento
    if (
      box?.coordinates &&
      typeof box.coordinates.latitude === "number" &&
      typeof box.coordinates.longitude === "number"
    ) {
      const newRegion = {
        latitude: box.coordinates.latitude,
        longitude: box.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setMapRegion(newRegion); // Actualiza la región del mapa
      setMarkerCoordinate({
        latitude: box.coordinates.latitude,
        longitude: box.coordinates.longitude,
      }); // Actualiza la coordenada del marcador
    } else {
      console.warn("Coordenadas inválidas o no disponibles para este evento.");
      setMapRegion(null); // Limpia el mapa si no hay coordenadas
      setMarkerCoordinate(null); // Limpia el marcador si no hay coordenadas
    }
  }, [box]); // Escucha cambios en todo el objeto `box`

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
            <Text style={styles.descriptionTitle}>{t('SliderContent.description')}</Text>
            <Text style={styles.descriptionText}>{boxData.description || t('SliderContent.descriptionNotAvailable')}</Text>
          </View>
        ) : mapRegion ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={(region) => setMapRegion(region)}
            >
              {markerCoordinate && (
                <Marker
                  coordinate={markerCoordinate}
                  title={box?.title || "Evento"}
                  description={box?.description || ""}
                />
              )}
            </MapView>
          </View>
        ) : (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {boxData.description || t('SliderContent.descriptionNotAvailable')}
            </Text>
          </View>
        )}
      </View>

      {/* Segundo Slider: Horarios */}
      <View style={styles.sliderPart}>
        <View style={styles.hoursContainer}>
          {box.category === "EventoParaAmigos" && box.day && box.hour ? (
            <View style={styles.notificationHours}>
              <Text style={styles.hoursText}>{`${t('SliderContent.hours')}: ${box.hour}`}</Text>
              <Text style={styles.dayText}>{`${t('SliderContent.day')}: ${box.day}`}</Text>
            </View>
          ) : isFromNotification && (box.hour || box.day) ? (
            <View style={styles.notificationHours}>
              <Text style={styles.hoursText}>
                {`${t('SliderContent.hours')}: ${box.hour || t('SliderContent.notAvailable')}`}
              </Text>
              <Text style={styles.dayText}>
                {`${t('SliderContent.day')}: ${box.day || t('SliderContent.notAvailable')}`}
              </Text>
            </View>
          ) : (
            <View style={styles.hoursContent}>
              <View style={styles.column}>
                {Object.keys(boxData.hours || {}).map((day, index) => (
                  <Text key={index} style={styles.dayText}>
                    {day}
                  </Text>
                ))}
              </View>
              <View style={styles.column}>
                {Object.values(boxData.hours || {}).map((time, index) => (
                  <Text key={index} style={styles.timeText}>
                    {time}
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
            <Text style={styles.addressTitle}>{t('SliderContent.location')}</Text>
            <Text style={styles.addressText}>
              {boxData.address || t('SliderContent.locationNotAvailable')}
            </Text>
          </View>
        ) : (
          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>{t('SliderContent.contact')}</Text>
            <Text style={styles.contactText}>
              {boxData.number || boxData.phoneNumber || box.phoneNumber || t('SliderContent.noContactNumber')}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

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
      paddingHorizontal: 30,
    },
    dayText: {
      color: "white",
      fontWeight: "600",
      fontSize: 11,
      marginBottom: 5,
      textAlign: "right",
      paddingRight: 0,
    },
    timeText: {
      color: "white",
      fontWeight: "600",
      fontSize: 11,
      marginBottom: 5,
      textAlign: "left",
      paddingLeft: 0,
    },

    contactContainer: {
      padding: 15,
      alignItems: "center",
      width: "90%",
    },
    contactTitle: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
    },
    contactText: {
      color: "white",
      fontSize: 16,
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
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
});

export default SliderContent;

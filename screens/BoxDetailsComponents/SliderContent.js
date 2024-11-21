import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get("window");

const SliderContent = ({ box, boxData, isNightMode, isFromNotification }) => {
  const [mapRegion, setMapRegion] = useState(null);

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

      console.log("Actualizando región del mapa con nuevas coordenadas:", newRegion);
      setMapRegion(newRegion); // Actualiza la región del mapa
    } else {
      console.warn("Coordenadas inválidas o no disponibles para este evento.");
      setMapRegion(null); // Limpia el mapa si no hay coordenadas
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
        {mapRegion ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={(region) => setMapRegion(region)}
            >
              <Marker
                coordinate={{
                  latitude: mapRegion.latitude,
                  longitude: mapRegion.longitude,
                }}
                title={box?.title || "Evento"}
                description={box?.description || ""}
              />
            </MapView>
          </View>
        ) : (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {boxData.description || "Descripción no disponible"}
            </Text>
          </View>
        )}
      </View>

      {/* Segundo Slider: Horarios */}
      <View style={styles.sliderPart}>
        <View style={styles.hoursContainer}>
          {isFromNotification && (box.hour || box.day) ? (
            <View style={styles.notificationHours}>
              <Text style={styles.hoursText}>
                {`Hora: ${box.hour || "No disponible"}`}
              </Text>
              <Text style={styles.dayText}>
                {`Día: ${box.day || "No disponible"}`}
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
            <Text style={styles.addressTitle}>Ubicación:</Text>
            <Text style={styles.addressText}>
              {boxData.address || "Ubicación no disponible"}
            </Text>
          </View>
        ) : (
          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>Contacto:</Text>
            <Text style={styles.contactText}>
              {boxData.number || boxData.phoneNumber || "Sin número de contacto"}
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
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      width: null,
      height: null,
      contentFit: "cover",
    },
    gradient: {
      flex: 1,
      justifyContent: "flex-start",
    },
    scrollViewContent: {
      flexGrow: 1,
      justifyContent: "flex-start",
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    content: {
      alignItems: "center",
      marginTop: 70,
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
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 80,
      marginBottom: 70,
    },
    button: {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 25,
      marginHorizontal: 10,
    },
    activeButton: {
      backgroundColor: "rgba(255, 255, 255, 0.6)",
    },
    buttonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    slider: {
      width: width,
      height: 250,
      marginTop: 60,
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
    hoursTitle: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      textAlign: "center",
      width: "100%",
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
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 40,
      width: "100%",
      position: "absolute",
      top: 0,
      zIndex: 10,
    },
    backButton: {
      paddingLeft: 20,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    menuContainer: {
      backgroundColor: "transparent",
      padding: 20,
      borderRadius: 10,
      alignItems: "center",
    },
    deleteEventButton: {
      backgroundColor: "red",
      padding: 10,
      borderRadius: 5,
    },
    deleteEventText: {
      color: "white",
      fontWeight: "bold",
    },
    editEventButton: {
      backgroundColor: "white", // Puedes cambiar el color según tu preferencia
      padding: 10,
      borderRadius: 5,
      marginBottom: 10, // Espacio entre los botones
    },
    editEventText: {
      color: "black",
      fontWeight: "bold",
    },
    friendsModalContent: {
      backgroundColor: "white",
      padding: 20,
      borderRadius: 15,
      width: "90%",
    },
    friendsModalContentNight: {
      backgroundColor: "#1a1a1a",
    },
    modalTitle: {
      color: "black",
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
    },
    modalTitleNight: {
      color: "white",
    },
    searchInput: {
      height: 40,
      borderColor: "black",
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 10,
      paddingHorizontal: 10,
      color: "#333",
    },
    searchInputNight: {
      borderColor: "black",
      color: "white",
      backgroundColor: "#333",
    },
    friendContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    friendContainerNight: {
      borderBottomColor: "#444",
    },
    friendImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
    },
    friendName: {
      flex: 1,
      fontSize: 16,
      color: "#333",
    },
    friendNameNight: {
      color: "white",
    },
    shareButton: {
      backgroundColor: "black",
      padding: 10,
      borderRadius: 25,
      marginRight: 10,
    },
    shareButtonNight: {
      backgroundColor: "black",
    },
    invitedButton: {
      backgroundColor: "gray",
    },
    closeModalButton: {
      marginTop: 20,
      backgroundColor: "#black",
      padding: 10,
      borderRadius: 10,
      alignItems: "center",
    },
    closeModalButtonNight: {
      backgroundColor: "black",
    },
    closeModalText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    closeModalTextNight: {
      color: "black",
    },
    dotIndicatorContainer: {
      flexDirection: "row",
      paddingHorizontal: 10,
      marginVertical: 20,
      alignItems: "center",
      height: 60,
    },
    descriptionContainer: {
      padding: 15,
      alignItems: "center",
      width: "90%",
    },
    descriptionTitle: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
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

    editModalContent: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      width: '90%',
    },
    editModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 5,
      padding: 10,
      marginBottom: 10,
    },
    datePickerButton: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 5,
      padding: 10,
      marginBottom: 10,
    },
    editModalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 15,
    },
    editModalButton: {
      padding: 10,
      borderRadius: 5,
      width: '45%',
    },
    cancelButton: {
      backgroundColor: '#ccc',
    },
    saveButton: {
      backgroundColor: '#007AFF',
    },
    editModalButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: 'bold',
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
    dayText: {
      fontSize: 16,
      color: "white",
    },
});

export default SliderContent;

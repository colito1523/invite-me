import { Dimensions, StyleSheet, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

const isLargeScreen = width > 500 && height > 900;

export const styles = StyleSheet.create({
    scrollViewContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
    },
    backButton: {
      position: "absolute",
      top: Platform.OS === "ios" ? 60 : 40,
      left: 20,
      zIndex: 10,
    },
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    imageContainer: {
      width: width,
      height: "100%",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "flex-end",
      paddingBottom: 40,
    },
    infoContainer: {
      padding: 20,
    },
    nameContainer: {
      position: "absolute",
      top: 550,
      left: 20,
      right: 20,
      zIndex: 10,
    },
    nameContainerEditing: {
      top: "70%", // Centra verticalmente
      left: "50%", // Centra horizontalmente
      transform: [{ translateX: -width * 0.25 }, { translateY: -height * 0.25 }], // Ajuste para centrar completamente
      alignItems: "center", // Centra el contenido dentro
    },
    nameAndSurnameContainer: {
      marginBottom: 10,
    },
    nameAndSurnameContainerEditing: {
      flexDirection: "row", // Muestra nombre y apellido en la misma línea
      gap: 10, // Espacio entre los campos de nombre y apellido
    },
    friendCountContainer: {
      alignItems: "flex-start",
    },
    text: {
      fontSize: 25,
      fontWeight: "bold",
      color:"white",
    },
    editableText: {
      fontSize: 25,
      fontWeight: "bold",
      color:"white",
      paddingBottom: 5,
    },
    editableTextEditing: {
      textAlign: "center", // Alinea el texto en el centro del campo en modo edición
    },
    friendsText: {
      fontSize: 28,
      color: "#fff",
      fontWeight: "bold",
    },
    spacer: {
      height: 150,
    },
    editableFieldContainer: {
      marginBottom: 15,
    },
    fieldLabel: {
      color: "#fff",
      fontSize: 14,
      marginBottom: 5,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      marginBottom: 10,
      gap: 10,
    },
    button: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      margin: 5,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    menuContainer: {
      position: "absolute",
      top: Platform.OS === "ios" ? 80 : 40,
      right: 20,
      zIndex: 10,
    },
    menuContent: {
      marginTop: 60, // Ajusta este valor para mover las opciones del menú hacia abajo
      borderRadius: 10,
    },
    photoEditorContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 20,
    },
    photoContainer: {
      alignItems: "center",
      marginHorizontal: 5,
    },
    photoThumbnail: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    emptyPhoto: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#ccc",
    },
    photoButton: {
      marginTop: 5,
      padding: 5,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 10,
    },
    photoButtonText: {
      color: "#fff",
      fontSize: 12,
    },
    saveButton: {
      backgroundColor: "black",
      padding: 10,
      borderRadius: 20,
      alignSelf: "center",
      marginTop: 20,
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
    },
    ovalContainer: {
      marginTop: 20,
      marginBottom: 20,
      flexDirection: "row",
      justifyContent: "space-evenly",
      gap: 10,
    },
    centerOvalContainer: {
      alignItems: "center",
    },
    oval: {
      width: "45%",
      height: 45,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    ovalText: {
      color: "white",
      fontSize: 14,
      fontWeight: "bold",
    },
    ovalInput: {
      color: "#000",
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
    },
    contentWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    ovalAndIconsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    ovalWrapper: {
      flex: 1,
    },
    iconsContainer: {
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginLeft: 10,
      gap: 10,
    },
    iconButton: {
      borderRadius: 20,
      padding: 10,
      marginBottom: 10,
    },
    heartCountText: {
      color: "white",
      fontSize: 16,
      marginTop: 5,
      textAlign: "center",
    },
  });
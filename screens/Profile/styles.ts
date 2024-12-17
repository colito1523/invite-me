import { Dimensions, StyleSheet, Platform } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Definir categorías de pantalla
const isSmallScreen = screenWidth <= 411 && screenHeight <= 837; // Pantallas pequeñas
const isMediumScreen = screenWidth > 411 && screenWidth <= 430 && screenHeight <= 932; // Pantallas medianas
const isLargeScreen = screenWidth > 430 || screenHeight > 932; // Pantallas grandes

export const styles = StyleSheet.create({
    scrollViewContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
    },
    backButton: {
      position: "absolute",
      top: Platform.OS === "ios" ? 80 : 40,
      left: 20,
      zIndex: 10,
      
    },
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    imageContainer: {
      width: screenWidth,
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
      top: isSmallScreen ? 550 : isMediumScreen ? 580 : 80, // Márgenes dinámicos
      left: 20,
      right: 20,
      zIndex: 10,
    },
    nameContainerEditing: {
      top: "70%", // Centra verticalmente
      left: "50%", // Centra horizontalmente
      transform: [{ translateX: -screenWidth * 0.25 }, { translateY: -screenHeight * 0.25 }], // Ajuste para centrar completamente
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
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-evenly",
      gap: 10,
    },
    centerOvalContainer: {
      alignItems: "center",
    },
    oval: {
      width: "42%",
      height: 40,
      backgroundColor: "rgba(255, 255, 255, 0.5)",
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    ovalText: {
      color: "#fff",
    fontSize: 16,
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
      marginBottom:isSmallScreen ? 0 : isMediumScreen ? 80 : 120, // Márgenes dinámicos
    },
    iconsContainer: {
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginRight: 10,
      gap: 10,
      marginBottom: isSmallScreen ? 0 : isMediumScreen ? 50 : 120,
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
    iconShadow: {
      shadowColor: "white",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5, // Para sombras en Android
    },
  });
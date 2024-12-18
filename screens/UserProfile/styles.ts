import { Dimensions, StyleSheet, Platform } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Definir categorías de pantalla
const isSmallScreen = screenWidth <= 411 && screenHeight <= 850; // Pantallas pequeñas
const isMediumScreen = screenWidth > 411 && screenWidth <= 430 && screenHeight <= 932; // Pantallas medianas


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
    scrollViewHorizontal: {
      // This can be left empty as it's not needed for fixing the white space issue
    },
    imageContainer: {
      width: screenWidth,
      height: "100%",
    },
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
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
      top: isSmallScreen ? 510 : isMediumScreen ? 530 : 700, // Márgenes dinámicos
      left: 20,
      right: 20,
      zIndex: 10,
    },
    name: {
      fontSize: isSmallScreen ? 19 : isMediumScreen ? 25 : 30, // Márgenes dinámicos
      fontWeight: "bold",
      color: "white",
    },
    friendCountText: {
      fontSize: isSmallScreen ? 19 : isMediumScreen ? 28 : 30, // Márgenes dinámicos
      color: "white",
      fontWeight: "bold",
      marginTop: 5,
    },
    spacer: {
      height: 150,
    },
    friendCountContainer: {
      alignItems: "flex-start",
      marginTop: 20,
      marginBottom: 20,
    },
    mutualFriendsContainer: {
      alignItems: "flex-start",
      marginTop: 15,
      marginBottom: 20,
    },
    number: {
      fontSize: 24,
      color: "#fff",
      fontWeight: "bold",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      marginBottom: 5,
      gap: 10,
    },
    button: {
      width: "42%",
      height: 40,
      backgroundColor: "rgba(255, 255, 255, 0.5)",
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: isSmallScreen ? 10 : isMediumScreen ? 20 : 40, // Diferentes márgenes según la categoría
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
      marginTop: 60, // Ajusta este valor para mover el menú hacia abajo
      borderRadius: 10,
    },
    menuStyle: {
      borderRadius: 10,
    },
    ovalContainer: {
      marginTop: 20,
      marginBottom: 20,
      flexDirection: "row",
      justifyContent: "space-evenly",
      gap: 30,
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
      color: "white",
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 15 : 20, // Márgenes dinámicos
      fontWeight: "bold",
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
      gap: 20,
    },
    iconButton: {
      borderRadius: 20,
      padding: 10,
      marginBottom: 10,
    },
    mutualFriendIm: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: -15,
      borderWidth: 2,
      borderColor: "white",
    },
    mutualFriendImagesContainer: {
      flexDirection: "row",
      position: "relative",
      height: 40,
    },
    mutualFriendImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      position: "absolute",
    },
    mutualFriendMoreText: {
      color: "white",
      fontSize: 14,
      marginLeft: 10,
    },
    noMutualFriendsText: {
      color: "white",
      fontSize: 14,
    },
    heartCountText: {
      color: "white",
      fontSize: 16,
      marginTop: 5,
      textAlign: "center",
    },
  });
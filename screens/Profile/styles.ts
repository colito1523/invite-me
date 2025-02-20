import { Dimensions, StyleSheet, Platform } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    backgroundColor: "red",
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? "10%" : "5%",
    left: "5%",
    zIndex: 10,
  },
  backgroundImage: {
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
  },
  imageContainer: {
    width: screenWidth,
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingBottom: screenHeight * 0.05, // 5% del alto
  },
  infoContainer: {
    padding: screenWidth * 0.05, // 5% del ancho
  },
  nameContainer: {
    position: "absolute",
    top: "68%", // Valor porcentual único para todas las pantallas
    left: "5%",
    right: "5%",
    zIndex: 10,
  },
  nameContainerEditing: {
    position: "absolute",
    top: "100%", // Centra verticalmente
    left: "50%", // Centra horizontalmente
    transform: [
        { translateX: -screenWidth * 0.5 }, // Mueve la mitad del ancho hacia la izquierda
        { translateY: -screenHeight * 0.5 } // Mueve la mitad del alto hacia arriba
    ],
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
},

  nameAndSurnameContainer: {
    marginBottom: screenHeight * 0.01,
  },
  nameAndSurnameContainerEditing: {
    flexDirection: "row",
    gap: screenWidth * 0.02,
  },
  friendCountContainer: {
    alignItems: "flex-start",
  },
  text: {
    fontSize: screenWidth * 0.065, // Aproximadamente 7% del ancho
    fontWeight: "bold",
    color: "white",
  },
  editableText: {
    fontSize: screenWidth * 0.065, // Aproximadamente 7% del ancho
    fontWeight: "bold",
    color: "white",
    paddingBottom: screenHeight * 0.005,
  },
  editableTextEditing: {
    textAlign: "center",
  },
  friendsText: {
    fontSize: screenWidth * 0.060, // Aproximadamente 7% del ancho
    color: "#fff",
    fontWeight: "bold",
  },
  spacer: {
    height: screenHeight * 0.2,
  },
  editableFieldContainer: {
    marginBottom: screenHeight * 0.02,
  },
  fieldLabel: {
    color: "#fff",
    fontSize: screenWidth * 0.04,
    marginBottom: screenHeight * 0.01,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: screenHeight * 0.01,
    gap: screenWidth * 0.03,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: screenWidth * 0.05,
    margin: screenWidth * 0.013,
  },
  buttonText: {
    color: "#fff",
    fontSize: screenWidth * 0.04,
    fontWeight: "bold",
  },
  menuContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? "10%" : "5%",
    right: "5%",
    zIndex: 10,
  },
  menuContent: {
    marginTop: screenHeight * 0.08,
    borderRadius: screenWidth * 0.03,
  },
  photoEditorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: screenHeight * 0.03,
  },
  photoContainer: {
    alignItems: "center",
    marginHorizontal: screenWidth * 0.013,
  },
  photoThumbnail: {
    width: screenWidth * 0.16,
    height: screenWidth * 0.16,
    borderRadius: screenWidth * 0.08,
  },
  emptyPhoto: {
    width: screenWidth * 0.16,
    height: screenWidth * 0.16,
    borderRadius: screenWidth * 0.08,
    backgroundColor: "#ccc",
  },
  photoButton: {
    marginTop: screenHeight * 0.008,
    padding: screenWidth * 0.013,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: screenWidth * 0.026,
  },
  photoButtonText: {
    color: "#fff",
    fontSize: screenWidth * 0.032,
  },
  saveButton: {
    backgroundColor: "black",
    padding: screenWidth * 0.026,
    borderRadius: screenWidth * 0.05,
    alignSelf: "center",
    marginTop: screenHeight * 0.03,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: screenWidth * 0.04,
  },
  ovalContainer: {
    marginTop: screenHeight * 0.03,
    marginBottom: screenHeight * 0.015,
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: screenWidth * 0.03,
  },
  centerOvalContainer: {
    alignItems: "center",
  },
  oval: {
    width: "42%",
    height: screenHeight * 0.045,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: screenWidth * 0.05,
    justifyContent: "center",
    alignItems: "center",
  },
  ovalText: {
    color: "#fff",
    fontSize: screenWidth * 0.04,
    fontWeight: "bold",
  },
  ovalInput: {
    color: "#000",
    fontSize: screenWidth * 0.035,
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
    marginBottom: screenHeight * 0.0, // Valor constante en porcentajes
  },
  iconsContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginRight: screenWidth * 0.026,
    gap: screenWidth * 0.026,
    marginBottom: screenHeight * 0.00, // Valor constante en porcentajes
  },
  iconButton: {
    borderRadius: screenWidth * 0.05,
    padding: screenWidth * 0.026,
    marginBottom: screenWidth * 0.026,
  },
  heartCountText: {
    color: "white",
    fontSize: screenWidth * 0.04,
    marginTop: screenHeight * 0.005,
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
    elevation: 5,
  },
});

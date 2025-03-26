import { StyleSheet, Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Contenedor que envuelve la imagen y será "capturado"
  viewShotContainer: {
    width: screenWidth,
    height: screenHeight,
    position: 'absolute',
    backgroundColor: "black"
  },
  previewImage: {
    width: screenWidth,
    height: screenHeight,
    alignSelf: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight,
    alignSelf: 'center',
    position: 'absolute',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  downloadButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  uploadButton: {
    position: "absolute",
    bottom: 42,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "black",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 15,
  },
  viewOnceToggle: {
    position: "absolute",
    bottom: 50,
    left: 30,
  },
  viewOnceButton: {
  position: "absolute",
  bottom: 42,
  left: 10,
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 25,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
},
viewOnceText: {
  color: "black",
  fontSize: 13,
  fontWeight: "bold",
},

});
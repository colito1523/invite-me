import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: "white",
      marginVertical: 40,
    },
    backButton: {
      marginRight: 15,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      color: "white",
      flex: 1,
    },
    username: {
      fontSize: 20,
      fontWeight: "bold",
      color: "white",
    },
    message: {
      padding: 10,
      borderRadius: 20,
      marginVertical: 8,
      maxWidth: "80%",
      flexDirection: "column",
      alignSelf: "flex-start", // Cambia dinámicamente con sent/received
      backgroundColor: "rgba(240, 240, 240, 1)",
    },
    iconButtonGaleria: {
      marginRight: 10,
      marginLeft: 7,
    },
    iconButtonCamera: {
      backgroundColor: "#3e3d3d",
      padding: 7,
      borderRadius: 20,
    },
    sent: {
      alignSelf: "flex-end",
      backgroundColor: "transparent",
      fontWeight: "bold",
    },
    uploadingMessage:{
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
    timeText: {
      fontSize: 10, // Reduce el tamaño
      color: "#888", // Color más tenue
      fontWeight: "bold",
    },
  
    received: {
      alignSelf: "flex-start",
      backgroundColor: "transparent",
      fontWeight: "bold",
    },
    messageFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end", // Alinea el contenido hacia la derecha
      marginTop: 5,
      gap: "20px",
    },
    emojiMessage: {
      backgroundColor: "transparent",
      padding: 0,
    },
    seenIcon: {
      marginLeft: 7, // Ajusta el espacio entre el horario y el ícono
    },
    messageText: {
      marginTop: 20,
      color: "#262626",
      fontSize: 14,
      padding: 10,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      fontWeight: "bold",
    },
    messageTextNotas: {
      color: "#262626",
      fontSize: 14,
      padding: 10,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      fontWeight: "bold",
    },
    emojiText: {
      fontSize: 40,
    },
    messageImage: {
      width: 200,
      height: 150,
      borderRadius: 10,
    },
    messageVideo: {
      width: 200,
      height: 200,
      borderRadius: 10,
    },
    containerIg: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 25,
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginHorizontal: 10,
      marginBottom: 20,
    },
    input: {
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
      color: "#000",
    },
    sendButton: {
      backgroundColor: "#3e3d3d",
      borderRadius: 50,
      padding: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    modalBackground: {
      flex: 1,
      backgroundColor: "black",
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenMedia: {
      width: "100%",
      height: "80%",
      resizeMode: "contain",
    },
    playButtonOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    uploadingContainer: {
      padding: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderRadius: 10,
      marginVertical: 8,
    },
    uploadingText: {
      marginTop: 10,
      fontSize: 14,
      color: "#333",
    },
    noteResponseContainer: {
      borderRadius: 18,
      padding: 12,
      marginVertical: 5,
      backgroundColor: "transparent",
      flexDirection: "column",
      alignItems: "center",
    },
    noteResponseText: {
      fontSize: 14,
      color: "#ffffff",
      fontWeight: "bold",
      marginBottom: 10,
    },
    noteContent: {
      backgroundColor: "red",
      borderRadius: 12,
      padding: 8,
      marginTop: 5,
      marginBottom: 5,
    },
    arrowIcon: {
      marginBottom: 10,
    },
    originalNoteText: {
      marginTop: 40,
      color: "white",
      fontSize: 12,
      padding: 7,
      borderRadius: 20,
      backgroundColor: "rgba(128, 128, 128, 0.8)",
      marginBottom: 20,
    },
    arrowImageSent: {
      width: 35,
      height: 35,
      transform: [{ rotate: "140deg" }],
      position: "absolute",
      left: 140,
      top: 50,
    },
    arrowImageReceived: {
      width: 35,
      height: 35,
      transform: [{ rotate: "-140deg" }, { scaleX: -1 }],
      marginLeft: 0,
      right: 130,
      top: 50,
      position: "absolute",
    },
    storyResponseContainer: {
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.8",
      borderRadius: 18,
      padding: 12,
      marginVertical: 5,
    },
    storyResponseImage: {
      width: 80,
      height: 150,
      borderRadius: 8,
      marginRight: 12,
    },
    storyResponseContent: {
      flex: 1,
    },
    storyResponseText: {
      fontSize: 14,
      color: "#ffffff",
      fontWeight: "bold",
      marginBottom: 10,
    },
    menuContainer: {
      borderRadius: 20,
    },
    menuItemText: {
      fontWeight: "bold",
      color: "#4b4b4b",
      fontSize: 13,
      textAlign: "center",
      borderRadius: 20,
    },
    menuItemContainer: {
      marginVertical: 0,
    },
    normalImageContainer: {
      borderRadius: 10,
      overflow: "hidden",
    },
  
    viewOnceImagePlaceholder: {
      width: 70,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 30,
      backgroundColor: "rgba(0, 0, 0, 0.8)", // Background color for view once images
    },
    imageNotViewed: {
      backgroundColor: "rgba(240, 240, 240, 1)",
    },
    imageViewed: {
      backgroundColor: "rgba(240, 240, 240, 1)",
    },
  
    viewOnceVideoPlaceholder: {
      width: 200,
      height: 150,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
    },
  
    imageStatusText: {
      color: "black",
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
    },
  
    viewOnceText: {
      color: "white",
      marginTop: 5,
      fontSize: 12,
    },
    noBackground: {
      backgroundColor: "transparent", // Fondo transparente para imágenes
    },
    dateContainer: {
      alignItems: "center",
      marginVertical: 10,
    },
    dateText: {
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      color: "#000",
      fontWeight: "bold",
      padding: 5,
      borderRadius: 10,
    },
  
    imageUnavailableContainer: {
      width: 200,
      height: 150,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: 10,
    },
    imageUnavailableText: {
      color: "white",
      fontSize: 14,
      textAlign: "center",
      fontWeight: "bold",
    },

    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      width: "80%",
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
      textAlign: "center",
    },
    modalOption: {
      width: "100%",
      padding: 12,
      alignItems: "center",
    },
    modalText: {
      fontSize: 16,
      color: "#333",
    },
    
});

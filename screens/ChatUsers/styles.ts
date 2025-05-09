import { StyleSheet, Platform } from "react-native";

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
      marginBottom: 0,
      marginTop: Platform.OS === "ios" ? 60 : 45, 
    },
    backButton: {
      marginRight: 15,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      color: "white",
      flex: 1,
      gap: 10,
    },
    profileImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#ccc",
    },
    username: {
      fontSize: 20,
      fontWeight: "bold",
      color: "white",
    },
    message: {
      padding: 10,
      borderRadius: 20,
      marginVertical: 0,
      maxWidth: "80%",
      flexDirection: "column",
      alignSelf: "flex-start", 
      backgroundColor: "rgba(240, 240, 240, 1)",
    },

    replyBoxContainer: {
      backgroundColor: "#F8F8F8",
      borderRadius: 12,
      padding: 6,
      marginBottom: 4,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 0.5,
      borderColor: "#EFEFEF",
    },
    replyIndicator: {
      width: 2.5,
      height: "70%",
      backgroundColor: "#ebddd5",
      borderRadius: 4,
      marginRight: 10,
    },
    replyingToText: {
      fontSize: 11,
      color: "#8E8E8E",
      marginBottom: 2,
    },
    replyText: {
      color: "#262626",
      fontSize: 13,
      fontWeight: "500",
    },
    imageContainer: {
      position: 'relative',
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loader: {
      position: 'absolute',
      zIndex: 1,
    },
    viewOnceContainer: {
      width: 40,
      height: 40,
      backgroundColor: "#F0F0F0",
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewOnceReplyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderRadius: 6,
      gap: 8,
    },
    viewOnceReplyText: {
      color: '#8E8E8E',
      fontSize: 12,
    },
    replyImagePreview: {
      width: 40,
      height: 40,
      borderRadius: 6,
    },
    replyBoxHeader: {
      fontSize: 11,
      color: "#757575",
    },
    replyBoxText: {
      fontSize: 13,
      color: "#333",
      marginTop: 2,
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
      fontSize: 10, 
      color: "#888", 
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
      justifyContent: "flex-end", 
      marginTop: 5,
      gap: "20px",
    },
    emojiMessage: {
      backgroundColor: "transparent",
      padding: 0,
    },
    seenIcon: {
      marginLeft: 7, 
    },
    messageText: {
      marginTop: 0,
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
    videoThumbnailContainer: {
      position: 'relative',
    },
    playIconOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 10,
    },
    containerIg: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 25,
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginHorizontal: 0,
      marginBottom: Platform.OS === "ios" ? 20 : 10, 
    },
    input: {
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
      color: "#000",
      maxHeight: 100,
      minHeight: 40,
      paddingTop: 10,
      paddingBottom: 10,
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
    },
    mediaContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenMedia: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
    videoControlsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 40,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    playButton: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{translateX: -25}, {translateY: -25}],
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    progressBar: {
      width: '100%',
      height: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progress: {
      height: '100%',
      backgroundColor: '#fff',
    },
    closeModalButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 1,
      padding: 10,
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
      color: "gray",
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
      marginBottom: 10,
   
    },
    storyResponseContent: {
      flex: 1,
    },
    storyResponseText: {
      fontSize: 14,
      color: "gray",
      fontWeight: "bold",
      marginBottom: 10,
    },
    menuContainer: {
      borderRadius: 20,
      marginTop: Platform.OS === "ios" ? 0 : 60, 
      
    },
    menuItemText: {
      fontWeight: "bold",
      color: "#4b4b4b",
      fontSize: 13,
      textAlign: "center",
      borderRadius: 20,
    },
    normalImageContainer: {
      borderRadius: 10,
      overflow: "hidden",
    },
  
    viewOnceImagePlaceholder: {
      width: 70,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 30,
      backgroundColor: "rgba(0, 0, 0, 0.8)", 
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
      backgroundColor: "transparent", 
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
    unreadHeader: {
      backgroundColor: '#f0f0f0',
      padding: 10,
      marginBottom: 10,
      borderRadius: 8,
      marginHorizontal: 15,
      marginTop: 10,
    },
    unreadText: {
      color: '#333',
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    videoContainer: {
      flex: 1,
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: 'black',
    },
    fullScreenTouchable: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    replyAction: {
      
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      height: '100%',
    },
    replyContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f0f0f0",
      padding: 10,
      marginHorizontal: 10,
      borderRadius: 8,
      marginBottom: 5,
    },
    replyContent: {
      flex: 1,
      marginRight: 10,
    },
    replyUsername: {
      fontWeight: "bold",
      color: "#666",
      fontSize: 12,
    },
});

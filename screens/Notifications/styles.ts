import { StyleSheet } from "react-native";



export const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      padding: 16,
    },
    notificationContainer: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderBottomWidth: 2,
      borderBottomColor: "#ccc",
    },
    timeContainer: {
      alignItems: "center",
      marginBottom: 8,
    },
    timeText: {
      fontSize: 12,
      fontWeight: "bold",
    },
    notificationContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 16,
    },
    textContainer: {
      flex: 1,
    },
    notificationText: {
      fontSize: 16,
      lineHeight: 22,
    },
    boldText: {
      fontWeight: "bold",
      marginBottom: 4,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      marginTop: 10,
    },
    acceptButton: {
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginRight: 8,
    },
    rejectButton: {
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      textAlign: "center",
    },
    notificationImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: 10,
    },
    eventDateText: {
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 10,
    },
    button: {
      backgroundColor: "#d3d3d3",
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginRight: 8,
    },
  });
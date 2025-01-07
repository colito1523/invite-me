import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    marginHorizontal: 15,
    paddingHorizontal: 10,
    marginBottom: 15,
    height: 43,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 15,
    marginVertical: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
    marginBottom: 10,
  },
  dotsIcon: {
    marginLeft: 10,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25, // La imagen también debe ser redonda
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userImageContainer: {
    marginRight: 15, // Se aplica siempre
  },

  storyIndicator: {
    borderWidth: 2,
    borderRadius: 30, // Ajusta para que el contenedor sea redondo
  },

  unseenCountContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  unseenCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  submitButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonText: {
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  timeAndUnreadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadCountContainer: {
    backgroundColor: "black",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  unreadCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  lastMessageTime: {
    fontSize: 13,
  },
  lastMessagePreview: {
    fontSize: 14,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: "black",
  },
  selectionModeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  selectionModeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
  },
  selectionModeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  muteOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  muteOption: {
    padding: 10,
    borderRadius: 5,
  },
  muteOptionText: {
    fontWeight: "bold",
  },
  selectAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
    alignSelf: "center",
    width: "50%",
  },
  selectAllText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export const lightTheme = {
  background: "#fff",
  text: "#333",
  textSecondary: "#666",
  inputBackground: "#f5f5f5",
  placeholder: "#4b4b4b",
  icon: "#3e3d3d",
  borderColor: "#bbb7b7",
  noteBackground: "rgba(128, 128, 128, 0.7)",
  sendButtonBackground: "rgba(0, 0, 0, 5)",
  sendButtonIcon: "white",
  moodOptionsBackground: "rgba(255, 255, 255, 0.9)",
  noteResponseBackground: "white",
  modalBackground: "white",
  submitButtonBackground: "#b5a642",
  submitButtonText: "white",
  cancelButtonText: "#b5a642",
  buttonBackground: "rgba(255, 255, 255, 255)",
  buttonText: "#4b4b4b",
  muteOptionsBackground: "#",
  muteOptionBackground: "#3e3d3d",
  muteOptionText: "#fff",
  selectionModeBackground: "#f0f0f0",
  selectionModeButtonBackground: "rgba(255, 255, 255, 255)",
  selectionModeButtonText: "#4b4b4b",
};

export const darkTheme = {
  background: "#000",
  text: "#fff",
  textSecondary: "#ccc",
  inputBackground: "#1a1a1a",
  placeholder: "white",
  icon: "#fff",
  borderColor: "#444",
  noteBackground: "rgba(64, 64, 64, 0.7)",
  sendButtonBackground: "rgba(255, 255, 255, 0.5)",
  sendButtonIcon: "black",
  moodOptionsBackground: "rgba(0, 0, 0, 0.9)",
  noteResponseBackground: "#1a1a1a",
  modalBackground: "#1a1a1a",
  submitButtonBackground: "black",
  submitButtonText: "black",
  cancelButtonText: "black",
  buttonBackground: "rgba(255, 255, 255, 0.2)",
  buttonText: "#fff",
  muteOptionsBackground: "#",
  muteOptionBackground: "#000",
  muteOptionText: "white",
  selectionModeBackground: "",
  selectionModeButtonBackground: "rgba(255, 255, 255, 0.2)",
  selectionModeButtonText: "#fff",
};
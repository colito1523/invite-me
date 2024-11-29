import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    top: 90,
    left: 30,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  imagePicker: {
    width: width * 0.9,
    height: width * 0.6,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 30,
    paddingHorizontal: 15,
    marginBottom: 15,
    paddingLeft: 35,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 15,
  },
  dateTimeContainer: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  dateTimeButton: {
    borderRadius: 10,
    padding: 15,
    width: "100%",
    marginBottom: 10,
    alignItems: "center",
  },
  dateTimeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  dateTimeText: {
    fontSize: 16,
  },
  friendsList: {
    width: "100%",
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  selectedFriendItem: {
    backgroundColor: "#e0e0e0",
  },
  friendImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  friendName: {
    fontSize: 16,
  },
  submitButton: {
    borderRadius: 10,
    padding: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  friendsContainer: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 15,
  },
  modalButtonText: {
    fontWeight: "bold",
    textAlign: "center",
  },
});

export const lightTheme = {
  background: "#fff",
  text: "black",
  textSecondary: "#666",
  inputBackground: "white",
  placeholder: "#999",
  icon: "black",
  buttonBackground: "white",
};

export const darkTheme = {
  background: "#000",
  text: "#fff",
  textSecondary: "#ccc",
  inputBackground: "#1a1a1a",
  placeholder: "#666",
  icon: "white",
  buttonBackground: "#333",
};

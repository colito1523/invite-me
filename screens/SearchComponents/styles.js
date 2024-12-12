import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bbb7b7",
    borderRadius: 20,
    marginHorizontal: 15,
    paddingHorizontal: 10,
    width: "100%",
    alignSelf: "center",
    marginBottom: 15,
    height: 43,
  },
  searchIcon: {
    marginRight: 10,
    color: "#3e3d3d",
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginVertical: 15,
    letterSpacing: 1,
    color: "#4d4d4d",
  },
  sectionSeparator: {
    height: 40,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  historyTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
  },
  fullName: {
    fontSize: 14,
  },
  addFriendButton: {
    padding: 8,
    borderRadius: 5,
  },
  unseenStoryCircle: {
    borderWidth: 2,
    borderColor: "red", // Color para destacar que hay historias
    borderRadius: 30, // Hace que el contenedor sea circular
    padding: 5, // Espaciado alrededor del círculo
  },
});

export const lightTheme = {
  background: "#fff",
  text: "black",
  textSecondary: "#666",
  inputBackground: "#f5f5f5",
  placeholder: "#999",
  icon: "black",
  buttonBackground: "#f0f0f0",
};

export const darkTheme = {
  background: "#000",
  text: "#fff",
  textSecondary: "#ccc",
  inputBackground: "#1a1a1a",
  placeholder: "#666",
  icon: "black",
  buttonBackground: "#333",
};

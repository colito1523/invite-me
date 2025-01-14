import { StyleSheet, Platform, Dimensions } from "react-native";
const { width } = Dimensions.get("window");

export const dayStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  headerContainer: {
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    color: "black",
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === 'ios' ? 40 : 10,
    paddingTop: Platform.OS === 'ios' ? 15 : 10,
    backgroundColor:"#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    width: "100%",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "black",
    fontSize: 16,
    marginTop: 10,
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
  },
  unreadIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export const nightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  headerContainer: {
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderBottomWidth: 0,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    color: "white",
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === 'ios' ? 40 : 10,
    paddingTop: Platform.OS === 'ios' ? 15 : 10,
    backgroundColor:"black",
    borderTopWidth: 1,
    borderTopColor: "black",
    width: "100%",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    marginTop: 10,
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
  },
  unreadIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export const styles = StyleSheet.create({
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "red",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  calendarPicker: {
    flex: 1,
  },
  sectionContainer: {
    width: "100%",
    marginTop: 30
  },
  boxContainer: {
    marginBottom: 15,
    width: "100%",
    position: "relative",
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "gray", // Puedes cambiar esto si usas colores nocturnos o diurnos
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
  },
  unreadIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

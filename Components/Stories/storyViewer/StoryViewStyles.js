import { StyleSheet, Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  storyContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  rotatedImage: {
    transform: [{ rotate: "90deg" }],
  },

  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999, // encima de la historia actual
    backgroundColor: 'red',
  },
  
  progressBar: {
    marginTop: 10,
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 2,
  },
  progress: {
    height: "100%",
    backgroundColor: "white",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "black",
  },
  rotatedImage: {
    transform: [{ rotate: "90deg" }],
  },

  userInfo: {
    position: "absolute",
    top: 20,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  username: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  rightInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeAgo: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginRight: 10,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    padding: 20,
  },
  leftButton: {
    left: 0,
  },
  rightButton: {
    right: 0,
  },
  messageContainer: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  messageInput: {
    flex: 1,
    color: "white",
    paddingVertical: 15,
    fontSize: 16,
  },
  iconButton: {
    padding: 10,
  },
  viewersButton: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  viewersModalContainer: {
    backgroundColor: "rgba(225, 225, 225, 0.99)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: "80%",
  },
  viewersModalContent: {
    flex: 1,
  },
  viewersModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 20,
    marginRight: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: "90%",
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
  },
  searchInputDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#333333",
    marginHorizontal: 8,
  },
  searchInputCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  deleteButton: {
    padding: 4,
    marginBottom: 10,
  },
  viewersTitle: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    paddingLeft: 10,
  },
  viewerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  viewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  viewerName: {
    flex: 1,
    fontSize: 16,
  },
  likeIcon: {
    marginRight: 10,
  },
  viewerEditButton: {
    padding: 5,
    marginRight: 5,
  },
  dotsButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  optionsModalContainer: {
    backgroundColor: "transparent",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: 50,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
  },
  optionButton: {
    padding: 10,
    marginVertical: 5,
  },
  optionButtonText: {
    fontSize: 16,
    color: "red",
  },
  sendConfirmation: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendConfirmationText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  simpleModalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "80%",
  },
  simpleModalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  modalOverlay2: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default styles;
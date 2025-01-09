import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  sliderContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
    alignItems: "center",
    marginVertical: 10,
    marginBottom: 30,
  },
  addStoryCircle: {
    marginRight: 10,
  },
  centeredAddStoryCircle: {
    justifyContent: "center",
  },
  storyImageWrapper: {
    marginHorizontal: 5,
    padding: 2,
  },
  storyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    borderWidth: 2, // Added borderWidth
    borderColor: "transparent", // Default border color, can be dynamically set
  },
  unseenStoryCircle: {
    borderWidth: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  uploadingStoryContainer: {
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircle: {
    position: "absolute",
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  rejectIconContainer: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  acceptButtonContainer: {
    position: "absolute",
    bottom: 40,
    right: 10,
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButtonText: {
    color: "rgba(0, 0, 0, 0.6)",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 15,
  },
});

export default styles;
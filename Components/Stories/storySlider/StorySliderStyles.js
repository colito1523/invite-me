import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
  sliderContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
    alignItems: "center",
    marginTop: 10,
  },
  addStoryCircle: {
    marginRight: 25,
    marginBottom:25,
    marginLeft:10
  },
  centeredAddStoryCircle: {
    justifyContent: "center",
    alignItems: "center", // Asegura alineación vertical
    width: 70, // Igual a storyCircle
    height: 70, // Igual a storyCircle
  },
  storyImageWrapper: {
    marginHorizontal: 3,
    marginBottom: 20,
    padding: 1,
  },
  loadingPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  storyCircle: {
    width: 70,
    height: 70,
    borderRadius: 40,
    overflow: "hidden",
    position: "relative", // Añadir esta línea para posicionar el ícono "+" correctamente
  },
  storyImage: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "transparent",
  },
  storyImageWithBorder: {
    borderWidth: 2,
    borderColor: "black",
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

  addIconOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "black",
    borderRadius: 12,
    padding: 2,
    zIndex: 10,
  },
  storyCircleWrapper: {
    position: "relative",
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  
})

export default styles

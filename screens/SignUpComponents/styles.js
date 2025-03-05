import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const ITEM_WIDTH = width / 5;
const ITEM_HEIGHT = 50;
const GENDER_ITEM_HEIGHT = 50;
const GENDER_CONTAINER_WIDTH = width * 0.6;

export default StyleSheet.create({
  ageSelectorContainer: {
    width: ITEM_WIDTH * 3,
    height: ITEM_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
    position: "relative",
  },
  scrollContainer: {
    backgroundColor: "white",
    flexGrow: 1,
    padding: 20,
    paddingTop: 60, // Add this line to increase the top padding
  },
  logo: {
    width: 200,
    height: 50,
    alignSelf: "center",
    marginTop: 50,
    marginBottom: 5,
  },
  progressBar: {
    height: 5,
    borderRadius: 5,
    marginVertical: 0,
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#c8c8c8",
  },
  question: {
    fontSize: 15,
    marginVertical: 65,
    textAlign: "center",
    color: 'black', // Texto en blanco
  },
  ageQuestion: {
    fontSize: 14,
    marginTop: 65,
    marginBottom: 35,
    textAlign: "center",
    color: "#333333", // Change to a lighter shade of black
    fontWeight: "bold",
  },
  GenderQuestion: {
    fontSize: 14,
    marginVertical: 20,
    marginTop: 110,
    textAlign: "center",
    color: "#333333", // Change to a lighter shade of black
    fontWeight: "bold",
  },
  questionHobies: {
    fontSize: 14,
    marginTop: 0,
    marginBottom: 35,
    textAlign: "center",
    color: "#333333", // Change to a lighter shade of black
    fontWeight: "bold",
  },
  questionInterests: {
    fontSize: 14,
    marginTop: 30,
    marginBottom: 35,
    textAlign: "center",
    color: "#333333", // Change to a lighter shade of black
    fontWeight: "bold",
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  nameInput: {
    width: "48%",
    padding: 10,
    borderRadius: 30,
    fontSize: 15,
    marginBottom: 20,
    backgroundColor: "rgba(239, 232, 228, 0.7)",
    paddingLeft: 25,
  },
  input: {
    padding: 10,
    marginBottom: 40,
    borderRadius: 30,
    fontSize: 15,
    backgroundColor: "rgba(239, 232, 228, 0.7)",
    paddingLeft: 25,
  },
  inputShort: {
    padding: 10,
    marginBottom: 40,
    borderRadius: 30,
    fontSize: 15,
    backgroundColor: "rgba(239, 232, 228, 0.7)",
    width: "65%",
    paddingLeft: 25,
    alignSelf: "center",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: "rgba(239, 232, 228, 0.7)",
    marginBottom: 20,
    width: "65%",
    alignSelf: "center",
    paddingLeft: 18,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    fontSize: 15,
  },
  eyeIconButton: {
    padding: 10,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    alignSelf: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  termsTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  termsText: {
    fontSize: 12,
    color: "gray",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    width: "100%",
  },
  buttonContainerCentered: {
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    padding: 10,
  },
  nextButton: {
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 60, // Increase this value to add more vertical space
  },
  halfInput: {
    width: "48%",
    padding: 10,
    borderRadius: 30,
    fontSize: 16,
    backgroundColor: "rgba(239, 232, 228, 0.7)",
  },
  ageGenderContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  ageSelector: {
    marginTop: 20,
  },
  ageContainer: {
    height: ITEM_HEIGHT,
    width: ITEM_WIDTH * 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  scrollViewContent: {
    paddingHorizontal: ITEM_WIDTH,
  },
  ageItem: {
    width: ITEM_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    height: ITEM_HEIGHT,
  },
  selectedItem: {
    backgroundColor: "transparent",
    borderRadius: 8,
  },
  ageText: {
    fontSize: 20,
    color: "#999",
  },
  selectedText: {
    color: "#333",
    fontWeight: "bold",
  },
  genderContainer: {
    height: GENDER_ITEM_HEIGHT * 3,
    width: GENDER_CONTAINER_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  genderScrollViewContent: {
    paddingVertical: GENDER_ITEM_HEIGHT,
  },
  genderItem: {
    width: GENDER_CONTAINER_WIDTH,
    height: GENDER_ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  selectedGenderItem: {
    backgroundColor: "transparent",
  },
  genderText: {
    fontSize: 16,
    color: "#999",
  },
  photoContainer: {
    alignItems: "center",
  },
  photoPlaceholder: {
    width: width * 0.8,
    height: width * 1.2,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  numberContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    borderRadius: 10,
    padding: 5,
  },
  numberText: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
  photoPreviewContainer: {
    marginTop: 20,
    width: "100%",
    height: 650,
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  selectedOverlay: {
    position: "absolute",
    top: GENDER_ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: GENDER_ITEM_HEIGHT,
    backgroundColor: "rgba(239, 232, 228, 0.5)",
    borderRadius: 20,
    zIndex: 0,
  },
  selectedOverlayAge: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: ITEM_WIDTH,
    width: ITEM_WIDTH,
    backgroundColor: "rgba(239, 232, 228, 0.5)",
    borderRadius: 8,
    zIndex: 0,
  },
  nameText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
    position: "absolute",
    bottom: 230,
    left: 20,
  },
  rectanglesContainer: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 40,
  },
  topRectanglesContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 10,
  },
  bottomRectangleContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  bottomRectanglesContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  rectangle: {
    width: "42%",
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rectangleText: {
    color: "black",
    fontWeight: "bold",
  },
  iconsContainer: {
    position: "absolute",
    bottom: 50,
    right: 10,
    flexDirection: "column",
  },
  iconButton: {
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 80,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4d4d4d",
  },
  welcomeSubtitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4d4d4d",
    paddingHorizontal: 20,
  },
  languageContainer: {
    position: 'absolute',
    top: 60, // Adjust this value to move the language selector down
    right: 20,
    zIndex: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  selectedLanguage: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  languageOptions: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 150,
  },
  languageOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#000',
  },
});

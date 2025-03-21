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
    paddingTop: 60, 
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
    backgroundColor: "rgba(239, 232, 228, 0.7)",
  },
  question: {
    fontSize: 15,
    marginVertical: 65,
    textAlign: "center",
    color: 'black', 
  },
  ageQuestion: {
    fontSize: 14,
    marginTop: 65,
    marginBottom: 35,
    textAlign: "center",
    color: 'black', 
  },
  GenderQuestion: {
    fontSize: 14,
    marginVertical: 20,
    marginTop: 110,
    textAlign: "center",
    color: 'black', 
  },
  questionHobies: {
    fontSize: 14,
    marginTop: 0,
    marginBottom: 35,
    textAlign: "center",
    color: "#333333", 
    fontWeight: "bold",
  },
  questionInterests: {
    fontSize: 14,
    marginTop: 30,
    marginBottom: 35,
    textAlign: "center",
    color: "#333333", 
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

  },

  interestsContainer: {
    marginTop: 60, 
  },

  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 60, 
  },

  about2Container:{
    marginTop:60,
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
    // El View padre que encapsula todo
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  
  photoPlaceholder: {
    width: width * 0.8,
    height: width * 1.2,
    backgroundColor: "rgba(239, 232, 228, 0.7)",
    borderRadius: 30,
    overflow: "hidden", // Evita que la imagen se salga del contenedor
    justifyContent: "center",
    alignItems: "center",
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
  imageContainer: {
    width: "100%",
    height: "100%",

  },
  photoPreview: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },

  photo: {
    width: "100%",
    height: "100%",
    // Nota: con expo-image se usa contentFit="cover" en la prop
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
    top: 60, 
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

  openModalButton: {
    marginTop: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Color oscuro translúcido
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25, // Bordes redondeados más elegantes
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  openModalText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.8, // Un poco más de espacio entre letras
  },
  emailVerifiedText: {
    color: "#1DB954", // Un verde más elegante (Spotify Green)
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Oscurece el fondo con transparencia
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff", // Un gris oscuro para modernidad
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 20, // Bordes bien redondeados
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "black", // Texto blanco para resaltar en fondo oscuro
    textAlign: "center",
  },
  modalInput: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "gray", // Borde sutil blanco translúcido
    borderRadius: 15, // Bordes suaves
    marginBottom: 15,
    color: "black", // Texto blanco
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: "#ebddd5", // Verde moderno y vibrante
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  verifyButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase", // Letras en mayúscula para más presencia
    letterSpacing: 1, // Espaciado para mayor claridad
  },
  closeModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: "center",
    width: "100%",
  },
  closeModalText: {
    color: "#black",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resendButton: {
    marginTop: 10,
    backgroundColor: "transparent", // Botón sin fondo
    paddingVertical: 10,
    alignItems: "center",
    width: "100%",
  },
  resendButtonText: {
    color: "#ebddd5", // Verde moderno
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  
});
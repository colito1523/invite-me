import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database, storage } from "../../config/firebase";
import {
  doc,
  setDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import TermsAndConditionsModal from "../../Components/Terms-And-Conditions/terms-and-conditions-modal";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import styles from "./styles";
import { getFunctions, httpsCallable } from "firebase/functions";
import { handleNext, handleVerifyCode } from "./utils";


import es from "../../locales/es.json";
import en from "../../locales/en.json";
import pt from "../../locales/pt.json";

import { LanguageContext } from "../../src/contexts/LanguageContext"; // Ensure correct import of LanguageContext

const LANGUAGE_KEY = "@app_language";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: "es",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

const { width, height } = Dimensions.get("window");

const ITEM_WIDTH = width / 5;
const ITEM_HEIGHT = 50;
const GENDER_ITEM_HEIGHT = 50;
const GENDER_CONTAINER_WIDTH = width * 0.6;

const ages = Array.from({ length: 85 }, (_, i) => i + 16);
const genders = ["Male", "Female", "Other", "Prefer not to say"];

const interestKeysGroup1 = [
  "firstOneIn",
  "lastOneOut",
  "foodie",
  "gym",
  "miaPerson",
  "alwaysOnTime",
  "reading",
  "traveling",
  "cycling",
  "running",
];

// NUEVO: 2da lista de intereses
const interestKeysGroup2 = [
  "music",
  "art",
  "beach",
  "countryside",
  "cooking",
  "festivals",
  "mornings",
  "nights",
  "summerPerson",
  "winterPerson",
  "goingOut",
  "stayingIn",
];

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function AgeSelector({ onAgeChange, initialAge }) {
  const [selectedAge, setSelectedAge] = useState(initialAge);
  const scrollViewRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const initialIndex = ages.indexOf(initialAge);
    if (initialIndex !== -1) {
      scrollViewRef.current?.scrollTo({
        x: initialIndex * ITEM_WIDTH,
        animated: false,
      });
    }
  }, []);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / ITEM_WIDTH);
    const newAge = ages[index];
    setSelectedAge(newAge);
    onAgeChange(newAge);
  };

  const renderAgeItem = (age, index) => {
    const isSelected = age === selectedAge;
    return (
      <View
        key={`${age}-${index}`}
        style={[
          styles.ageItem,
          isSelected && styles.selectedItem,
          { justifyContent: "center", alignItems: "center", flex: 1 },
        ]}
      >
        <Text style={[styles.ageText, isSelected && styles.selectedText]}>
          {age}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.ageSelectorContainer}>
      {/* Se agrega pointerEvents="none" para que el overlay no bloquee toques */}
      <View style={styles.selectedOverlayAge} pointerEvents="none" />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollViewContent}
        nestedScrollEnabled={true}
      >
        {ages.map((age, index) => renderAgeItem(age, index))}
      </ScrollView>
    </View>
  );
}

function GenderSelector({ onGenderChange, initialGender }) {
  const [selectedGender, setSelectedGender] = useState(initialGender);
  const scrollViewRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const initialIndex = genders.indexOf(initialGender);
    if (initialIndex !== -1) {
      scrollViewRef.current?.scrollTo({
        y: initialIndex * GENDER_ITEM_HEIGHT,
        animated: false,
      });
    }
  }, []);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index =
      Math.round(scrollPosition / GENDER_ITEM_HEIGHT) % genders.length;
    const newGender = genders[index];
    setSelectedGender(newGender);
    onGenderChange(newGender);
  };

  const renderGenderItem = (gender, index) => {
    const isSelected = gender === selectedGender;
    return (
      <View
        key={`${gender}-${index}`}
        style={[
          styles.genderItem,
          isSelected && styles.selectedGenderItem,
          { flex: 1, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={[styles.genderText, isSelected && styles.selectedText]}>
          {t(`signup.genders.${gender.toLowerCase()}`)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.genderContainer}>
      {/* Se agrega pointerEvents="none" para que el overlay no bloquee toques */}
      <View style={styles.selectedOverlay} pointerEvents="none" />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={GENDER_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.genderScrollViewContent}
        nestedScrollEnabled={true}
      >
        {genders.map((gender, index) => renderGenderItem(gender, index))}
      </ScrollView>
    </View>
  );
}

export default function SignUp() {
  const { t } = useTranslation();
  const { selectedLanguage, changeLanguage } = useContext(LanguageContext); // Use LanguageContext
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    age: "18",
    gender: "Other",
    about: "",
    interest1: "",
    interest2: "",
    interest3: "",
    interest4: "",
    photo1: null,
    photo2: null,
    photo3: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLanguageOptionsVisible, setIsLanguageOptionsVisible] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const navigation = useNavigation();
  const [isCodeSent, setIsCodeSent] = useState(false);  // Código enviado
const [emailVerified, setEmailVerified] = useState(false);  // Email verificado
const [verificationCode, setVerificationCode] = useState("");  // Código ingresado
const functions = getFunctions();
const sendVerificationCodeFn = httpsCallable(functions, "sendVerificationCode");
const verifyCodeFn = httpsCallable(functions, "verifyCode");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "pt", name: "Português" },
  ];

  useEffect(() => {
    i18n.changeLanguage(selectedLanguage);
  }, [selectedLanguage]);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsLanguageOptionsVisible(false);
  };

  // Generamos arrays traducidos en cada render
  const translatedInterestOptions1 = interestKeysGroup1.map((key) =>
    t(`signup.interestsGroup1.${key}`)
  );
  const translatedInterestOptions2 = interestKeysGroup2.map((key) =>
    t(`signup.interestsGroup2.${key}`)
  );

  const questions = [
    { id: "account", question: t("signup.questions.account") },
    { id: "ageGender", question: t("signup.questions.ageGender") },
    { id: "about", question: t("signup.questions.about") },
    { id: "about2" },
    { id: "photos", question: t("signup.questions.photos") },
    { id: "preview1", question: t("signup.questions.preview1") },
    { id: "photos2", question: "" },
    { id: "preview2", question: t("signup.questions.preview2") },
    { id: "photos3", question: "" },
    { id: "finalPreview", question: t("signup.questions.finalPreview") },
    { id: "welcome", question: t("signup.questions.welcome") },
  ];

  useEffect(() => {
    if (currentQuestionIndex === 1) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleAnswer = (id, value) => {
    if (id === "firstName" || id === "lastName") {
      // Solo letras y espacios
      const validValue = value.replace(/[^\p{L}\p{Zs}]/gu, "").slice(0, 15);

      setAnswers((prev) => ({ ...prev, [id]: validValue }));
    } else if (
      id === "interest1" ||
      id === "interest2" ||
      id === "interest3" ||
      id === "interest4"
    ) {
      // Letras, espacios y emojis
      const validValue = value
        .replace(
          /[^\p{L}\p{Zs}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{1F000}-\u{1F02F}]/gu,
          ""
        )
        .slice(0, 15);

      setAnswers((prev) => ({ ...prev, [id]: validValue }));
    } else if (id === "username") {
      // Eliminar espacios al inicio o final
      const trimmedValue = value.trim();
      setAnswers((prev) => ({ ...prev, [id]: trimmedValue }));
    } else {
      setAnswers((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleInterestSelection = (key) => {
    const currentInterests = [
      answers.interest1,
      answers.interest2,
      answers.interest3,
      answers.interest4,
    ].filter(Boolean);
  
    if (currentInterests.includes(key)) {
      // Deselecciona
      if (answers.interest1 === key) {
        handleAnswer("interest1", "");
      } else if (answers.interest2 === key) {
        handleAnswer("interest2", "");
      } else if (answers.interest3 === key) {
        handleAnswer("interest3", "");
      } else if (answers.interest4 === key) {
        handleAnswer("interest4", "");
      }
    } else {
      // Selecciona si hay espacio
      if (!answers.interest1) {
        handleAnswer("interest1", key);
      } else if (!answers.interest2) {
        handleAnswer("interest2", key);
      } else if (!answers.interest3) {
        handleAnswer("interest3", key);
      } else if (!answers.interest4) {
        handleAnswer("interest4", key);
      } else {
        Alert.alert(t("signup.errors.selectFourInterests"));
      }
    }
  };

  function translateInterestKey(key, t) {
    // Primero vemos en qué grupo está la clave
    if (interestKeysGroup1.includes(key)) {
      return t(`signup.interestsGroup1.${key}`);
    } else if (interestKeysGroup2.includes(key)) {
      return t(`signup.interestsGroup2.${key}`);
    } else {
      return key; // Si no coincide con ningún grupo
    }
  }

  const validateName = (name) => {
    const nameRegex = /^[a-zA-ZÀ-ÿãÃçÇñÑ ]+$/;
    return nameRegex.test(name);
  };

  const validateEmail = (email) => {
    const emailRegex =
      /^(?!.*(.)\1{3,})(?!^\d+@)(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]{3,}(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@(?:(?!^\d+\.)[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9._]+$/; // Allow uppercase letters in the regex
    return usernameRegex.test(username);
  };

  const validateSingleWord = (word) => {
    const hobbyInterestRegex =
      /^[\p{L}\p{N}\p{P}\p{Zs}\u1F600-\u1F64F\u1F300-\u1F5FF\u1F680-\u1F6FF\u1F700-\u1F77F]+$/u;
    return hobbyInterestRegex.test(word) && [...word].length <= 15; // Contar correctamente caracteres compuestos
  };


  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `photos/${filename}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const emailToLower = answers.email.trim().toLowerCase();
      const usernameToLower = answers.username.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailToLower,
        answers.password
      );
      const user = userCredential.user;

      const photoUrls = [];
      for (let i = 1; i <= 3; i++) {
        if (answers[`photo${i}`]) {
          const url = await uploadImage(answers[`photo${i}`]);
          photoUrls.push(url);
        }
      }

      const finalInterest1 = translateInterestKey(answers.interest1, t);
      const finalInterest2 = translateInterestKey(answers.interest2, t);
      const finalInterest3 = translateInterestKey(answers.interest3, t);
      const finalInterest4 = translateInterestKey(answers.interest4, t);

      const userData = {
        uid: user.uid,
        age: answers.age,
        email: emailToLower,
        firstName: answers.firstName,
        gender: answers.gender,
        lastName: answers.lastName,
      
        // USAMOS LOS INTERESES TRADUCIDOS:
        firstInterest: finalInterest1,
        secondInterest: finalInterest2,
        thirdInterest: finalInterest3,
        fourthInterest: finalInterest4,
      
        photoUrls,
        username: usernameToLower,
        preferredLanguage: i18n.language,
        hasSeenTutorial: false,
      };

      await setDoc(doc(database, "users", user.uid), userData);

      navigation.reset({
        index: 0,
        routes: [{ name: "Tutorial" }],
      });

      setCurrentQuestionIndex(questions.length - 1);
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);

      if (error.code === "auth/email-already-in-use") {
        Alert.alert(t("signup.errors.emailInUse"));
      } else if (error.code === "auth/weak-password") {
        Alert.alert(t("signup.errors.weakPassword"));
      } else {
        Alert.alert(t("signup.errors.generic"), error.message);
      }
    }
  };

  const compressImage = async (uri) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Redimensiona la imagen a un ancho máximo de 1080px
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG } // Comprime al 60% de calidad
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error("Error al comprimir la imagen:", error);
      return uri; // En caso de error, devuelve la imagen original
    }
  };

  const pickImage = async (photoNumber) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permite recortar antes de seleccionar
      quality: 1, // Máxima calidad antes de la compresión
    });

    if (!result.canceled) {
      const compressedUri = await compressImage(result.assets[0].uri); // Comprime la imagen
      handleAnswer(`photo${photoNumber}`, compressedUri); // Guarda la imagen comprimida en el estado
      handleNext(); // Pasa a la siguiente pregunta
    }
  };

  const renderPreview = (photoNumber, showIcons = false) => (
    <View style={styles.photoContainer}>
      <View style={[styles.photoPlaceholder, styles.photoPreviewContainer]}>
        <Image
          source={{ uri: answers[`photo${photoNumber}`] }}
          style={[styles.photo, styles.photoPreview]}
          cachePolicy="memory-disk"
        />
      </View>
      <Text style={styles.nameText}>
        {`${answers.firstName} ${answers.lastName}`}
      </Text>
      {photoNumber === 3 ? (
        <View style={styles.rectanglesContainer}>
          <View style={styles.topRectanglesContainer}>
            <View style={styles.rectangle}>
            <Text style={styles.rectangleText}>
  {translateInterestKey(answers.interest1, t)}
</Text>
            </View>
            <View style={styles.rectangle}>
            <Text style={styles.rectangleText}>
  {translateInterestKey(answers.interest2, t)}
</Text>
            </View>
          </View>
          <View style={styles.bottomRectangleContainer}></View>
          <View style={styles.bottomRectanglesContainer}>
            <View style={styles.rectangle}>
            <Text style={styles.rectangleText}>
  {translateInterestKey(answers.interest3, t)}
</Text>
            </View>
            <View style={styles.rectangle}>
            <Text style={styles.rectangleText}>
  {translateInterestKey(answers.interest4, t)}
</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.rectanglesContainer}>
          <View style={styles.topRectanglesContainer}>
            <View style={styles.rectangle} />
            <View style={styles.rectangle} />
          </View>
          <View style={styles.bottomRectangleContainer}>
            <View style={styles.rectangle} />
          </View>
        </View>
      )}
      {showIcons && (
        <View style={styles.iconsContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <AntDesign name="adduser" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <AntDesign name="hearto" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <AntDesign name="message1" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex + 1) / questions.length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logo}></View>
        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={styles.languageSelector}
            onPress={() =>
              setIsLanguageOptionsVisible(!isLanguageOptionsVisible)
            }
          >
            <Ionicons name="globe-outline" size={24} color="#000" />
            <Text style={styles.selectedLanguage}>
              {languages.find((lang) => lang.code === selectedLanguage)?.name}
            </Text>
            <Ionicons name="chevron-down" size={24} color="#000" />
          </TouchableOpacity>
          {isLanguageOptionsVisible && (
            <View style={styles.languageOptions}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={styles.languageOption}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      selectedLanguage === lang.code &&
                        styles.selectedLanguageText,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {currentQuestion.id !== "welcome" && (
          <ProgressBar
            progress={progress}
            color="#333"
            style={styles.progressBar}
          />
        )}
        {currentQuestion.id !== "preview1" &&
          currentQuestion.id !== "preview2" &&
          currentQuestion.id !== "finalPreview" &&
          currentQuestion.id !== "welcome" &&
          currentQuestion.id !== "about2" && (
            <Text
              style={
                currentQuestion.id === "ageGender"
                  ? styles.ageQuestion
                  : styles.question
              }
            >
              {currentQuestion.question}
            </Text>
          )}

{currentQuestion.id === "account" && (
  <View>
    {/* Nombre y Apellido */}
    <View style={styles.nameContainer}>
      <TextInput
        style={[styles.nameInput, { color: "#4b4b4b" }]}
        placeholder={t("signup.placeholders.firstName")}
        placeholderTextColor="#4b4b4b"
        onChangeText={(text) => handleAnswer("firstName", text)}
        value={answers.firstName}
      />
      <TextInput
        style={[styles.nameInput, { color: "#4b4b4b" }]}
        placeholder={t("signup.placeholders.lastName")}
        placeholderTextColor="#4b4b4b"
        onChangeText={(text) => handleAnswer("lastName", text)}
        value={answers.lastName}
      />
    </View>

    {/* Email con verificación */}
    <TextInput
      style={[styles.input, { color: "#4b4b4b" }]}
      placeholder={t("signup.placeholders.email")}
      placeholderTextColor="#4b4b4b"
      onChangeText={(text) => handleAnswer("email", text)}
      value={answers.email}
      keyboardType="email-address"
      editable={!isCodeSent} // No permitir cambios después de enviar el código
    />

    {/* Si el código ya fue enviado pero no verificado, mostrar input para ingresarlo */}
    {!emailVerified && isCodeSent && (
      <>
        <TextInput
          style={[styles.input, { color: "#4b4b4b", marginTop: 10 }]}
          placeholder="Ingresa el código de verificación"
          placeholderTextColor="#4b4b4b"
          onChangeText={(text) => setVerificationCode(text)}
          value={verificationCode}
          keyboardType="number-pad"
        />
       <TouchableOpacity
  style={styles.verifyButton}
  onPress={() =>
    handleVerifyCode({
      answers,
      verificationCode,
      setIsLoading,
      verifyCodeFn,
      t,
      setEmailVerified,
    })
  }
  disabled={isLoading}
>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verificar Código</Text>
          )}
        </TouchableOpacity>
      </>
    )}

    {/* Si el código fue verificado, mostrar mensaje */}
    {emailVerified && (
      <Text style={{ color: "green", marginTop: 10 }}>✔️ Email verificado</Text>
    )}

    {/* Nombre de usuario */}
    <TextInput
      style={[styles.inputShort, { color: "#4b4b4b" }]}
      placeholder={t("signup.placeholders.username")}
      placeholderTextColor="#4b4b4b"
      onChangeText={(text) => handleAnswer("username", text)}
      value={answers.username}
    />

    {/* Contraseña con icono de visibilidad */}
    <View style={styles.passwordContainer}>
      <TextInput
        style={[styles.passwordInput, { color: "#4b4b4b" }]}
        placeholder={t("signup.placeholders.password")}
        placeholderTextColor="#4b4b4b"
        onChangeText={(text) => handleAnswer("password", text)}
        value={answers.password}
        secureTextEntry={!showPassword}
      />
      <TouchableOpacity
        style={styles.eyeIconButton}
        onPress={() => setShowPassword(!showPassword)}
      >
        <Ionicons
          name={showPassword ? "eye-off" : "eye"}
          size={20}
          color="gray"
        />
      </TouchableOpacity>
    </View>

    {/* Términos y Condiciones */}
    <View style={styles.termsContainer}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => setAcceptedTerms(!acceptedTerms)}
      >
        {acceptedTerms && (
          <Ionicons name="checkmark" size={20} color="black" />
        )}
      </TouchableOpacity>
      <View style={styles.termsTextContainer}>
        <Text style={styles.termsText}>
          {t("signup.termsAndConditions.acceptText")}{" "}
        </Text>
        <TermsAndConditionsModal />
      </View>
    </View>
  </View>
)}


        {currentQuestion.id === "ageGender" && (
          <Animated.View
            style={[styles.ageGenderContainer, { opacity: fadeAnim }]}
          >
            <AgeSelector
              onAgeChange={(age) => handleAnswer("age", age.toString())}
              initialAge={parseInt(answers.age)}
            />

            <Text style={styles.GenderQuestion}>
              {t("signup.questions.gender")}
            </Text>
            <GenderSelector
              onGenderChange={(gender) => handleAnswer("gender", gender)}
              initialGender={answers.gender}
            />
          </Animated.View>
        )}

            {currentQuestion.id === "about" && (
          <View>
           {chunkArray(interestKeysGroup1, 2).map((row, rowIndex) => (
  <View style={styles.rowInputs} key={`interest-row-${rowIndex}`}>
    {row.map((key) => {
      const isSelected =
        key === answers.interest1 ||
        key === answers.interest2 ||
        key === answers.interest3 ||
        key === answers.interest4;
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.halfInput,
            isSelected ? { backgroundColor: "#e0dcd7" } : null,
          ]}
          onPress={() => handleInterestSelection(key)}
        >
          <Text>{t(`signup.interestsGroup1.${key}`)}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
))}


          </View>
        )}

{currentQuestion.id === "about2" && (
  <View style={styles.interestsContainer}>
    {chunkArray(interestKeysGroup2, 2).map((row, rowIndex) => (
      <View key={`outer-container-${rowIndex}`}>
        <View style={styles.rowInputs} key={`interest2-row-${rowIndex}`}>
          {row.map((key, i) => {
            const isSelected =
              key === answers.interest1 ||
              key === answers.interest2 ||
              key === answers.interest3 ||
              key === answers.interest4;
            return (
              <TouchableOpacity
                key={`option-${rowIndex}-${i}`}
                style={[
                  styles.halfInput,
                  isSelected ? { backgroundColor: "#e0dcd7" } : null,
                ]}
                onPress={() => handleInterestSelection(key)}
              >
                <Text>{t(`signup.interestsGroup2.${key}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    ))}
  </View>
)}



        {currentQuestion.id === "photos" && (
          <View style={styles.photoContainer}>
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={() => pickImage(1)}
            >
              {answers.photo1 ? (
                <Image
                  source={{ uri: answers.photo1 }}
                  style={styles.photo}
                  cachePolicy="memory-disk"
                />
              ) : (
                <MaterialIcons
                  name="add-photo-alternate"
                  size={70}
                  color="gray"
                />
              )}
              <View style={styles.numberContainer}>
                <Text style={styles.numberText}>1</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {currentQuestion.id === "preview1" && renderPreview(1)}

        {currentQuestion.id === "photos2" && (
          <View style={styles.photoContainer}>
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={() => pickImage(2)}
            >
              {answers.photo2 ? (
                <Image
                  source={{ uri: answers.photo2 }}
                  style={styles.photo}
                  cachePolicy="memory-disk"
                />
              ) : (
                <MaterialIcons
                  name="add-photo-alternate"
                  size={70}
                  color="gray"
                />
              )}
              <View style={styles.numberContainer}>
                <Text style={styles.numberText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {currentQuestion.id === "preview2" && renderPreview(2)}

        {currentQuestion.id === "photos3" && (
          <View style={styles.photoContainer}>
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={() => pickImage(3)}
            >
              {answers.photo3 ? (
                <Image
                  source={{ uri: answers.photo3 }}
                  style={styles.photo}
                  cachePolicy="memory-disk"
                />
              ) : (
                <MaterialIcons
                  name="add-photo-alternate"
                  size={70}
                  color="gray"
                />
              )}
              <View style={styles.numberContainer}>
                <Text style={styles.numberText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {currentQuestion.id === "finalPreview" && renderPreview(3, true)}

        {currentQuestion.id === "welcome" && (
          <View style={styles.welcomeContainer}>
            {isSubmitting ? (
              <ActivityIndicator size={50} color="#0000ff" />
            ) : (
              <>
                <Text style={styles.welcomeTitle}>
                  {t("signup.welcome.title")}
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  {t("signup.welcome.subtitle")}
                </Text>
              </>
            )}
          </View>
        )}

        <View
          style={
            currentQuestionIndex === 0 || currentQuestion.id === "welcome"
              ? styles.buttonContainerCentered
              : styles.buttonContainer
          }
        >
          {currentQuestionIndex > 0 && currentQuestion.id !== "welcome" && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              disabled={isLoading}
            >
              <AntDesign name="left" size={24} color="black" />
            </TouchableOpacity>
          )}
          {currentQuestionIndex < questions.length - 1 && (
           <TouchableOpacity
           style={styles.nextButton}
           onPress={() =>
             handleNext({
               currentQuestionIndex,
               questions,
               answers,
               acceptedTerms,
               setIsLoading,
               setCurrentQuestionIndex,
               handleSubmit,
               t,
               validateName,
               validateEmail,
               validateUsername,
               validatePassword,
               validateSingleWord,
               database,
               sendVerificationCodeFn,
               isCodeSent,
               setIsCodeSent,
               emailVerified,
             })
           }
           disabled={isLoading}
         >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <AntDesign name="right" size={24} color="black" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

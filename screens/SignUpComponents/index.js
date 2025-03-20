import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  Text,
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
import { AntDesign, Ionicons, } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database } from "../../config/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import styles from "./styles";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  handleNext,
  handleVerifyCode,
  validateName,
  validateEmail,
  validateUsername,
  validatePassword,
  validateSingleWord,
  handleInterestSelection,
  uploadImage,
  pickImage,
  handleBack,
} from "./utils";
import GenderSelector from "./GenderSelector";
import AgeSelector from "./AgeSelector";
import InterestsSelector from "./InterestsSelector";
import AccountForm from "./AccountForm";
import PhotoSelector from "./PhotoSelector";
import PhotoPreview from "./PhotoPreview";
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

const ages = Array.from({ length: 85 }, (_, i) => i + 16);

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
  const [modalVisible, setModalVisible] = useState(false);
  const [isLanguageOptionsVisible, setIsLanguageOptionsVisible] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const navigation = useNavigation();
  const [isCodeSent, setIsCodeSent] = useState(false); // Código enviado
  const [emailVerified, setEmailVerified] = useState(false); // Email verificado
  const [verificationCode, setVerificationCode] = useState(""); // Código ingresado
  const functions = getFunctions();
  const sendVerificationCodeFn = httpsCallable(
    functions,
    "sendVerificationCode"
  );
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
  <AccountForm
    answers={answers}
    handleAnswer={handleAnswer}
    showPassword={showPassword}
    setShowPassword={setShowPassword}
    isCodeSent={isCodeSent}
    emailVerified={emailVerified}
    verificationCode={verificationCode}
    setVerificationCode={setVerificationCode}
    isLoading={isLoading}
    handleVerifyCode={handleVerifyCode}
    t={t}
    acceptedTerms={acceptedTerms}
    setAcceptedTerms={setAcceptedTerms}
    verifyCodeFn={verifyCodeFn}       // se pasa la función de verificación
    setIsLoading={setIsLoading}       // se pasa la función para actualizar el loading
    setEmailVerified={setEmailVerified} // se pasa la función para actualizar la verificación
    modalVisible={modalVisible}         // Se pasa la visibilidad del modal
    setModalVisible={setModalVisible}
    sendVerificationCodeFn={sendVerificationCodeFn} 
  />
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
  <InterestsSelector
    group="group1"
    keys={interestKeysGroup1}
    answers={answers}
    handleAnswer={handleAnswer}
    handleInterestSelection={handleInterestSelection}
    t={t}
  />
)}

{currentQuestion.id === "about2" && (
  <View style={{ marginTop: 70 }}>
    <InterestsSelector
      group="group2"
      keys={interestKeysGroup2}
      answers={answers}
      handleAnswer={handleAnswer}
      handleInterestSelection={handleInterestSelection}
      t={t}
    />
  </View>
)}
{currentQuestion.id === "photos" && (
  <PhotoSelector
    photo={answers.photo1}
    onSelect={() => pickImage(1, handleAnswer, handleNext)}
    photoNumber={1}
  />
)}

{currentQuestion.id === "preview1" && (
  <PhotoPreview
    photo={answers.photo1}
    photoNumber={1}
    name={`${answers.firstName} ${answers.lastName}`}
    interests={[]} // No se muestran intereses en este preview
    showIcons={false}
    translateInterestKey={translateInterestKey}
    t={t}
  />
)}

{currentQuestion.id === "photos2" && (
  <PhotoSelector
    photo={answers.photo2}
    onSelect={() => pickImage(2, handleAnswer, handleNext)}
    photoNumber={2}
  />
)}

{currentQuestion.id === "preview2" && (
  <PhotoPreview
    photo={answers.photo2}
    photoNumber={2}
    name={`${answers.firstName} ${answers.lastName}`}
    interests={[]} // Tampoco se muestran intereses en este preview
    showIcons={false}
    translateInterestKey={translateInterestKey}
    t={t}
  />
)}

{currentQuestion.id === "photos3" && (
  <PhotoSelector
    photo={answers.photo3}
    onSelect={() => pickImage(3, handleAnswer, handleNext)}
    photoNumber={3}
  />
)}

{currentQuestion.id === "finalPreview" && (
  <PhotoPreview
    photo={answers.photo3}
    photoNumber={3}
    name={`${answers.firstName} ${answers.lastName}`}
    interests={[
      answers.interest1,
      answers.interest2,
      answers.interest3,
      answers.interest4,
    ]}
    showIcons={true}
    translateInterestKey={translateInterestKey}
    t={t}
  />
)}


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
              onPress={() =>
                handleBack(currentQuestionIndex, setCurrentQuestionIndex)
              }
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
                  setModalVisible,
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

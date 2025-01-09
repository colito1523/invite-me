import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database, storage } from "../../config/firebase";
import { doc, setDoc, getDocs, query, where, collection, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import TermsAndConditionsModal from "../../Components/Terms-And-Conditions/terms-and-conditions-modal";
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './styles';

import es from '../../locales/es.json';
import en from '../../locales/en.json';
import pt from '../../locales/pt.json';

import { LanguageContext } from "../../App"; // Ensure correct import of LanguageContext

const LANGUAGE_KEY = '@app_language';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
    },
    lng: 'es',
    fallbackLng: 'en',
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
      <View style={styles.selectedOverlayAge} />
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
    // Check if the current gender is selected
    const isSelected = gender === selectedGender;

    return (
      <View
        key={`${gender}-${index}`} // Unique key for each item
        style={[
          styles.genderItem, // Base style for gender item
          isSelected && styles.selectedGenderItem, // Additional style if selected
          { flex: 1, justifyContent: "center", alignItems: "center" }, // Center the content
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
      <View style={styles.selectedOverlay} />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={GENDER_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.genderScrollViewContent}
        nestedScrollEnabled={true}
      >
        {genders.map((gender, index) =>
          renderGenderItem(gender, index)
        )}
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
    hobby1: "",
    hobby2: "",
    interest1: "",
    interest2: "",
    photo1: null,
    photo2: null,
    photo3: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLanguageOptionsVisible, setIsLanguageOptionsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' }
  ];

  useEffect(() => {
    i18n.changeLanguage(selectedLanguage);
  }, [selectedLanguage]);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsLanguageOptionsVisible(false);
  };


  const questions = [
    { id: "account", question: t('signup.questions.account') },
    { id: "ageGender", question: t('signup.questions.ageGender') },
    { id: "about", question: t('signup.questions.about') },
    { id: "photos", question: t('signup.questions.photos') },
    { id: "preview1", question: t('signup.questions.preview1') },
    { id: "photos2", question: "" },
    { id: "preview2", question: t('signup.questions.preview2') },
    { id: "photos3", question: "" },
    { id: "finalPreview", question: t('signup.questions.finalPreview') },
    { id: "welcome", question: t('signup.questions.welcome') },
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
      const validValue = value
        .replace(/[^\p{L}\p{Zs}]/gu, "")
        .slice(0, 15);

      setAnswers((prev) => ({ ...prev, [id]: validValue }));
    } else if (
      id === "hobby1" ||
      id === "hobby2" ||
      id === "interest1" ||
      id === "interest2"
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


  const validateName = (name) => {
    const nameRegex = /^[a-zA-ZÀ-ÿãÃçÇñÑ ]+$/;
    return nameRegex.test(name);
  };

  const validateEmail = (email) => {
    const emailRegex =/^(?!.*(.)\1{3,})(?!^\d+@)(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]{3,}(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@(?:(?!^\d+\.)[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

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
    const hobbyInterestRegex = /^[\p{L}\p{N}\p{P}\p{Zs}\u1F600-\u1F64F\u1F300-\u1F5FF\u1F680-\u1F6FF\u1F700-\u1F77F]+$/u;
    return hobbyInterestRegex.test(word) && [...word].length <= 15; // Contar correctamente caracteres compuestos
  };



  const handleNext = async () => {
    setIsLoading(true);
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.id === "account") {
      if (!answers.firstName || !answers.lastName) {
        Alert.alert(t('signup.errors.emptyName'));
        setIsLoading(false);
        return;
      }
      if (!validateName(answers.firstName) || !validateName(answers.lastName)) {
        Alert.alert(t('signup.errors.invalidName'));
        setIsLoading(false);
        return;
      }
      if (!answers.email || !validateEmail(answers.email)) {
        Alert.alert(t('signup.errors.invalidEmail'));
        setIsLoading(false);
        return;
      }
      if (!answers.username || !validateUsername(answers.username)) {
        Alert.alert(t('signup.errors.invalidUsername'));
        setIsLoading(false);
        return;
      }
      if (!answers.password || !validatePassword(answers.password)) {
        Alert.alert(t('signup.errors.invalidPassword'));
        setIsLoading(false);
        return;
      }
      if (!acceptedTerms) {
        Alert.alert(t('signup.errors.termsNotAccepted'));
        setIsLoading(false);
        return;
      }
      // Verifica si el email ya está en uso
    const emailQuery = query(
      collection(database, "users"),
      where("email", "==", answers.email.trim().toLowerCase())
    );
      try {
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        Alert.alert(t('signup.errors.emailInUse'));
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      Alert.alert(t('signup.errors.generic'), error.message);
      setIsLoading(false);
      return;
    }
    const usernameQuery = query(
      collection(database, "users"),
      where("username", "==", answers.username.trim().toLowerCase())
    );

    try {
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        Alert.alert(t('signup.errors.usernameInUse'));
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      Alert.alert(t('signup.errors.generic'), error.message);
      setIsLoading(false);
      return;
    }
    }

    if (currentQuestion.id === "about") {
      if (
        !validateSingleWord(answers.hobby1) ||
        !validateSingleWord(answers.hobby2)
      ) {
        Alert.alert(t('signup.errors.invalidHobbies'));
        setIsLoading(false);
        return;
      }
      if (
        !validateSingleWord(answers.interest1) ||
        !validateSingleWord(answers.interest2)
      ) {
        Alert.alert(t('signup.errors.invalidInterests'));
        setIsLoading(false);
        return;
      }
    }

    if (currentQuestion.id === "photos" && !answers.photo1) {
      setIsLoading(false);
      return;
    }
    if (currentQuestion.id === "photos2" && !answers.photo2) {
      setIsLoading(false);
      return;
    }
    if (currentQuestion.id === "photos3" && !answers.photo3) {
      setIsLoading(false);
      return;
    }

    if (currentQuestionIndex < questions.length - 2) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentQuestionIndex === questions.length - 2) {
      await handleSubmit();
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const manipulateImage = async (uri) => {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 500 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulatedImage.uri;
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

      const userData = {
        uid: user.uid,
        age: answers.age,
        email: emailToLower,
        firstName: answers.firstName,
        gender: answers.gender,
        lastName: answers.lastName,
        firstHobby: answers.hobby1,
        secondHobby: answers.hobby2,
        firstInterest: answers.interest1,
        secondInterest: answers.interest2,
        photoUrls: photoUrls,
        username: usernameToLower,
        preferredLanguage: i18n.language,
        hasSeenTutorial: false // Campo para controlar si ya vio el tutorial
      };

      await setDoc(doc(database, "users", user.uid), userData);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Tutorial' }],
      });
      
      setCurrentQuestionIndex(questions.length - 1);
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);

      if (error.code === "auth/email-already-in-use") {
        Alert.alert(t('signup.errors.emailInUse'));
      } else if (error.code === "auth/weak-password") {
        Alert.alert(t('signup.errors.weakPassword'));
      } else {
        Alert.alert(t('signup.errors.generic'), error.message);
      }
    }
  };

  const pickImage = async (photoNumber) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Habilita la edición para permitir redimensionamiento
      quality: 1, // Máxima calidad
    });

    if (!result.canceled) {
      handleAnswer(`photo${photoNumber}`, result.assets[0].uri);
      handleNext();
    } else {

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
              <Text style={styles.rectangleText}>{answers.hobby1}</Text>
            </View>
            <View style={styles.rectangle}>
              <Text style={styles.rectangleText}>{answers.hobby2}</Text>
            </View>
          </View>
          <View style={styles.bottomRectangleContainer}>
          </View>
          <View style={styles.bottomRectanglesContainer}>
            <View style={styles.rectangle}>
              <Text style={styles.rectangleText}>{answers.interest1}</Text>
            </View>
            <View style={styles.rectangle}>
              <Text style={styles.rectangleText}>{answers.interest2}</Text>
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
        behavior={Platform.OS === "ios" ? "padding" : "height" }
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Image
            source={require("../../assets/Logo_Invite_Me.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <View style={styles.languageContainer}>
            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setIsLanguageOptionsVisible(!isLanguageOptionsVisible)}
            >
              <Ionicons name="globe-outline" size={24} color="#000" />
              <Text style={styles.selectedLanguage}>
                {languages.find(lang => lang.code === selectedLanguage)?.name}
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
                    <Text style={[ 
                      styles.languageOptionText,
                      selectedLanguage === lang.code && styles.selectedLanguageText
                    ]}>
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
            currentQuestion.id !== "welcome" && (
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
              <View style={styles.nameContainer}>
                <TextInput
                  style={[styles.nameInput, { color: "#4b4b4b" }]}
                  placeholder={t('signup.placeholders.firstName')}
                  placeholderTextColor="#4b4b4b"
                  onChangeText={(text) => handleAnswer("firstName", text)}
                  value={answers.firstName}
                />
                <TextInput
                  style={[styles.nameInput, { color: "#4b4b4b" }]}
                  placeholder={t('signup.placeholders.lastName')}
                  placeholderTextColor="#4b4b4b"
                  onChangeText={(text) => handleAnswer("lastName", text)}
                  value={answers.lastName}
                />
              </View>
              <TextInput
                style={[styles.input, { color: "#4b4b4b" }]}
                placeholder={t('signup.placeholders.email')}
                placeholderTextColor="#4b4b4b"
                onChangeText={(text) => handleAnswer("email", text)}
                value={answers.email}
                keyboardType="email-address"
              />
              <TextInput
                style={[styles.inputShort, { color: "#4b4b4b" }]}
                placeholder={t('signup.placeholders.username')}
                placeholderTextColor="#4b4b4b"
                onChangeText={(text) => handleAnswer("username", text)}
                value={answers.username}
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { color: "#4b4b4b" }]}
                  placeholder={t('signup.placeholders.password')}
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
                    {t('signup.termsAndConditions.acceptText')}{' '}
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

              <Text style={styles.GenderQuestion}>{t('signup.questions.gender')}</Text>
              <GenderSelector
                onGenderChange={(gender) => handleAnswer("gender", gender)}
                initialGender={answers.gender}
              />
            </Animated.View>
          )}

          {currentQuestion.id === "about" && (
            <View style={styles.aboutContainer}> 
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.halfInput, { color: "black" }]}
                  placeholder={t('signup.placeholders.hobby1')}
                  placeholderTextColor="#4b4b4b"
                  onChangeText={(text) => handleAnswer("hobby1", text)}
                  value={answers.hobby1}
                />
                <TextInput
                  style={[styles.halfInput, { color: "black" }]}
                  placeholder={t('signup.placeholders.hobby2')}
                  placeholderTextColor="#4b4b4b"
                  onChangeText={(text) => handleAnswer("hobby2", text)}
                  value={answers.hobby2}
                />
              </View>

              
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.halfInput, { color: "black" }]}
                  placeholder={t('signup.placeholders.interest1')}
                  placeholderTextColor="#4b4b4b"
                  onChangeText={(text) => handleAnswer("interest1", text)}
                  value={answers.interest1}
                />
                <TextInput
                  style={[styles.halfInput, { color: "black" }]}
                  placeholder={t('signup.placeholders.interest2')}
                  placeholderTextColor="#4b4b4b"
                  onChangeText={(text) => handleAnswer("interest2", text)}
                  value={answers.interest2}
                />
              </View>
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
                  <Text style={styles.welcomeTitle}>{t('signup.welcome.title')}</Text>
                  <Text style={styles.welcomeSubtitle}>
                    {t('signup.welcome.subtitle')}
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
                onPress={handleNext}
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
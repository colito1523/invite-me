import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database, storage } from "../config/firebase";
import { doc, setDoc, getDocs, query, where, collection  } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import TermsAndConditionsModal from "../Components/Terms-And-Conditions/terms-and-conditions-modal";
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from '../locales/es.json';
import en from '../locales/en.json';
import pt from '../locales/pt.json';

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

  const infiniteGenders = [...genders, ...genders, ...genders];

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
        {infiniteGenders.map((gender, index) =>
          renderGenderItem(gender, index)
        )}
      </ScrollView>
    </View>
  );
}

export default function SignUp() {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    age: "18",
    gender: "Prefer not to say",
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
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          i18n.changeLanguage(savedLanguage);
          setSelectedLanguage(savedLanguage);  // Actualiza el selector de idioma
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };
    loadSavedLanguage(); // Llama a la función al montar el componente
  }, []);

  const changeLanguage = async (lang) => {
    await i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
    setIsLanguageOptionsVisible(false);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' }
  ];

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
    const emailRegex = /^(?!.*(.)\1{3,})(?!^\d+@)(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@(?:(?!^\d+\.)[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9._]+$/; // Allow uppercase letters
    return usernameRegex.test(username);
  };

  const validateSingleWord = (word) => {
    const hobbyInterestRegex = /^[\p{L}\p{N}\p{P}\p{Zs}\u1F600-\u1F64F\u1F300-\u1F5FF\u1F680-\u1F6FF\u1F700-\u1F77F]+$/u;
    return hobbyInterestRegex.test(word) && [...word].length <= 15; // Contar correctamente caracteres compuestos
  };
  
  

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.id === "account") {
      if (!answers.firstName || !answers.lastName) {
        Alert.alert(t('signup.errors.emptyName'));
        return;
      }
      if (!validateName(answers.firstName) || !validateName(answers.lastName)) {
        Alert.alert(t('signup.errors.invalidName'));
        return;
      }
      if (!answers.email || !validateEmail(answers.email)) {
        Alert.alert(t('signup.errors.invalidEmail'));
        return;
      }
      if (!answers.username || !validateUsername(answers.username)) {
        Alert.alert(t('signup.errors.invalidUsername'));
        return;
      }
      if (!answers.password || !validatePassword(answers.password)) {
        Alert.alert(t('signup.errors.invalidPassword'));
        return;
      }
      if (!acceptedTerms) {
        Alert.alert(t('signup.errors.termsNotAccepted'));
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
        return;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      Alert.alert(t('signup.errors.generic'), error.message);
      return;
    }
    const usernameQuery = query(
      collection(database, "users"),
      where("username", "==", answers.username.trim().toLowerCase()) // Transform to lowercase
    );

    try {
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        Alert.alert(t('signup.errors.usernameInUse'));
        return;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      Alert.alert(t('signup.errors.generic'), error.message);
      return;
    }
    }

    if (currentQuestion.id === "about") {
      if (
        !validateSingleWord(answers.hobby1) ||
        !validateSingleWord(answers.hobby2)
      ) {
        Alert.alert(t('signup.errors.invalidHobbies'));
        return;
      }
      if (
        !validateSingleWord(answers.interest1) ||
        !validateSingleWord(answers.interest2)
      ) {
        Alert.alert(t('signup.errors.invalidInterests'));
        return;
      }
    }

    if (currentQuestion.id === "photos" && !answers.photo1) {
      return;
    }
    if (currentQuestion.id === "photos2" && !answers.photo2) {
      return;
    }
    if (currentQuestion.id === "photos3" && !answers.photo3) {
      return;
    }

    if (currentQuestionIndex < questions.length - 2) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentQuestionIndex === questions.length - 2) {
      await handleSubmit();
    }
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
      const usernameToLower = answers.username.trim().toLowerCase(); // Transform username to lowercase
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
        username: usernameToLower, // Save username in lowercase
      };

      await setDoc(doc(database, "users", user.uid), userData);

      setCurrentQuestionIndex(questions.length - 1);
      setIsSubmitting(false);

      navigation.navigate("Tutorial");
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
      console.log("Image selection was canceled");
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
    behavior={Platform.OS === "ios" ? "padding" : "height"}
>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image
          source={require("../assets/Logo_Invite_Me.png")}
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
                  onPress={() => changeLanguage(lang.code)}
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
          <View>
            <Text style={styles.questionHobies}>
              {t('signup.questions.hobbies')}
            </Text>
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.halfInput, { color: "#4b4b4b" }]}
                placeholder={t('signup.placeholders.hobby1')}
                placeholderTextColor="#4b4b4b"
                onChangeText={(text) => handleAnswer("hobby1", text)}
                value={answers.hobby1}
              />
              <TextInput
                style={[styles.halfInput, { color: "#4b4b4b" }]}
                placeholder={t('signup.placeholders.hobby2')}
                placeholderTextColor="#4b4b4b"
                onChangeText={(text) => handleAnswer("hobby2", text)}
                value={answers.hobby2}
              />
            </View>

            <Text style={styles.questionInterests}>
              {t('signup.questions.interests')}
            </Text>
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.halfInput, { color: "#4b4b4b" }]}
                placeholder={t('signup.placeholders.interest1')}
                placeholderTextColor="#4b4b4b"
                onChangeText={(text) => handleAnswer("interest1", text)}
                value={answers.interest1}
              />
              <TextInput
                style={[styles.halfInput, { color: "#4b4b4b" }]}
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
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <AntDesign name="left" size={24} color="black" />
            </TouchableOpacity>
          )}
          {currentQuestionIndex < questions.length - 1 && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <AntDesign name="right" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ageSelectorContainer: {
    width: ITEM_WIDTH * 3,
    height: ITEM_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
    position: "relative",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 25,
    marginTop: 50,
    textAlign: "center",
    color: "#4d4d4d",
    fontWeight: "500",
  },
  logo: {
    width: 200,
    height: 100,
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
    color: "black",
    fontWeight: "bold",
  },
  ageQuestion: {
    fontSize: 14,
    marginTop: 65,
    marginBottom: 35,
    textAlign: "center",
    color: "black",
    fontWeight: "bold",
  },
  GenderQuestion: {
    fontSize: 14,
    marginVertical: 20,
    marginTop: 110,
    textAlign: "center",
    color: "black",
    fontWeight: "bold",
  },
  questionHobies: {
    fontSize: 14,
    marginTop: 0,
    marginBottom: 35,
    textAlign: "center",
    color: "black",
    fontWeight: "bold",
  },
  questionInterests: {
    fontSize: 14,
    marginTop: 30,
    marginBottom: 35,
    textAlign: "center",
    color: "black",
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
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingLeft: 25,
  },
  input: {
    padding: 10,
    marginBottom: 40,
    borderRadius: 30,
    fontSize: 15,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingLeft: 25,
  },
  inputShort: {
    padding: 10,
    marginBottom: 40,
    borderRadius: 30,
    fontSize: 15,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    width: "65%",
    paddingLeft: 25,
    alignSelf: "center",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
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
    marginBottom: 20,
  },
  halfInput: {
    width: "48%",
    padding: 10,
    borderRadius: 30,
    fontSize: 16,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
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
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 20,
    zIndex: 1,
  },
  selectedOverlayAge: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: ITEM_WIDTH,
    width: ITEM_WIDTH,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
    zIndex: 1,
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
    top: 40,
    right: 20,
    zIndex: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
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
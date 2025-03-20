// utils/signupUtils.js

import { Alert } from "react-native";
import { getDocs, query, where, collection } from "firebase/firestore";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase";

export const handleNext = async ({
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
  setModalVisible, // Nuevo parámetro para abrir el modal
}) => {
  setIsLoading(true);
  const currentQuestion = questions[currentQuestionIndex];

  if (currentQuestion.id === "account") {
    if (!answers.firstName || !answers.lastName) {
      Alert.alert(t("signup.errors.emptyName"));
      setIsLoading(false);
      return;
    }
    if (!validateName(answers.firstName) || !validateName(answers.lastName)) {
      Alert.alert(t("signup.errors.invalidName"));
      setIsLoading(false);
      return;
    }
    if (answers.email.includes(" ")) {
      Alert.alert(t("signup.errors.emailContainsSpaces"));
      setIsLoading(false);
      return;
    }
    if (!answers.email || !validateEmail(answers.email)) {
      Alert.alert(t("signup.errors.invalidEmail"));
      setIsLoading(false);
      return;
    }
    if (!answers.username || !validateUsername(answers.username)) {
      Alert.alert(t("signup.errors.invalidUsername"));
      setIsLoading(false);
      return;
    }
    if (!answers.password || !validatePassword(answers.password)) {
      Alert.alert(t("signup.errors.invalidPassword"));
      setIsLoading(false);
      return;
    }
    if (!acceptedTerms) {
      Alert.alert(t("signup.errors.termsNotAccepted"));
      setIsLoading(false);
      return;
    }

    // Verificar si el email ya está en uso
    try {
      const emailSnapshot = await getDocs(
        query(
          collection(database, "users"),
          where("email", "==", answers.email.trim().toLowerCase())
        )
      );
      if (!emailSnapshot.empty) {
        Alert.alert(t("signup.errors.emailInUse"));
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      Alert.alert(t("signup.errors.generic"), error.message);
      setIsLoading(false);
      return;
    }

    // Si el código aún no se ha enviado, envíalo ahora
    if (!isCodeSent) {
      try {
        await sendVerificationCodeFn({ email: answers.email.trim().toLowerCase() });
        setIsCodeSent(true);
        Alert.alert(
          "Código enviado",
          "Revisa tu email y escribe el código.",
          [{ text: "OK", onPress: () => setModalVisible(true) }] // Se abre el modal tras confirmar
        );
      } catch (error) {
        console.error("Error sending code:", error);
        Alert.alert("Error", "No se pudo enviar el código.");
      }
      setIsLoading(false);
      return;
    }

    // Si el código fue enviado pero aún no verificado, no permitir avanzar
    if (!emailVerified) {
      Alert.alert(
        "Verifica tu email",
        "Debes ingresar el código antes de continuar.",
        [{ text: "OK", onPress: () => setModalVisible(true) }] // Se abre el modal tras confirmar
      );
      setIsLoading(false);
      return;
    }

    // Verificar si el username ya está en uso
    try {
      const usernameSnapshot = await getDocs(
        query(
          collection(database, "users"),
          where("username", "==", answers.username.trim().toLowerCase())
        )
      );
      if (!usernameSnapshot.empty) {
        Alert.alert(t("signup.errors.usernameInUse"));
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      Alert.alert(t("signup.errors.generic"), error.message);
      setIsLoading(false);
      return;
    }
  }

  if (currentQuestion.id === "about") {
    // Validaciones específicas para "about" (si es necesario)
  }

  if (currentQuestion.id === "about2") {
    // Aquí verificamos que se hayan seleccionado 4 intereses
    const totalSelected = [
      answers.interest1,
      answers.interest2,
      answers.interest3,
      answers.interest4,
    ].filter(Boolean).length;
    if (totalSelected < 4) {
      Alert.alert(t("signup.errors.selectFourInterests"));
      setIsLoading(false);
      return;
    }
    if (
      !validateSingleWord(answers.interest1) ||
      !validateSingleWord(answers.interest2) ||
      !validateSingleWord(answers.interest3) ||
      !validateSingleWord(answers.interest4)
    ) {
      Alert.alert(t("signup.errors.invalidInterests"));
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

  // Navegar a la siguiente pregunta o hacer submit
  if (currentQuestionIndex < questions.length - 2) {
    setCurrentQuestionIndex((prev) => prev + 1);
  } else if (currentQuestionIndex === questions.length - 2) {
    await handleSubmit();
  }
  setIsLoading(false);
};

export function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
  


export const handleVerifyCode = async ({
  answers,
  verificationCode,
  setIsLoading,
  verifyCodeFn,
  t,
  setEmailVerified,
}) => {
  setIsLoading(true);
  try {
    const result = await verifyCodeFn({ 
      email: answers.email.trim().toLowerCase(), 
      code: verificationCode 
    });
    if (result.data.success) {
      setEmailVerified(true);
      Alert.alert("✅ Verificado", "Email verificado correctamente.");
    } else {
      Alert.alert("❌ Código incorrecto", "Inténtalo de nuevo.");
    }
  } catch (error) {
    console.error("Error verificando código:", error);
    Alert.alert("❌ Error", "Código inválido o expirado.");
  }
  setIsLoading(false);
};


export const validateName = (name) => {
    const nameRegex = /^[a-zA-ZÀ-ÿãÃçÇñÑ ]+$/;
    return nameRegex.test(name);
};

export const validateEmail = (email) => {
    const emailRegex =
      /^(?!.*(.)\1{3,})(?!^\d+@)(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]{3,}(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@(?:(?!^\d+\.)[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
    return passwordRegex.test(password);
};

export const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    return usernameRegex.test(username);
};

export const validateSingleWord = (word) => {
    const hobbyInterestRegex =
      /^[\p{L}\p{N}\p{P}\p{Zs}\u1F600-\u1F64F\u1F300-\u1F5FF\u1F680-\u1F6FF\u1F700-\u1F77F]+$/u;
    return hobbyInterestRegex.test(word) && [...word].length <= 15;
};


export const handleInterestSelection = (key, answers, handleAnswer, t) => {
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


  export const compressImage = async (uri) => {
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


export const uploadImage = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `photos/${filename}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    return null;
  }
};


export const pickImage = async (photoNumber, handleAnswer, handleNext) => {
    try {
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
    } catch (error) {
      console.error("Error al seleccionar la imagen:", error);
    }
  };


export const handleBack = (currentQuestionIndex, setCurrentQuestionIndex) => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
};
  

  


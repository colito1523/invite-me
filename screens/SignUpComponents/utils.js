// utils/signupUtils.js

import { Alert } from "react-native";
import { getDocs, query, where, collection } from "firebase/firestore";

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
        Alert.alert("Código enviado", "Revisa tu email y escribe el código.");
      } catch (error) {
        console.error("Error sending code:", error);
        Alert.alert("Error", "No se pudo enviar el código.");
      }
      setIsLoading(false);
      return;
    }

    // Si el código fue enviado pero aún no verificado, no permitir avanzar
    if (!emailVerified) {
      Alert.alert("Verifica tu email", "Debes ingresar el código antes de continuar.");
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

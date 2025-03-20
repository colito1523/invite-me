import React from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TermsAndConditionsModal from "../../Components/Terms-And-Conditions/terms-and-conditions-modal";
import styles from "./styles";

const AccountForm = ({
  answers,
  handleAnswer,
  showPassword,
  setShowPassword,
  isCodeSent,
  emailVerified,
  verificationCode,
  setVerificationCode,
  isLoading,
  handleVerifyCode,
  t,
  acceptedTerms,
  setAcceptedTerms,
  verifyCodeFn,      // nuevo prop
  setIsLoading,      // nuevo prop
  setEmailVerified,  // nuevo prop
}) => {
  return (
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
        editable={!isCodeSent}
      />
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
                t,
                setEmailVerified,
                setIsLoading,
                verifyCodeFn,  // se pasa la función aquí
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
        <TouchableOpacity style={styles.eyeIconButton} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Términos y Condiciones */}
      <View style={styles.termsContainer}>
        <TouchableOpacity style={styles.checkbox} onPress={() => setAcceptedTerms(!acceptedTerms)}>
          {acceptedTerms && <Ionicons name="checkmark" size={20} color="black" />}
        </TouchableOpacity>
        <View style={styles.termsTextContainer}>
          <Text style={styles.termsText}>{t("signup.termsAndConditions.acceptText")} </Text>
          <TermsAndConditionsModal />
        </View>
      </View>
    </View>
  );
};

export default AccountForm;

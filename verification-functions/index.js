// verification-functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializa Admin si no se hizo antes
admin.initializeApp();

const db = admin.firestore();

// Ejemplo con nodemailer
const nodemailer = require("nodemailer");

// Usar config de funciones (ver más abajo)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

/**
 * sendVerificationCode
 * 1) Genera un código (OTP) de 6 dígitos
 * 2) Lo guarda en Firestore (colección "emailVerifications")
 * 3) Envía un correo al usuario con ese código
 */
exports.sendVerificationCode = functions.https.onCall(async (data, context) => {
  console.log("Verificación iniciada"); // 👈 agregá esto
  const { email, language = "en" } = data;
  if (!email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email is required."
    );
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await db.collection("emailVerifications").doc(email).set({
    code,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    verified: false,
  });

  // Traducciones
  const translations = {
    es: {
      subject: "Tu código de verificación de Invite Me",
      text: `¡Hola!

Gracias por registrarte en Invite Me. Para verificar tu correo electrónico y completar tu registro, por favor ingresa el siguiente código en la app:

${code}

Este código expirará en 10 minutos. Si no solicitaste esto, simplemente ignora este mensaje.

¡Nos vemos adentro!
El equipo de Invite Me`,
    },
    en: {
      subject: "Your Invite Me Verification Code",
      text: `Hello!

Thank you for signing up for Invite Me! To verify your email and complete your registration, please enter the following code in the app:

${code}

This code will expire in 10 minutes. If you didn't request this, you can ignore this email.

See you inside!
The Invite Me Team`,
    },
    pt: {
      subject: "O teu código de verificação do Invite Me",
      text: `Olá!

Obrigado por te registares no Invite Me. Para verificares o teu e-mail e completares o registo, introduz o seguinte código na app:

${code}

Este código expira em 10 minutos. Se não foste tu a solicitar isto, ignora este e-mail.

Até já!
A equipa do Invite Me`,
    },
  };

  const selected = translations[language] || translations["en"];

  const mailOptions = {
    from: "Invite Me <tu_correo@gmail.com>",
    to: email,
    subject: selected.subject,
    text: selected.text,
  };

  await transporter.sendMail(mailOptions);

  return { success: true };
});

/**
 * verifyCode
 * 1) Toma email y code
 * 2) Verifica que coincida con el doc en Firestore
 * 3) Chequea que no haya expirado
 * 4) Marca "verified: true" si todo ok
 */
exports.verifyCode = functions.https.onCall(async (data, context) => {
  const { email, code } = data;
  if (!email || !code) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email and code are required."
    );
  }

  const docRef = db.collection("emailVerifications").doc(email);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new functions.https.HttpsError("not-found", "No code found.");
  }

  const { code: storedCode, createdAt, verified } = docSnap.data();

  if (verified) {
    throw new functions.https.HttpsError(
      "already-exists",
      "Email already verified."
    );
  }
  if (storedCode !== code) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Incorrect code."
    );
  }

  // Ejemplo: expira a los 5 min (300 seg)
  const now = admin.firestore.Timestamp.now();
  const diffSeconds = now.seconds - createdAt.seconds;
  if (diffSeconds > 600) {
    throw new functions.https.HttpsError("deadline-exceeded", "Code expired.");
  }

  // Marcamos como verificado
  await docRef.update({ verified: true });

  return { success: true };
});

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
    pass: functions.config().email.pass
  }
});

/**
 * sendVerificationCode
 * 1) Genera un código (OTP) de 6 dígitos
 * 2) Lo guarda en Firestore (colección "emailVerifications")
 * 3) Envía un correo al usuario con ese código
 */
exports.sendVerificationCode = functions.https.onCall(async (data, context) => {
  const { email } = data;
  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required.");
  }

  // Generar OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Guardar en Firestore
  await db.collection("emailVerifications").doc(email).set({
    code,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    verified: false,
  });

  // Enviar correo
  const mailOptions = {
    from: "TuApp <tu_correo@gmail.com>",
    to: email,
    subject: "Código de verificación",
    text: `Tu código es: ${code}`
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
    throw new functions.https.HttpsError("invalid-argument", "Email and code are required.");
  }

  const docRef = db.collection("emailVerifications").doc(email);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new functions.https.HttpsError("not-found", "No code found.");
  }

  const { code: storedCode, createdAt, verified } = docSnap.data();

  if (verified) {
    throw new functions.https.HttpsError("already-exists", "Email already verified.");
  }
  if (storedCode !== code) {
    throw new functions.https.HttpsError("failed-precondition", "Incorrect code.");
  }

  // Ejemplo: expira a los 5 min (300 seg)
  const now = admin.firestore.Timestamp.now();
  const diffSeconds = now.seconds - createdAt.seconds;
  if (diffSeconds > 300) {
    throw new functions.https.HttpsError("deadline-exceeded", "Code expired.");
  }

  // Marcamos como verificado
  await docRef.update({ verified: true });

  return { success: true };
});

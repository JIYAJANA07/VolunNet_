const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "../firebasedata.json");

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully with firebasedata.json");
  } catch (error) {
    console.warn("Warning: Failed to initialize Firebase Admin:", error.message);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT env");
  } catch (error) {
    console.warn("Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT:", error.message);
  }
} else {
  console.warn("Note: firebasedata.json not found. Running in fallback mode without active Firebase push/auth.");
}

module.exports = admin;
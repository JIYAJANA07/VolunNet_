const admin = require("../firebase/firebase");

const sendNotification = async (token, title, body, data = {}) => {
  try {
    if (!admin.apps || admin.apps.length === 0) {
      console.warn("FCM push skipped: Firebase Admin is not initialized");
      return {
        success: false,
        error: "Firebase Admin is not initialized"
      };
    }

    if (!token) {
      throw new Error("FCM token is required");
    }

    const message = {
      token,
      notification: {
        title,
        body
      },
      data
    };

    const response = await admin.messaging().send(message);

    return {
      success: true,
      messageId: response
    };
  } catch (error) {
    console.error("Notification error:", error);

    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendNotification
};
const express = require("express");

const router = express.Router();

const {
    saveFcmToken,
    createNotification,
    getNotifications,
    markAsRead
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const { body, oneOf } = require("express-validator");

// Save Firebase FCM token
router.post(
    "/fcm-token",
    authMiddleware,
    body("fcmToken").notEmpty().withMessage("fcmToken is required"),
    validationMiddleware,
    saveFcmToken
);

// Send notification
router.post(
    "/send",
    authMiddleware,
    oneOf([
        [body("user").notEmpty().withMessage("user ID is required")],
        [body("eventId").notEmpty().withMessage("eventId is required")]
    ]),
    body("title").notEmpty().withMessage("title is required"),
    body("message").notEmpty().withMessage("message is required"),
    validationMiddleware,
    createNotification
);

// Create notification
router.post(
    "/",
    authMiddleware,
    oneOf([
        [body("user").notEmpty().withMessage("user ID is required")],
        [body("eventId").notEmpty().withMessage("eventId is required")]
    ]),
    body("title").notEmpty().withMessage("title is required"),
    body("message").notEmpty().withMessage("message is required"),
    validationMiddleware,
    createNotification
);

// Get notifications
router.get("/", authMiddleware, getNotifications);

// Mark notification as read
router.patch("/:id/read", authMiddleware, markAsRead);

module.exports = router;
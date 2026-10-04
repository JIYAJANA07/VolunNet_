const express = require("express");

const {
    createHour,
    getHours,
    getHourById,
    updateHour,
    deleteHour,
    getHoursByUserId
} = require("../controllers/hourController");

const authMiddleware = require("../middleware/authMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const { body } = require("express-validator");

const router = express.Router();

// Add volunteer hours
router.post(
    "/",
    authMiddleware,
    body("event").notEmpty().withMessage("event ID is required"),
    body("hours").isFloat({ min: 0 }).withMessage("hours must be a positive number"),
    validationMiddleware,
    createHour
);

// Get all hours
router.get("/", authMiddleware, getHours);

// Get hours by user ID
router.get("/user/:userId", authMiddleware, getHoursByUserId);

// Get single hour record
router.get("/:id", authMiddleware, getHourById);

// Update hours
router.put("/:id", authMiddleware, updateHour);

// Delete hours
router.delete("/:id", authMiddleware, deleteHour);

module.exports = router;
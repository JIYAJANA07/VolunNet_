const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const {
    getMyCertificates,
    getUserCertificates,
    issueCertificate
} = require("../controllers/certificateController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");

// Get logged-in user's certificates
router.get("/", authMiddleware, getMyCertificates);

// Get certificates by user ID
router.get("/user/:userId", authMiddleware, getUserCertificates);

// Issue certificate (Admin only)
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    body("userId").notEmpty().withMessage("userId is required"),
    body("title").notEmpty().withMessage("title is required"),
    validationMiddleware,
    issueCertificate
);

module.exports = router;

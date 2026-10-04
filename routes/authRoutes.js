const express = require("express");
const { body, oneOf } = require("express-validator");
const validationMiddleware = require("../middleware/validationMiddleware");

const router = express.Router();

const {
    register,
    login
} = require("../controllers/authController");

router.post(
    "/register",
    oneOf([
        [
            body("name").trim().notEmpty().withMessage("Name is required"),
            body("email").isEmail().withMessage("Valid email is required"),
            body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
        ],
        [
            body("idToken").notEmpty().withMessage("Firebase idToken is required")
        ]
    ]),
    validationMiddleware,
    register
);

router.post(
    "/login",
    oneOf([
        [
            body("email").isEmail().withMessage("Valid email is required"),
            body("password").notEmpty().withMessage("Password is required")
        ],
        [
            body("idToken").notEmpty().withMessage("Firebase idToken is required")
        ]
    ]),
    validationMiddleware,
    login
);

module.exports = router;
const express = require("express");
const router = express.Router();

const {
    getMyBadges,
    getUserBadges
} = require("../controllers/badgeController");

const authMiddleware = require("../middleware/authMiddleware");

// Get logged-in user's badges
router.get("/", authMiddleware, getMyBadges);

// Get badges for a specific user
router.get("/user/:userId", authMiddleware, getUserBadges);

module.exports = router;

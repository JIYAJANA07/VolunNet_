const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getImpactReport,
  getEventReport
} = require("../controllers/reportController");

router.get("/impact", authMiddleware, getImpactReport);
router.get("/events", authMiddleware, getEventReport);

module.exports = router;
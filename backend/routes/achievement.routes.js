const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { createAchievement } = require("../controllers/achievement.controller");

router.post("/", auth, createAchievement);

module.exports = router;

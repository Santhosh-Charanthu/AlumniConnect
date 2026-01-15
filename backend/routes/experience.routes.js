const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { createExperience } = require("../controllers/experience.controller");

router.post("/", auth, createExperience);

module.exports = router;

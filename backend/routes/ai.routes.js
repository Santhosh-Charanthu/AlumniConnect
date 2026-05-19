const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getMatchedAlumni } = require("../controllers/ai.controller");

router.get("/matched-alumni", auth, getMatchedAlumni);
module.exports = router;

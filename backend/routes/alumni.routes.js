const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  getMyProfile,
  updateAbout,
} = require("../controllers/alumni.controller");

router.get("/profile", auth, getMyProfile);
router.patch("/about", auth, updateAbout);

module.exports = router;

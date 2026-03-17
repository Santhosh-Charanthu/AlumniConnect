const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/auth.middleware");
const {
  getMyProfile,
  updateProfile,
  getMySessions,
  getDashboard,
} = require("../controllers/student.controller");

router.get("/profile", auth, getMyProfile);
router.patch("/profile", upload.single("profileImage"), auth, updateProfile);
router.get("/my-sessions", auth, getMySessions);
router.get("/dashboard", auth, getDashboard);

module.exports = router;

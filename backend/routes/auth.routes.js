const express = require("express");
const router = express.Router();
const { uploadProfileImage } = require("../middleware/upload.middleware");
const { loginLimiter } = require("../middleware/rateLimiter");
const {
  register,
  login,
  sendOtp,
  verifyOtp,
} = require("../controllers/auth.controller");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", ...uploadProfileImage, register);
router.post("/login", loginLimiter, login);

module.exports = router;

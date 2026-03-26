const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const { register, login, sendOtp, verifyOtp } = require("../controllers/auth.controller");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", upload.single("profileImage"), register);
router.post("/login", login);

module.exports = router;

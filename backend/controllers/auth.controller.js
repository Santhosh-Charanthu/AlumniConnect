const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const StudentProfile = require("../models/Student");
const AlumniProfile = require("../models/Alumni");
const cloudinary = require("../config/cloudinary");
const { sendOtpEmail } = require("../config/mailer");

// ─── helpers ────────────────────────────────────────────────────────────────

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// ─── STEP 1: collect form data, upload image, send OTP ──────────────────────

module.exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Validate .edu domain
    const parts = email.split("@");
    if (parts.length !== 2 || !parts[1].toLowerCase().includes(".edu")) {
      return res.status(400).json({
        success: false,
        message: "Please use your college email with a .edu domain",
      });
    }

    // Check for existing verified user
    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Upsert a temporary unverified user record to hold the OTP
    await User.findOneAndUpdate(
      { email },
      { otp, otpExpiresAt, isVerified: false },
      { upsert: true, new: true },
    );

    await sendOtpEmail(email, otp);

    return res
      .status(200)
      .json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP. Try again." });
  }
};

// ─── STEP 2: verify OTP ─────────────────────────────────────────────────────

module.exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.otp) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.otp !== otp.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again." });
    }

    // Clear OTP fields — skip full validation since the user doc is still incomplete
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res
      .status(500)
      .json({ success: false, message: "OTP verification failed. Try again." });
  }
};

// ─── STEP 3: complete registration after OTP verified ───────────────────────

module.exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      college,
      department,
      batchYear,
      company,
      jobTitle,
      bio,
      hourlyRate,
      availability,
      skills,
      interests,
    } = req.body;

    if (!name || !email || !password || !role || !college) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    if (!["student", "alumni"].includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role selected" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Profile image is required" });
    }

    // Must have gone through OTP flow (otp fields cleared = verified)
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }
    if (!existingUser || existingUser.otp) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email with OTP first",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImage = { url: req.file.path, filename: req.file.filename };

    // Update the placeholder user with full data
    existingUser.name = name;
    existingUser.password = hashedPassword;
    existingUser.role = role;
    existingUser.college = college;
    existingUser.isVerified = true;
    await existingUser.save();

    if (role === "student") {
      const parsedInterests = interests ? JSON.parse(interests) : [];
      await new StudentProfile({
        userId: existingUser._id,
        department,
        batchYear,
        interests: parsedInterests,
        profileImage,
      }).save();
    }

    if (role === "alumni") {
      const parsedSkills = skills ? JSON.parse(skills) : [];
      await new AlumniProfile({
        userId: existingUser._id,
        department,
        batchYear,
        company,
        jobTitle,
        bio,
        hourlyRate,
        availability,
        skills: parsedSkills,
        profileImage,
      }).save();
    }

    const token = jwt.sign(
      { userId: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful 🎉",
      token,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        role: existingUser.role,
      },
    });
  } catch (err) {
    console.error("register error:", err);

    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message: firstError });
    }

    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }

    return res
      .status(500)
      .json({ success: false, message: "Signup failed. Please try again." });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    // const explainResult = await User.findOne({ email }).explain(
    //   "executionStats",
    // );
    // console.log(explainResult);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // if (!user.isVerified) {
    //   return res.status(403).json({ success: false, message: "Please verify your email before logging in" });
    // }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: "Invalid role" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful ✅",
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

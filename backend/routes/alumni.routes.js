const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/auth.middleware");
const {
  getMyProfile,
  updateAbout,
  createSession,
  getMySessions,
} = require("../controllers/alumni.controller");

router.get("/profile", auth, getMyProfile);
router.patch("/about", auth, updateAbout);
router.post(
  "/create-session",
  upload.single("coverImage"),
  auth,
  createSession,
);
// /routes/sessionRoutes.js
router.get("/my-sessions", auth, getMySessions);

module.exports = router;

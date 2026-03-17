const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/auth.middleware");
const { optionalAuth } = require("../middleware/auth.middleware");
const {
  getMyProfile,
  updateAbout,
  createSession,
  getMySessions,
  getSessionById,
  updateSession,
  deleteSession,
  searchAlumni,
  getAlumniById,
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

router.get("/search", optionalAuth, searchAlumni);
router.get("/:id", getAlumniById);

router.get("/sessions/:id", auth, getSessionById);
router.patch("/sessions/:id", upload.single("coverImage"), auth, updateSession);
router.delete("/sessions/:id", auth, deleteSession);

module.exports = router;

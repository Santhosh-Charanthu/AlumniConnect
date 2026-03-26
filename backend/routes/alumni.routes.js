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
  getSessionParticipants,
  getNotifications,
  markNotificationsRead,
  startSession,
  endSession,
} = require("../controllers/alumni.controller");

router.get("/profile", auth, getMyProfile);
router.patch("/about", auth, updateAbout);
router.post("/create-session", upload.single("coverImage"), auth, createSession);
router.get("/my-sessions", auth, getMySessions);
router.get("/notifications", auth, getNotifications);
router.patch("/notifications/read", auth, markNotificationsRead);
router.get("/search", optionalAuth, searchAlumni);
router.get("/sessions/:id", auth, getSessionById);
router.get("/sessions/:id/participants", auth, getSessionParticipants);
router.patch("/sessions/:id/start", auth, startSession);
router.patch("/sessions/:id/end", auth, endSession);
router.patch("/sessions/:id", upload.single("coverImage"), auth, updateSession);
router.delete("/sessions/:id", auth, deleteSession);
// Keep wildcard last so it doesn't swallow specific routes
router.get("/:id", getAlumniById);

module.exports = router;

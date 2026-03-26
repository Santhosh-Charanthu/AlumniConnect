const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/auth.middleware");
const {
  getMyProfile,
  updateProfile,
  getMySessions,
  getDashboard,
  getUpcomingSessions,
  registerSession,
  unregisterSession,
  getSessionById,
  getNotifications,
  markNotificationsRead,
  joinGroup,
  markAttendance,
  getSessionMeetLink,
  submitReview,
  getSessionReviews,
  updateReview,
  deleteReview,
} = require("../controllers/student.controller");

router.get("/profile", auth, getMyProfile);
router.patch("/profile", upload.single("profileImage"), auth, updateProfile);
router.get("/my-sessions", auth, getMySessions);
router.get("/dashboard", auth, getDashboard);
router.get("/upcoming-sessions", auth, getUpcomingSessions);
router.get("/sessions/:id", auth, getSessionById);
router.post("/register-session/:sessionId", auth, registerSession);
router.delete("/unregister-session/:sessionId", auth, unregisterSession);
router.get("/notifications", auth, getNotifications);
router.patch("/notifications/read", auth, markNotificationsRead);
router.post("/groups/:groupId/join", auth, joinGroup);
router.post("/sessions/:sessionId/attendance", auth, markAttendance);
router.get("/sessions/:sessionId/meet-link", auth, getSessionMeetLink);
router.post("/sessions/:sessionId/review", auth, submitReview);
router.get("/sessions/:sessionId/reviews", getSessionReviews);
router.patch("/reviews/:reviewId", auth, updateReview);
router.delete("/reviews/:reviewId", auth, deleteReview);

module.exports = router;

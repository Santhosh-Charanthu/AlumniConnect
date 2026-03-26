const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { chatUpload } = require("../middleware/upload.middleware");
const {
  getDMHistory,
  getDMConversations,
  createGroup,
  getMyGroups,
  getGroupHistory,
  addMembers,
  leaveGroup,
  getUnreadCount,
  uploadChatMedia,
  proxyDownload,
} = require("../controllers/chat.controller");

// Direct messages
router.get("/dm/conversations", auth, getDMConversations);
router.get("/dm/:userId", auth, getDMHistory);

// Groups
router.post("/groups", auth, createGroup);
router.get("/groups", auth, getMyGroups);
router.get("/groups/:groupId/messages", auth, getGroupHistory);
router.post("/groups/:groupId/members", auth, addMembers);
router.delete("/groups/:groupId/leave", auth, leaveGroup);
router.get("/unread-count", auth, getUnreadCount);

// Media upload
router.post("/upload-media", auth, (req, res, next) => {
  chatUpload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, uploadChatMedia);

// Proxy download (bypasses Cloudinary CORS for raw files)
router.get("/proxy-download", auth, proxyDownload);

module.exports = router;

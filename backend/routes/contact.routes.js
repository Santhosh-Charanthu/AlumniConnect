const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../config/mailer");

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Name, email, and message are required." });
  }

  try {
    await sendContactEmail({ name, email, subject: subject || "general", message });
    res.json({ success: true });
  } catch (err) {
    console.error("Contact email error:", err);
    res.status(500).json({ success: false, message: "Failed to send message. Please try again." });
  }
});

module.exports = router;

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "session_booking",
        "group_invite",
        "session_cancelled",
        "new_session",
        "session_live",
        "session_completed",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

notificationSchema.post("save", function (doc) {
  const sendNotificationEmail = require("../utils/sendNotificationEmail");
  sendNotificationEmail(doc); // fire-and-forget
});

module.exports = mongoose.model("Notification", notificationSchema);

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For direct messages
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // For group messages
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupChat",
      default: null,
    },
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    edited: {
      type: Boolean,
      default: false,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    // Media attachment
    mediaUrl: {
      type: String,
      default: null,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "pdf", null],
      default: null,
    },
    mediaName: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast DM thread queries
messageSchema.index({ senderId: 1, receiverId: 1 });
// Index for group message queries
messageSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);

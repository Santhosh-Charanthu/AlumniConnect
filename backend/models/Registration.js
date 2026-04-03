const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true, // 🔥 soft delete support
    },

    attended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// 🔥 Prevent duplicate registrations
registrationSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);

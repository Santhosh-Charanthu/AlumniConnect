const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "free",
        "paid",
        "refund_pending",
        "refunded",
        "cancelled",
      ],
      default: "pending",
    },

    razorpayPaymentId: {
      type: String,
    },

    attended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Registration", registrationSchema);

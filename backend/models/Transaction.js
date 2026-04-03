const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true, // in rupees
    },

    razorpayOrderId: {
      type: String,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      index: true,
    },

    status: {
      type: String,
      enum: ["paid", "pending", "refund_pending", "refunded", "failed"],
      default: "paid",
    },
  },
  { timestamps: true },
);

// 🔥 Ensure one transaction per user per session
transactionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model("Transaction", transactionSchema);

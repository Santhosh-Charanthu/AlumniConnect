const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentGateway: {
      type: String,
      default: "razorpay",
    },

    status: {
      type: String,
      enum: ["created", "success", "failed"],
      default: "created",
    },

    transactionId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

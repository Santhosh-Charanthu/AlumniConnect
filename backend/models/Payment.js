const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: Number,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Session = require("../models/Session");
const Registration = require("../models/Registration");
const registerStudent = require("../utils/registerStudent");
const Transaction = require("../models/Transaction");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Session not available for booking",
      });
    }

    if (session.deadline && new Date() > session.deadline) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline passed",
      });
    }

    // Check if already booked
    const existing = await Registration.findOne({
      sessionId,
      studentId: userId,
      isActive: true,
    });

    if (existing) {
      return res.json({
        success: false,
        message: "You already booked this session",
      });
    }

    const existingTx = await Transaction.findOne({
      userId,
      sessionId,
      status: "paid",
    });

    if (existingTx) {
      return res.json({
        success: false,
        message: "Payment already completed",
      });
    }

    const order = await razorpay.orders.create({
      amount: session.price * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.log("error: ", err);
    res.status(500).json({
      success: false,
      message: "Order failed",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  const userId = req.user.userId;
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sessionId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.log("❌ Signature mismatch");
      return res
        .status(400)
        .json({ success: false, message: "Signature mismatch" });
    }

    const session = await Session.findById(sessionId);
    console.log("session:", session?._id, "isPaid:", session?.isPaid);

    if (!session) {
      return res
        .status(400)
        .json({ success: false, message: "Session not found" });
    }
    if (!session.isPaid) {
      return res
        .status(400)
        .json({ success: false, message: "Session is not a paid session" });
    }

    let transaction = await Transaction.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (transaction) {
      return res.json({ success: true, alreadyBooked: true });
    }

    // Create new transaction after verification
    transaction = await Transaction.create({
      userId,
      sessionId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: session.price,
      status: "paid",
    });

    // Register the student
    try {
      await registerStudent({
        userId,
        sessionId,
        req,
      });
    } catch (err) {
      // rollback transaction
      transaction.status = "pending";
      await transaction.save();

      throw err;
    }

    res.json({ success: true });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ RAZORPAY_WEBHOOK_SECRET is not set in .env");
      return res
        .status(500)
        .json({ success: false, message: "Webhook secret not configured" });
    }

    const signature = req.headers["x-razorpay-signature"];

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString());
    const eventType = event.event;

    console.log("📩 Webhook Event:", eventType);

    if (eventType === "refund.processed") {
      const refund = event.payload.refund.entity;
      await Transaction.findOneAndUpdate(
        { razorpayPaymentId: refund.payment_id },
        { status: "refunded" },
      );
      console.log("💸 Refund completed via webhook:", refund.payment_id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ success: false });
  }
};

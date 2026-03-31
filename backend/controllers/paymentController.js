const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Session = require("../models/Session");
const Registration = require("../models/Registration");
const registerStudent = require("../utils/registerStudent");

exports.createOrder = async (req, res) => {
  try {
    const { studentId, sessionId } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // ❗ Check if already booked
    const existing = await Registration.findOne({
      sessionId,
      studentId,
      paymentStatus: "paid",
    });

    if (existing) {
      return res.json({
        success: false,
        message: "You already booked this session",
      });
    }

    // ✅ Create pending registration (important)
    // await Registration.findOneAndUpdate(
    //   { sessionId, studentId },
    //   { paymentStatus: "pending" },
    //   { upsert: true, new: true }
    // );

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
  console.log("🔥 HIT verify-payment API");
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      studentId,
      sessionId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    const session = await Session.findById(sessionId);

    if (!session || !session.isPaid) {
      return res.status(400).json({ success: false });
    }

    // ❗ Check if already paid (not refunded)
    const existing = await Registration.findOne({
      sessionId,
      studentId,
      paymentStatus: "paid",
    });

    if (existing) {
      return res.json({ success: true, alreadyBooked: true });
    }

    // ✅ Save Payment
    const payment = await Payment.create({
      amount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: "success",
    });

    console.log(razorpay_payment_id);

    await registerStudent({
      userId: studentId,
      sessionId,
      req,
      razorpayPaymentId: razorpay_payment_id,
    });

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
      await Registration.findOneAndUpdate(
        { razorpayPaymentId: refund.payment_id },
        { paymentStatus: "refunded" },
      );
      console.log("💸 Refund completed via webhook:", refund.payment_id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ success: false });
  }
};

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");

const {
  createOrder,
  verifyPayment,
  handleWebhook,
} = require("../controllers/paymentController");

router.post("/create-order", auth, createOrder);
router.post("/verify-payment", auth, verifyPayment);
router.post("/webhook", handleWebhook);

module.exports = router;

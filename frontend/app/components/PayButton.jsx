"use client";

import axios from "axios";

export default function PayButton() {

  const handlePayment = async () => {
    try {
      // 🔥 1. Create order from backend
      const { data } = await axios.post(
        "http://localhost:5000/api/payment/create-order",
        { amount: 1 }
      );

      const order = data.order;
      console.log(order)

      // 🔥 2. Razorpay options
      const options = {
        key: `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}`, // your Razorpay KEY_ID
        // amount: order.amount,
        currency: "INR",
        name: "AlumniConnect",
        description: "Session Booking",
        order_id: order.id,

        // 🔐 3. Handler after payment success
        handler: async function (response) {
          console.log("Payment Success:", response);

          const verifyRes = await axios.post(
            "http://localhost:5000/api/payment/verify-payment",
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: 1
            }
          );

          if (verifyRes.data.success) {
            alert("Payment Verified ✅");
          } else {
            alert("Verification Failed ❌");
          }
        },

        prefill: {
          name: "Santhosh",
          email: "test@gmail.com",
          contact: "9999999999"
        },

        theme: {
          color: "#3399cc"
        }
      };

      // 🔥 4. Open Razorpay
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.log("Payment Failed:", response);
        alert("Payment Failed ❌");
      });

      rzp.open();

    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <button
      onClick={handlePayment}
      style={{
        padding: "10px 20px",
        background: "#3399cc",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer"
      }}
    >
      Pay ₹1
    </button>
  );
}
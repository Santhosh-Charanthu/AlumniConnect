"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, Tag, CheckCircle } from "lucide-react";
import { authFetch } from "../../../../../src/services/authFetch";
import axios from "axios";
import "../../explore-sessions/explore-sessions.css";
import Loader from "../../../../components/Loader";
import { useToast } from "../../../../context/ToastContext";

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast, showToastAfterRedirect } = useToast();
  const [studentId, setStudentId] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/sessions/${id}`,
        );
        const data = await res.json();
        if (data.success) {
          setSession(data.session);
          setStudentId(data.userId);
        }
        console.log(session);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePayment = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/create-order`,
        { sessionId: id },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!data.success) {
        showToast("error", data.message || "Could not create order");
        return;
      }

      const order = data.order;

      // 🔥 2. Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "AlumniConnect",
        description: "Session Booking",
        order_id: order.id,

        // 🔐 3. Handler after payment success
        handler: async function (response) {
          console.log("Payment Success:", response);

          const verifyRes = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/verify-payment`,
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: session.price,
              sessionId: id,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (verifyRes.data.success) {
            setShowConfirm(false);
            showToastAfterRedirect(
              "success",
              "Payment successful! You're registered for this session.",
            );
            window.location.href = `/student/session/${id}`;
          } else {
            showToast("error", "Verification Failed ❌");
          }
        },

        prefill: {
          name: "Santhosh",
          email: "test@gmail.com",
          contact: "9999999999",
        },

        theme: {
          color: "#3399cc",
        },
      };

      // 🔥 4. Open Razorpay
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.log("Payment Failed:", response);
        showToast("error", "Payment Failed ❌");
      });

      rzp.open();
    } catch (error) {
      console.error(error);
      showToast("error", "Something went wrong");
    }
  };

  const handleConfirm = async () => {
    setBooking(true);
    try {
      if (session.isPaid) {
        await handlePayment();
      } else if (!session.isPaid) {
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/register-session/${id}`,
          { method: "POST" },
        );
        const data = await res.json();
        if (data.success) {
          setShowConfirm(false);
          setSession((prev) => ({
            ...prev,
            isRegistered: true,
            currentSeats: (prev.currentSeats || 0) + 1,
          }));
          showToast("success", "Session booked successfully");
        } else {
          setShowConfirm(false);
          showToast("error", data.message || "Failed to book session");
        }
      } else {
        showToast("error", "Failed to book session");
      }
    } catch (err) {
      setShowConfirm(false);
      showToast("error", "Failed to book session");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <Loader />;
  if (!session) return <div style={{ padding: 30 }}>Session not found.</div>;

  const isFullyBooked = false; // no seat limit

  return (
    <>
      <div className="es-detail-page">
        <button className="es-back-btn" onClick={() => router.back()}>
          ← Back to Sessions
        </button>

        {session.coverImage?.url && (
          <img
            src={session.coverImage.url}
            alt={session.title}
            className="es-detail-cover"
          />
        )}

        <div className="es-detail-body">
          <div className="es-detail-main">
            {session.category && (
              <span className="es-category">{session.category}</span>
            )}
            <h1 className="es-detail-title">{session.title}</h1>

            {session.alumni && (
              <div className="es-alumni-row" style={{ marginBottom: "20px" }}>
                {session.alumni.profileImage?.url ? (
                  <img
                    src={session.alumni.profileImage.url}
                    alt={session.alumni.name}
                    className="es-alumni-avatar"
                  />
                ) : (
                  <div className="es-alumni-avatar-placeholder">
                    {session.alumni.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="es-alumni-name">{session.alumni.name}</span>
                  {session.alumni.jobTitle && (
                    <span className="es-alumni-job">
                      {session.alumni.jobTitle}
                    </span>
                  )}
                </div>
              </div>
            )}

            {session.description && (
              <div className="es-detail-section">
                <h3>About this session</h3>
                <p>{session.description}</p>
              </div>
            )}
          </div>

          <div className="es-detail-sidebar">
            <div className="es-sidebar-card">
              <div className="es-sidebar-row">
                <Calendar size={16} />
                <div>
                  <label>Date</label>
                  <span>
                    {new Date(session.startTime).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="es-sidebar-row">
                <Clock size={16} />
                <div>
                  <label>Time</label>
                  <span>
                    {new Date(session.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <div className="es-sidebar-row">
                <Clock size={16} />
                <div>
                  <label>Duration</label>
                  <span>{session.duration} minutes</span>
                </div>
              </div>
              {session.category && (
                <div className="es-sidebar-row">
                  <Tag size={16} />
                  <div>
                    <label>Category</label>
                    <span>{session.category}</span>
                  </div>
                </div>
              )}
              {session.deadline && (
                <div className="es-sidebar-row">
                  <Calendar size={16} />
                  <div>
                    <label>Registration Deadline</label>
                    <span>
                      {new Date(session.deadline).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div className="es-sidebar-price">
                {session.price === 0 ? "Free" : `₹${session.price}`}
              </div>

              {/* {session.paymentStatus && (
                <div
                  className={`es-payment-status es-payment-status--${session.paymentStatus}`}
                >
                  {session.paymentStatus === "paid" && "🟢 Booked"}
                  {session.paymentStatus === "free" && "🟢 Booked"}
                  {session.paymentStatus === "pending" && "🟡 Payment Pending"}
                  {session.paymentStatus === "refund_pending" &&
                    "🟠 Refund Processing"}
                  {session.paymentStatus === "refunded" && "🔵 Refunded"}
                  {session.paymentStatus === "cancelled" && "⚫ Cancelled"}
                </div>
              )} */}
              {session.isRegistered ? (
                <div className="es-registered-confirm">
                  <CheckCircle size={18} /> You&apos;re registered
                </div>
              ) : (
                <button
                  className="es-book-btn"
                  disabled={booking}
                  onClick={() => setShowConfirm(true)}
                >
                  Book Session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="es-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="es-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="es-confirm-icon">
              <Calendar size={28} />
            </div>
            <h3>Confirm Booking</h3>
            <p>
              You're about to register for <strong>{session.title}</strong>.
              {session.price > 0 && (
                <>
                  {" "}
                  This session costs <strong>₹{session.price}</strong>.
                </>
              )}
            </p>
            <div className="es-confirm-actions">
              <button
                className="es-confirm-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="es-confirm-ok"
                onClick={handleConfirm}
                disabled={booking}
              >
                {booking ? "Booking..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

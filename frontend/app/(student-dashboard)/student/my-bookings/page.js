"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Tag, Receipt, IndianRupee } from "lucide-react";
import Loader from "../../../components/Loader";
import "./my-bookings.css";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  paid: { label: "Paid", emoji: "🟢", cls: "paid" },
  pending: { label: "Payment Pending", emoji: "🟡", cls: "pending" },
  refund_pending: {
    label: "Refund Processing",
    emoji: "🟠",
    cls: "refund_pending",
  },
  refunded: { label: "Refunded", emoji: "🔵", cls: "refunded" },
  failed: { label: "Failed", emoji: "🔴", cls: "failed" },
};

const SESSION_STATUS_CONFIG = {
  scheduled: { label: "Scheduled", cls: "s-scheduled" },
  live: { label: "Live", cls: "s-live" },
  completed: { label: "Completed", cls: "s-completed" },
  cancelled: { label: "Cancelled", cls: "s-cancelled" },
};

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/student/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setBookings(data.bookings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) return <Loader />;

  return (
    <div className="my-bookings">
      <div className="mb-header">
        <Receipt size={24} />
        <div>
          <h1>My Bookings</h1>
          <p>All your payment transactions</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="mb-empty">
          <Receipt size={48} color="#d1d5db" />
          <p>No bookings found.</p>
        </div>
      ) : (
        <div className="mb-list">
          {bookings.map((tx) => {
            const session = tx.sessionId;
            const txStatus = STATUS_CONFIG[tx.status] || {
              label: tx.status,
              emoji: "⚪",
              cls: "pending",
            };
            const sessStatus = session?.status
              ? SESSION_STATUS_CONFIG[session.status]
              : null;

            return (
              <div
                key={tx._id}
                className="mb-card"
                onClick={() =>
                  session?._id && router.push(`/student/session/${session._id}`)
                }
              >
                {/* Cover */}
                {session?.coverImage?.url ? (
                  <img
                    src={session.coverImage.url}
                    alt={session.title}
                    className="mb-cover"
                  />
                ) : (
                  <div className="mb-cover-placeholder" />
                )}

                <div className="mb-body">
                  <div className="mb-top">
                    <h3 className="mb-title">
                      {session?.title || "Session Deleted"}
                    </h3>
                    <span
                      className={`mb-tx-status mb-tx-status--${txStatus.cls}`}
                    >
                      {txStatus.emoji} {txStatus.label}
                    </span>
                  </div>

                  <div className="mb-meta-row">
                    {session?.category && (
                      <span className="mb-badge">
                        <Tag size={12} /> {session.category}
                      </span>
                    )}
                    {sessStatus && (
                      <span
                        className={`mb-badge mb-sess-status--${sessStatus.cls}`}
                      >
                        {sessStatus.label}
                      </span>
                    )}
                  </div>

                  {session?.startTime && (
                    <div className="mb-meta-row">
                      <span className="mb-meta-item">
                        <Calendar size={13} /> {formatDate(session.startTime)}
                      </span>
                      <span className="mb-meta-item">
                        <Clock size={13} /> {formatTime(session.startTime)}
                      </span>
                      <span className="mb-meta-item">
                        <Clock size={13} /> {session.duration} mins
                      </span>
                    </div>
                  )}

                  <div className="mb-footer">
                    <span className="mb-amount">
                      <IndianRupee size={14} /> {tx.amount}
                    </span>
                    <span className="mb-date">
                      Booked on {formatDate(tx.createdAt)}
                    </span>
                  </div>

                  {tx.razorpayOrderId && (
                    <div className="mb-ids">
                      <span>
                        Order: <code>{tx.razorpayOrderId}</code>
                      </span>
                      {tx.razorpayPaymentId && (
                        <span>
                          Payment: <code>{tx.razorpayPaymentId}</code>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

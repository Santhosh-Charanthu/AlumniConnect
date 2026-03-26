"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, Users, Tag, CheckCircle } from "lucide-react";
import { authFetch } from "../../../../../services/authFetch";
import "../../explore-sessions/explore-sessions.css";
import Loader from "../../../../../app/components/Loader";

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/sessions/${id}`);
        const data = await res.json();
        if (data.success) setSession(data.session);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleConfirm = async () => {
    setBooking(true);
    setError("");
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/register-session/${id}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        setShowConfirm(false);
        setSession((prev) => ({ ...prev, isRegistered: true, currentSeats: (prev.currentSeats || 0) + 1 }));
      } else {
        setShowConfirm(false);
        setError(data.message || "Failed to book session");
      }
    } catch (err) {
      setShowConfirm(false);
      setError("Failed to book session");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <Loader />;
  if (!session) return <div style={{ padding: 30 }}>Session not found.</div>;

  const seatsLeft = (session.maxSeats || 0) - (session.currentSeats || 0);

  return (
    <>
      <div className="es-detail-page">
        <button className="es-back-btn" onClick={() => router.back()}>← Back to Sessions</button>

        {session.coverImage?.url && (
          <img src={session.coverImage.url} alt={session.title} className="es-detail-cover" />
        )}

        <div className="es-detail-body">
          <div className="es-detail-main">
            {session.category && <span className="es-category">{session.category}</span>}
            <h1 className="es-detail-title">{session.title}</h1>

            {session.alumni && (
              <div className="es-alumni-row" style={{ marginBottom: "20px" }}>
                {session.alumni.profileImage?.url ? (
                  <img src={session.alumni.profileImage.url} alt={session.alumni.name} className="es-alumni-avatar" />
                ) : (
                  <div className="es-alumni-avatar-placeholder">{session.alumni.name?.charAt(0)}</div>
                )}
                <div>
                  <span className="es-alumni-name">{session.alumni.name}</span>
                  {session.alumni.jobTitle && <span className="es-alumni-job">{session.alumni.jobTitle}</span>}
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
                  <span>{new Date(session.startTime).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              </div>
              <div className="es-sidebar-row">
                <Clock size={16} />
                <div>
                  <label>Time</label>
                  <span>{new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
              <div className="es-sidebar-row">
                <Clock size={16} />
                <div>
                  <label>Duration</label>
                  <span>{session.duration} minutes</span>
                </div>
              </div>
              <div className="es-sidebar-row">
                <Users size={16} />
                <div>
                  <label>Seats Available</label>
                  <span>{seatsLeft} / {session.maxSeats || "—"}</span>
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
                    <span>{new Date(session.deadline).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                </div>
              )}

              <div className="es-sidebar-price">
                {session.price === 0 ? "Free" : `₹${session.price}`}
              </div>

              {error && <p className="es-book-error">{error}</p>}

              {session.isRegistered ? (
                <div className="es-registered-confirm">
                  <CheckCircle size={18} /> You're registered
                </div>
              ) : (
                <button
                  className="es-book-btn"
                  disabled={seatsLeft <= 0 || booking}
                  onClick={() => setShowConfirm(true)}
                >
                  {seatsLeft <= 0 ? "Fully Booked" : "Book Session"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="es-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="es-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="es-confirm-icon">
              <Calendar size={28} />
            </div>
            <h3>Confirm Booking</h3>
            <p>
              You're about to register for <strong>{session.title}</strong>.
              {session.price > 0 && <> This session costs <strong>₹{session.price}</strong>.</>}
            </p>
            <div className="es-confirm-actions">
              <button className="es-confirm-cancel" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="es-confirm-ok" onClick={handleConfirm} disabled={booking}>
                {booking ? "Booking..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
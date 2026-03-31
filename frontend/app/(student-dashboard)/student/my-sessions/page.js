"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../context/ToastContext";
import {
  Calendar,
  Clock,
  User,
  Tag,
  CalendarCheck,
  ExternalLink,
  CheckCircle2,
  Star,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import "./my-sessions.css";
import Loader from "../../../components/Loader";
import ReviewModal from "../../../components/ReviewModal";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

export default function StudentMySessionsPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [myUserId, setMyUserId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [unregisteringId, setUnregisteringId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState({});
  const [joinLoading, setJoinLoading] = useState(null);

  // Review create modal
  const [reviewModal, setReviewModal] = useState(null); // session object
  // Review edit modal: { session, review }
  const [editReviewModal, setEditReviewModal] = useState(null);
  // Review delete confirm: { sessionId, reviewId }
  const [deleteReviewConfirm, setDeleteReviewConfirm] = useState(null);
  const [deleteReviewLoading, setDeleteReviewLoading] = useState(false);

  const [reviewedIds, setReviewedIds] = useState({}); // sessionId -> reviewId (string)

  // Per-card tab: "info" | "reviews"
  const [cardTab, setCardTab] = useState({});
  const [cardReviews, setCardReviews] = useState({}); // sessionId -> reviews[]
  const [cardReviewsLoading, setCardReviewsLoading] = useState({});

  useEffect(() => {
    fetchMyId();
    fetchSessions();
  }, []);

  const fetchMyId = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMyUserId(data.user?._id || data.profile?.userId);
    } catch {
      /* silent */
    }
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/student/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        const attended = {};
        data.sessions.forEach((r) => {
          if (r.attended) attended[r.sessionId?._id] = true;
        });
        setAttendanceMarked(attended);
      } else {
        showToast("error", data.message || "Failed to load sessions");
      }
    } catch {
      showToast("error", "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const loadCardReviews = async (sessionId) => {
    if (cardReviews[sessionId]) return;
    setCardReviewsLoading((p) => ({ ...p, [sessionId]: true }));
    try {
      const res = await fetch(
        `${API_BASE}/student/sessions/${sessionId}/reviews`,
      );
      const data = await res.json();
      if (data.success) {
        setCardReviews((p) => ({ ...p, [sessionId]: data.reviews }));
        // Seed reviewedIds from loaded reviews
        const token = localStorage.getItem("token");
        const meRes = await fetch(`${API_BASE}/student/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();
        const myId = meData.user?._id || meData.profile?.userId;
        if (myId) {
          const mine = data.reviews.find(
            (r) => r.studentId?._id === myId || r.studentId === myId,
          );
          if (mine) setReviewedIds((p) => ({ ...p, [sessionId]: mine._id }));
        }
      }
    } catch {
      /* silent */
    } finally {
      setCardReviewsLoading((p) => ({ ...p, [sessionId]: false }));
    }
  };

  const switchCardTab = (sessionId, tab) => {
    setCardTab((p) => ({ ...p, [sessionId]: tab }));
    if (tab === "reviews") loadCardReviews(sessionId);
  };

  const canUnregister = (startTime) => {
    const oneHourBefore = new Date(
      new Date(startTime).getTime() - 60 * 60 * 1000,
    );
    return new Date() < oneHourBefore;
  };

  const handleUnregister = async (sessionId) => {
    setUnregisteringId(sessionId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/student/unregister-session/${sessionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        showToast(
          "success",
          data.message || "Successfully unregistered from the session",
        );
        setSessions((prev) =>
          prev.filter((r) => r.sessionId?._id !== sessionId),
        );
      } else {
        showToast("error", data.message || "Failed to unregister");
      }
    } catch {
      showToast("error", "Failed to unregister");
    } finally {
      setUnregisteringId(null);
      setConfirmId(null);
    }
  };

  const handleJoinSession = async (sessionId) => {
    setJoinLoading(sessionId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/student/sessions/${sessionId}/meet-link`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success && data.meetLink) {
        window.open(data.meetLink, "_blank", "noopener,noreferrer");
      } else {
        showToast("error", data.message || "Could not get meet link");
      }
    } catch {
      showToast("error", "Failed to get meet link");
    } finally {
      setJoinLoading(null);
    }
  };

  const handleMarkAttendance = async (sessionId) => {
    setAttendanceLoading(sessionId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/student/sessions/${sessionId}/attendance`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setAttendanceMarked((prev) => ({ ...prev, [sessionId]: true }));
        showToast("success", "Attendance marked successfully!");
      } else {
        showToast("error", data.message || "Failed to mark attendance");
      }
    } catch {
      showToast("error", "Failed to mark attendance");
    } finally {
      setAttendanceLoading(null);
    }
  };

  // Called after new review submitted
  const handleReviewSubmitted = (sessionId, review) => {
    setReviewedIds((p) => ({ ...p, [sessionId]: review._id }));
    setCardReviews((p) =>
      p[sessionId] ? { ...p, [sessionId]: [review, ...p[sessionId]] } : p,
    );
    showToast("success", "Review submitted!");
  };

  // Called after review edited
  const handleReviewUpdated = (sessionId, updatedReview) => {
    setCardReviews((p) => ({
      ...p,
      [sessionId]: (p[sessionId] || []).map((r) =>
        r._id === updatedReview._id ? updatedReview : r,
      ),
    }));
    showToast("success", "Review updated!");
  };

  // Delete review
  const handleDeleteReview = async () => {
    if (!deleteReviewConfirm) return;
    setDeleteReviewLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/student/reviews/${deleteReviewConfirm.reviewId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        const { sessionId, reviewId } = deleteReviewConfirm;
        setCardReviews((p) => ({
          ...p,
          [sessionId]: (p[sessionId] || []).filter((r) => r._id !== reviewId),
        }));
        setReviewedIds((p) => {
          const next = { ...p };
          delete next[sessionId];
          return next;
        });
        setDeleteReviewConfirm(null);
        showToast("success", "Review deleted.");
      } else {
        showToast("error", data.message || "Failed to delete review");
      }
    } catch {
      showToast("error", "Failed to delete review");
    } finally {
      setDeleteReviewLoading(false);
    }
  };

  const upcoming = sessions.filter(
    (r) =>
      r.sessionId?.status === "scheduled" || r.sessionId?.status === "live",
  );
  const completed = sessions.filter(
    (r) =>
      r.sessionId?.status === "completed" ||
      r.sessionId?.status === "cancelled",
  );
  const displaySessions = activeTab === "upcoming" ? upcoming : completed;

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

  const statusClass = (status) => {
    if (status === "completed") return "badge completed";
    if (status === "cancelled") return "badge cancelled";
    if (status === "live") return "badge live";
    return "badge scheduled";
  };

  const renderStars = (rating) =>
    [1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={13}
        fill={s <= rating ? "#f59e0b" : "none"}
        color={s <= rating ? "#f59e0b" : "#d1d5db"}
        strokeWidth={1.5}
      />
    ));

  const isMyReview = (review) => {
    if (!myUserId) return false;
    const rid = review.studentId?._id || review.studentId;
    return rid?.toString() === myUserId?.toString();
  };

  if (loading) return <Loader />;

  return (
    <div className="student-my-sessions">
      {/* Create review modal */}
      {reviewModal && (
        <ReviewModal
          session={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmitted={(review) =>
            handleReviewSubmitted(reviewModal._id, review)
          }
        />
      )}

      {/* Edit review modal */}
      {editReviewModal && (
        <ReviewModal
          session={editReviewModal.session}
          existing={editReviewModal.review}
          onClose={() => setEditReviewModal(null)}
          onUpdated={(review) => {
            handleReviewUpdated(editReviewModal.session._id, review);
            setEditReviewModal(null);
          }}
        />
      )}

      {/* Delete review confirm */}
      {deleteReviewConfirm && (
        <div
          className="confirm-overlay"
          onClick={() => setDeleteReviewConfirm(null)}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Review?</h3>
            <p>
              This will permanently remove your review. This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteReviewConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-danger"
                disabled={deleteReviewLoading}
                onClick={handleDeleteReview}
              >
                {deleteReviewLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm unregister modal */}
      {confirmId && (
        <div className="confirm-overlay" onClick={() => setConfirmId(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Unregister from session?</h3>
            <p>
              You will be removed from the session and its group chat. This
              cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmId(null)}>
                Cancel
              </button>
              <button
                className="btn-confirm-danger"
                disabled={unregisteringId === confirmId}
                onClick={() => handleUnregister(confirmId)}
              >
                {unregisteringId === confirmId
                  ? "Unregistering..."
                  : "Yes, Unregister"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>My Sessions</h1>
          <p>View all your registered sessions</p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({completed.length})
        </button>
      </div>

      {displaySessions.length === 0 ? (
        <div className="empty-state">
          <CalendarCheck size={48} color="#ccc" />
          <p>No {activeTab} sessions found.</p>
        </div>
      ) : (
        <div className="sessions-grid">
          {displaySessions.map((reg) => {
            const session = reg.sessionId;
            const sessionId = session?._id;
            const startTime = session?.startTime;
            const status = session?.status;
            const isLive = status === "live";
            const isCompleted = status === "completed";
            const eligible = startTime && canUnregister(startTime);
            const alreadyAttended = attendanceMarked[sessionId] || reg.attended;
            const myReviewId = reviewedIds[sessionId];
            const alreadyReviewed = !!myReviewId;
            const currentCardTab = cardTab[sessionId] || "info";
            const reviews = cardReviews[sessionId] || [];
            const reviewsLoading = cardReviewsLoading[sessionId];

            return (
              <div key={reg._id} className="session-card">
                {/* Card inner tabs (only for completed) */}
                {isCompleted && (
                  <div className="card-inner-tabs">
                    <button
                      className={`card-inner-tab ${currentCardTab === "info" ? "active" : ""}`}
                      onClick={() => switchCardTab(sessionId, "info")}
                    >
                      Info
                    </button>
                    <button
                      className={`card-inner-tab ${currentCardTab === "reviews" ? "active" : ""}`}
                      onClick={() => switchCardTab(sessionId, "reviews")}
                    >
                      <Star size={12} /> Reviews
                    </button>
                  </div>
                )}

                {/* INFO TAB */}
                {currentCardTab === "info" && (
                  <div
                    className="session-card-clickable"
                    onClick={() => router.push(`/student/session/${sessionId}`)}
                  >
                    {session?.coverImage?.url ? (
                      <img
                        src={session.coverImage.url}
                        alt={session?.title}
                        className="session-cover"
                      />
                    ) : (
                      <div className="session-cover-placeholder" />
                    )}

                    <div className="session-body">
                      <h3 className="session-title">{session?.title}</h3>

                      <div className="session-meta">
                        <span className={statusClass(status)}>
                          {isLive && <span className="live-dot" />}
                          {status || "scheduled"}
                        </span>
                        <span className="badge">
                          <Tag size={12} /> {session?.category}
                        </span>
                        {reg.paymentStatus && reg.paymentStatus !== "free" && (
                          <span
                            className={`payment-status-badge payment-status--${reg.paymentStatus}`}
                          >
                            {reg.paymentStatus === "paid" && "🟢 Paid"}
                            {reg.paymentStatus === "pending" && "🟡 Pending"}
                            {reg.paymentStatus === "refund_pending" &&
                              "🟠 Refund Processing"}
                            {reg.paymentStatus === "refunded" && "🔵 Refunded"}
                            {reg.paymentStatus === "cancelled" &&
                              "⚫ Cancelled"}
                          </span>
                        )}
                      </div>

                      <div className="session-meta">
                        <span className="meta-item">
                          <User size={14} />
                          {session?.alumni?.name || "Alumni"}
                        </span>
                      </div>

                      <div className="session-meta">
                        <span className="meta-item">
                          <Calendar size={14} />
                          {formatDate(startTime)}
                        </span>
                        <span className="meta-item">
                          <Clock size={14} />
                          {formatTime(startTime)}
                        </span>
                      </div>

                      <div className="session-meta">
                        <span className="meta-item">
                          <Clock size={14} />
                          {session?.duration} mins
                        </span>
                      </div>

                      {isCompleted && alreadyAttended && (
                        <div className="attended-badge">
                          <CheckCircle2 size={14} /> Attended
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* REVIEWS TAB */}
                {currentCardTab === "reviews" && (
                  <div className="card-reviews-panel">
                    <p className="card-reviews-session-name">
                      {session?.title}
                    </p>
                    {reviewsLoading ? (
                      <div className="card-reviews-loading">
                        Loading reviews...
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="card-reviews-empty">
                        <MessageSquare size={32} color="#d1d5db" />
                        <p>No reviews yet. Be the first!</p>
                      </div>
                    ) : (
                      <div className="card-reviews-list">
                        {reviews.map((r) => {
                          const mine = isMyReview(r);
                          return (
                            <div
                              key={r._id}
                              className={`card-review-item ${mine ? "my-review" : ""}`}
                            >
                              <div className="card-review-top">
                                <div className="card-review-top-left">
                                  <span className="card-reviewer-name">
                                    {r.studentId?.name || "Student"}
                                    {mine && (
                                      <span className="my-review-tag">You</span>
                                    )}
                                  </span>
                                  <div className="card-review-stars">
                                    {renderStars(r.rating)}
                                  </div>
                                </div>
                                {mine && (
                                  <div className="review-item-actions">
                                    <button
                                      className="review-action-btn edit"
                                      title="Edit review"
                                      onClick={() =>
                                        setEditReviewModal({
                                          session,
                                          review: r,
                                        })
                                      }
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      className="review-action-btn delete"
                                      title="Delete review"
                                      onClick={() =>
                                        setDeleteReviewConfirm({
                                          sessionId,
                                          reviewId: r._id,
                                        })
                                      }
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {r.comment && (
                                <p className="card-review-comment">
                                  {r.comment}
                                </p>
                              )}
                              <span className="card-review-date">
                                {new Date(r.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer actions */}
                <div className="session-card-footer">
                  {isLive && (
                    <div className="live-actions">
                      <button
                        className="btn-join"
                        disabled={joinLoading === sessionId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinSession(sessionId);
                        }}
                      >
                        <ExternalLink size={14} />
                        {joinLoading === sessionId
                          ? "Opening..."
                          : "Join Session"}
                      </button>
                      {!alreadyAttended ? (
                        <button
                          className="btn-attend"
                          disabled={attendanceLoading === sessionId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAttendance(sessionId);
                          }}
                        >
                          <CheckCircle2 size={14} />
                          {attendanceLoading === sessionId
                            ? "Marking..."
                            : "Mark Attendance"}
                        </button>
                      ) : (
                        <span className="attendance-done">
                          ✓ Attendance marked
                        </span>
                      )}
                    </div>
                  )}

                  {isCompleted && (
                    <div className="completed-actions">
                      {alreadyReviewed ? (
                        <span className="reviewed-badge">✓ Reviewed</span>
                      ) : (
                        <button
                          className="btn-review"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewModal(session);
                          }}
                        >
                          <Star size={14} /> Leave a Review
                        </button>
                      )}
                    </div>
                  )}

                  {!isLive && !isCompleted && (
                    <>
                      {eligible ? (
                        <button
                          className="btn-unregister"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmId(sessionId);
                          }}
                        >
                          Unregister
                        </button>
                      ) : (
                        <span className="unregister-locked">
                          Cannot unregister within 1 hour of start
                        </span>
                      )}
                    </>
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

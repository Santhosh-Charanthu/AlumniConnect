"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  MessageSquare,
  CheckCheck,
  Users,
  ExternalLink,
  Radio,
  Star,
} from "lucide-react";
import { authFetch } from "../../../../src/services/authFetch";
import { useNotifications } from "../../../context/NotificationContext";
import { useRouter } from "next/navigation";
import Loader from "../../../components/Loader";
import ReviewModal from "../../../components/ReviewModal";
import "./notifications.css";

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

const TYPE_ICON = {
  session: Calendar,
  session_booking: Calendar,
  session_cancelled: Calendar,
  new_session: Calendar,
  session_live: Radio,
  session_completed: Star,
  reminder: Bell,
  message: MessageSquare,
  group_invite: Users,
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [flash, setFlash] = useState(null);
  const [joiningId, setJoiningId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // { sessionId, sessionTitle }
  const { setUnreadCount } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await authFetch(`${API}/student/notifications`);
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showFlash = (message, type = "success") => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 3500);
  };

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    await authFetch(`${API}/student/notifications/read`, { method: "PATCH" });
    setUnreadCount(0);
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await authFetch(`${API}/student/notifications/read`, { method: "PATCH" });
    setUnreadCount(0);
  };

  const handleJoinGroup = async (notif) => {
    const groupId = notif.meta?.groupId;
    if (!groupId) return;
    setJoiningId(notif._id);
    try {
      const res = await authFetch(`${API}/student/groups/${groupId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        showFlash(`You joined "${notif.meta.groupName}" successfully`);
        // Mark as joined in local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notif._id
              ? { ...n, isRead: true, meta: { ...n.meta, alreadyJoined: true } }
              : n,
          ),
        );
      } else {
        showFlash(data.message || "Failed to join group", "error");
      }
    } catch {
      showFlash("Failed to join group", "error");
    } finally {
      setJoiningId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  if (loading) return <Loader />;

  return (
    <div className="notifications-page">
      {/* Review modal */}
      {reviewModal && (
        <ReviewModal
          session={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmitted={() => showFlash("Review submitted successfully!")}
        />
      )}

      {/* Flash message */}
      {flash && (
        <div className={`notif-flash ${flash.type}`}>{flash.message}</div>
      )}

      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="filter-row">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          Unread
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No notifications</div>
      ) : (
        <div className="notifications-list">
          {filtered.map((notif) => {
            const Icon = TYPE_ICON[notif.type] || Bell;
            const isGroupInvite = notif.type === "group_invite";
            const isNewSession = notif.type === "new_session";
            const isSessionLive = notif.type === "session_live";
            const isSessionCompleted = notif.type === "session_completed";
            const alreadyJoined = notif.meta?.alreadyJoined;

            const notifTitle = isGroupInvite
              ? "Join Group Chat"
              : notif.type === "session_cancelled"
                ? "Session Cancelled"
                : isNewSession
                  ? "New Session Available"
                  : isSessionLive
                    ? "Session is Live Now!"
                    : isSessionCompleted
                      ? "Session Completed"
                      : "Session Update";

            return (
              <div
                key={notif._id}
                className={`notification-item ${!notif.isRead ? "unread" : ""}`}
              >
                <span
                  className={`notif-dot ${!notif.isRead ? "dot-unread" : "dot-read"}`}
                />

                <div className={`notif-icon ${notif.type}`}>
                  <Icon size={18} />
                </div>

                <div className="notif-content">
                  <p className={`notif-title ${!notif.isRead ? "bold" : ""}`}>
                    {notifTitle}
                  </p>
                  <p className="notif-desc">{notif.message}</p>
                  <p className="notif-time">{formatDate(notif.createdAt)}</p>

                  {isGroupInvite && (
                    <div className="notif-actions">
                      {alreadyJoined ? (
                        <span className="joined-badge">Joined</span>
                      ) : (
                        <button
                          className="join-group-btn"
                          disabled={joiningId === notif._id}
                          onClick={() => handleJoinGroup(notif)}
                        >
                          {joiningId === notif._id
                            ? "Joining..."
                            : "Join Group"}
                        </button>
                      )}
                    </div>
                  )}

                  {isNewSession && notif.meta?.sessionId && (
                    <div className="notif-actions">
                      <button
                        className="view-session-btn"
                        onClick={() =>
                          router.push(
                            `/student/session/${notif.meta.sessionId}`,
                          )
                        }
                      >
                        <ExternalLink size={13} /> View Session
                      </button>
                    </div>
                  )}

                  {isSessionLive && (
                    <div className="notif-actions">
                      <button
                        className="join-now-btn"
                        onClick={() => router.push("/student/my-sessions")}
                      >
                        <ExternalLink size={13} /> Join Now
                      </button>
                    </div>
                  )}

                  {isSessionCompleted && (
                    <div className="notif-actions">
                      <button
                        className="leave-review-btn"
                        onClick={() =>
                          setReviewModal({
                            _id: notif.meta?.sessionId,
                            title: notif.meta?.sessionTitle || "Session",
                          })
                        }
                      >
                        <Star size={13} /> Leave a Review
                      </button>
                    </div>
                  )}
                </div>

                {!notif.isRead && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(notif._id)}
                  >
                    <CheckCheck size={14} />
                    Mark as read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

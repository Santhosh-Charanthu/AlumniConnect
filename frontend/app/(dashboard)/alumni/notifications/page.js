"use client";

import { useState, useEffect } from "react";
import { Bell, UserCheck, CheckCheck } from "lucide-react";
import { useNotifications } from "../../../context/NotificationContext";
import "./notifications.css";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

export default function AlumniNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useNotifications();

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/alumni/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        // Auto mark all as read when page is opened
        if (data.unreadCount > 0) {
          markAllRead(data.notifications);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async (currentNotifs) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/alumni/notifications/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0); // clear the sidebar dot
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="notif-page">
      <div className="notif-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
        </div>
        {unreadCount > 0 && (
          <button className="notif-mark-read" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="notif-list">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="notif-skeleton" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="notif-empty">
          <Bell size={48} />
          <p>No notifications yet</p>
          <span>
            You&apos;ll be notified when students register for your sessions
          </span>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-item ${n.isRead ? "" : "unread"}`}
            >
              <div className="notif-icon">
                <UserCheck size={20} />
              </div>
              <div className="notif-content">
                <p className="notif-message">{n.message}</p>
                <span className="notif-time">{timeAgo(n.createdAt)}</span>
              </div>
              {!n.isRead && <div className="notif-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Bell, Calendar, MessageSquare, CheckCheck } from "lucide-react";
import "./notifications.css";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "session",
    title: "New Session Available",
    description:
      "A new session on 'React Advanced Patterns' has been posted by Priya Sharma.",
    timestamp: "2026-03-15T10:30:00Z",
    read: false,
  },
  {
    id: 2,
    type: "reminder",
    title: "Session Reminder",
    description: "Your session 'System Design Fundamentals' starts in 1 hour.",
    timestamp: "2026-03-14T09:00:00Z",
    read: false,
  },
  {
    id: 3,
    type: "message",
    title: "New Message",
    description: "Rahul Verma sent you a message.",
    timestamp: "2026-03-13T14:20:00Z",
    read: true,
  },
  {
    id: 4,
    type: "session",
    title: "Session Completed",
    description:
      "Your session 'DSA Interview Prep' has been marked as completed.",
    timestamp: "2026-03-12T16:00:00Z",
    read: true,
  },
];

const TYPE_ICON = {
  session: Calendar,
  reminder: Bell,
  message: MessageSquare,
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount} unread</span>
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
            return (
              <div
                key={notif.id}
                className={`notification-item ${!notif.read ? "unread" : ""}`}
              >
                <span className={`notif-dot ${!notif.read ? "dot-unread" : "dot-read"}`} />

                <div className={`notif-icon ${notif.type}`}>
                  <Icon size={18} />
                </div>

                <div className="notif-content">
                  <p className={`notif-title ${!notif.read ? "bold" : ""}`}>
                    {notif.title}
                  </p>
                  <p className="notif-desc">{notif.description}</p>
                  <p className="notif-time">{formatDate(notif.timestamp)}</p>
                </div>

                {!notif.read && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(notif.id)}
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

"use client";

import { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";
import { Calendar, Clock, User, Tag, CalendarCheck } from "lucide-react";
import "./my-sessions.css";

const API_BASE = "http://localhost:5000/api";

export default function StudentMySessionsPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/student/my-sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions);
        } else {
          showToast("error", data.message || "Failed to load sessions");
        }
      } catch (err) {
        showToast("error", "Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const now = new Date();
  const upcoming = sessions.filter(
    (r) => new Date(r.sessionId?.startTime) > now
  );
  const completed = sessions.filter(
    (r) => new Date(r.sessionId?.startTime) <= now
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
    return "badge scheduled";
  };

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>;

  return (
    <div className="student-my-sessions">
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
          {displaySessions.map((reg) => (
            <div key={reg._id} className="session-card">
              {reg.sessionId?.coverImage?.url ? (
                <img
                  src={reg.sessionId.coverImage.url}
                  alt={reg.sessionId?.title}
                  className="session-cover"
                />
              ) : (
                <div className="session-cover-placeholder" />
              )}

              <div className="session-body">
                <h3 className="session-title">{reg.sessionId?.title}</h3>

                <div className="session-meta">
                  <span className={statusClass(reg.sessionId?.status)}>
                    {reg.sessionId?.status || "scheduled"}
                  </span>
                  <span className="badge">
                    <Tag size={12} /> {reg.sessionId?.category}
                  </span>
                </div>

                <div className="session-meta">
                  <span className="meta-item">
                    <User size={14} />
                    {reg.sessionId?.alumni?.name || "Alumni"}
                  </span>
                </div>

                <div className="session-meta">
                  <span className="meta-item">
                    <Calendar size={14} />
                    {formatDate(reg.sessionId?.startTime)}
                  </span>
                  <span className="meta-item">
                    <Clock size={14} />
                    {formatTime(reg.sessionId?.startTime)}
                  </span>
                </div>

                <div className="session-meta">
                  <span className="meta-item">
                    <Clock size={14} />
                    {reg.sessionId?.duration} mins
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

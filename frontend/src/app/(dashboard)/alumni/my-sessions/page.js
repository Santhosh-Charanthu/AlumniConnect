"use client";

import { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";
import {
  Pencil,
  Trash2,
  X,
  Calendar,
  Clock,
  Users,
  Tag,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import "./my-sessions.css";

const API_BASE = "http://localhost:5000/api";

export default function MySessionsPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [editingSession, setEditingSession] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    startTime: "",
    duration: "",
    price: "",
    meetLink: "",
    maxSeats: "",
    category: "",
    status: "",
  });
  const [editError, setEditError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/alumni/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log(data)
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

  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.startTime) > now);
  const completed = sessions.filter((s) => new Date(s.startTime) <= now);
  const displaySessions = activeTab === "upcoming" ? upcoming : completed;

  const handleEditClick = async (session) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/alumni/sessions/${session._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const s = data.session;
        setEditingSession(s);
        setEditForm({
          title: s.title || "",
          description: s.description || "",
          startTime: s.startTime
            ? new Date(s.startTime).toISOString().slice(0, 16)
            : "",
          duration: s.duration || "",
          price: s.price || "",
          meetLink: s.meetLink || "",
          maxSeats: s.maxSeats || "",
          category: s.category || "",
          status: s.status || "",
        });
        setEditError("");
      } else {
        showToast("error", data.message || "Failed to load session");
      }
    } catch (err) {
      showToast("error", "Failed to load session");
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const { title, startTime, duration, meetLink, category } = editForm;
    if (!title || !startTime || !duration || !meetLink || !category) {
      setEditError("Title, start time, duration, meet link, and category are required.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/alumni/sessions/${editingSession._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        }
      );
      const data = await res.json();
      if (data.success) {
        setSessions((prev) =>
          prev.map((s) =>
            s._id === editingSession._id ? { ...s, ...editForm } : s
          )
        );
        setEditingSession(null);
        showToast("success", "Session updated successfully");
      } else {
        showToast("error", data.message || "Failed to update session");
      }
    } catch (err) {
      showToast("error", "Failed to update session");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/alumni/sessions/${showDeleteConfirm}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s._id !== showDeleteConfirm));
        setShowDeleteConfirm(null);
        showToast("success", "Session deleted successfully");
      } else {
        showToast("error", data.message || "Failed to delete session");
      }
    } catch (err) {
      showToast("error", "Failed to delete session");
    }
  };

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
    <div className="my-sessions">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>My Sessions</h1>
          <p>Manage and track all your sessions</p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Sessions Grid */}
      {displaySessions.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} color="#ccc" />
          <p>No {activeTab} sessions found.</p>
        </div>
      ) : (
        <div className="sessions-grid">
          {displaySessions.map((session) => (
            <div key={session._id} className="session-card">
              {session.coverImage ? (
                <img
                  src={session.coverImage.url}
                  alt={session.title}
                  className="session-cover"
                />
              ) : (
                <div className="session-cover-placeholder" />
              )}

              <div className="session-body">
                <h3 className="session-title">{session.title}</h3>

                <div className="session-meta">
                  <span className={statusClass(session.status)}>
                    {session.status || "scheduled"}
                  </span>
                  <span className="badge">
                    <Tag size={12} /> {session.category}
                  </span>
                </div>

                <div className="session-meta">
                  <span className="meta-item">
                    <Calendar size={14} />
                    {formatDate(session.startTime)}
                  </span>
                  <span className="meta-item">
                    <Clock size={14} />
                    {formatTime(session.startTime)}
                  </span>
                </div>

                <div className="session-meta">
                  <span className="meta-item">
                    <Clock size={14} />
                    {session.duration} mins
                  </span>
                  <span className="meta-item">
                    <Users size={14} />
                    {session.currentSeats || 0} enrolled
                  </span>
                </div>

                <div className="session-meta">
                  <span className="meta-item">
                    <DollarSign size={14} />
                    ₹{session.price || 0}
                  </span>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditClick(session)}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => setShowDeleteConfirm(session._id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingSession && (
        <div className="modal-overlay" onClick={() => setEditingSession(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Session</h2>
              <button onClick={() => setEditingSession(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={editForm.startTime}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Duration (mins) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={editForm.duration}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Max Seats</label>
                  <input
                    type="number"
                    name="maxSeats"
                    value={editForm.maxSeats}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Meet Link *</label>
                <input
                  name="meetLink"
                  value={editForm.meetLink}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <input
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {editError && <p className="form-error">{editError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditingSession(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Session</h3>
            <p>Are you sure you want to delete this session? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={handleDeleteConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

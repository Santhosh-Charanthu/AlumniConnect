"use client";

import { useState, useEffect } from "react";
import Loader from "../../../components/Loader";
import { useToast } from "../../../context/ToastContext";
import {
  Pencil, Trash2, X, Calendar, Clock, Users, Tag,
  DollarSign, CheckCircle, UserCheck, Play, Square, Link, Star, MessageSquare,
} from "lucide-react";
import "./my-sessions.css";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

export default function MySessionsPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [editingSession, setEditingSession] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "", description: "", startTime: "", deadline: "",
    duration: "", price: "", maxSeats: "", category: "", status: "",
  });
  const [editError, setEditError] = useState("");
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [startModal, setStartModal] = useState(null);
  const [meetLinkInput, setMeetLinkInput] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [endConfirm, setEndConfirm] = useState(null);
  const [endLoading, setEndLoading] = useState(false);

  // Reviews modal (alumni view — read-only)
  const [reviewsModal, setReviewsModal] = useState(null); // { session, list }
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/alumni/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSessions(data.sessions);
      else showToast("error", data.message || "Failed to load sessions");
    } catch {
      showToast("error", "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const upcoming = sessions.filter((s) => s.status === "scheduled" || s.status === "live");
  const completed = sessions.filter((s) => s.status === "completed" || s.status === "cancelled");
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
          startTime: s.startTime ? new Date(s.startTime).toISOString().slice(0, 16) : "",
          deadline: s.deadline ? new Date(s.deadline).toISOString().slice(0, 16) : "",
          duration: s.duration || "",
          price: s.price || "",
          maxSeats: s.maxSeats || "",
          category: s.category || "",
          status: s.status || "",
        });
        setEditError("");
      } else {
        showToast("error", data.message || "Failed to load session");
      }
    } catch {
      showToast("error", "Failed to load session");
    }
  };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const { title, startTime, duration, category } = editForm;
    if (!title || !startTime || !duration || !category) {
      setEditError("Title, start time, duration, and category are required.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/alumni/sessions/${editingSession._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.map((s) => s._id === editingSession._id ? { ...s, ...editForm } : s));
        setEditingSession(null);
        showToast("success", "Session updated successfully");
      } else {
        showToast("error", data.message || "Failed to update session");
      }
    } catch {
      showToast("error", "Failed to update session");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/alumni/sessions/${showDeleteConfirm}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s._id !== showDeleteConfirm));
        setShowDeleteConfirm(null);
        showToast("success", "Session deleted successfully");
      } else {
        showToast("error", data.message || "Failed to delete session");
      }
    } catch {
      showToast("error", "Failed to delete session");
    }
  };

  const handleTrackParticipants = async (session) => {
    setParticipantsLoading(true);
    setParticipants({ session, list: [] });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/alumni/sessions/${session._id}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setParticipants({ session, list: data.participants });
      else { showToast("error", data.message || "Failed to load participants"); setParticipants(null); }
    } catch {
      showToast("error", "Failed to load participants");
      setParticipants(null);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!meetLinkInput.trim()) { showToast("error", "Please enter a meet link"); return; }
    setStartLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/alumni/sessions/${startModal._id}/start`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ meetLink: meetLinkInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.map((s) => s._id === startModal._id ? { ...s, status: "live", meetLink: meetLinkInput.trim() } : s));
        setStartModal(null);
        setMeetLinkInput("");
        showToast("success", "Session is now live! Students have been notified.");
      } else {
        showToast("error", data.message || "Failed to start session");
      }
    } catch {
      showToast("error", "Failed to start session");
    } finally {
      setStartLoading(false);
    }
  };

  const handleEndSession = async () => {
    setEndLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/alumni/sessions/${endConfirm._id}/end`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.map((s) => s._id === endConfirm._id ? { ...s, status: "completed", meetLink: null } : s));
        setEndConfirm(null);
        showToast("success", "Session ended successfully.");
      } else {
        showToast("error", data.message || "Failed to end session");
      }
    } catch {
      showToast("error", "Failed to end session");
    } finally {
      setEndLoading(false);
    }
  };

  const handleViewReviews = async (session) => {
    setReviewsModal({ session, list: [] });
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/student/sessions/${session._id}/reviews`);
      const data = await res.json();
      if (data.success) setReviewsModal({ session, list: data.reviews });
      else setReviewsModal({ session, list: [] });
    } catch {
      setReviewsModal({ session, list: [] });
    } finally {
      setReviewsLoading(false);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const statusClass = (status) => {
    if (status === "completed") return "badge completed";
    if (status === "cancelled") return "badge cancelled";
    if (status === "live") return "badge live";
    return "badge scheduled";
  };

  if (loading) return <Loader />;

  return (
    <div className="my-sessions">
      <div className="page-header">
        <div>
          <h1>My Sessions</h1>
          <p>Manage and track all your sessions</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`} onClick={() => setActiveTab("upcoming")}>
          Upcoming ({upcoming.length})
        </button>
        <button className={`tab-btn ${activeTab === "completed" ? "active" : ""}`} onClick={() => setActiveTab("completed")}>
          Completed ({completed.length})
        </button>
      </div>

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
                <img src={session.coverImage.url} alt={session.title} className="session-cover" />
              ) : (
                <div className="session-cover-placeholder" />
              )}

              <div className="session-body">
                <h3 className="session-title">{session.title}</h3>

                <div className="session-meta">
                  <span className={statusClass(session.status)}>
                    {session.status === "live" && <span className="live-dot" />}
                    {session.status || "scheduled"}
                  </span>
                  <span className="badge"><Tag size={12} /> {session.category}</span>
                </div>

                <div className="session-meta">
                  <span className="meta-item"><Calendar size={14} />{formatDate(session.startTime)}</span>
                  <span className="meta-item"><Clock size={14} />{formatTime(session.startTime)}</span>
                </div>

                {session.deadline && (
                  <div className="session-meta">
                    <span className="meta-item deadline-item">
                      <Clock size={14} />Deadline: {formatDate(session.deadline)}
                    </span>
                  </div>
                )}

                <div className="session-meta">
                  <span className="meta-item"><Clock size={14} />{session.duration} mins</span>
                  <span className="meta-item"><Users size={14} />{session.currentSeats || 0} enrolled</span>
                </div>

                <div className="session-meta">
                  <span className="meta-item"><DollarSign size={14} />₹{session.price || 0}</span>
                </div>

                <div className="card-actions">
                  <button className="btn-track" onClick={() => handleTrackParticipants(session)}>
                    <UserCheck size={14} /> Participants
                  </button>

                  {session.status === "scheduled" && (
                    <button className="btn-start" onClick={() => { setStartModal(session); setMeetLinkInput(""); }}>
                      <Play size={14} /> Start
                    </button>
                  )}

                  {session.status === "live" && (
                    <button className="btn-end" onClick={() => setEndConfirm(session)}>
                      <Square size={14} /> End Session
                    </button>
                  )}

                  {session.status === "scheduled" && (
                    <>
                      <button className="btn-edit" onClick={() => handleEditClick(session)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button className="btn-delete" onClick={() => setShowDeleteConfirm(session._id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  )}

                  {session.status === "completed" && (
                    <button className="btn-reviews" onClick={() => handleViewReviews(session)}>
                      <Star size={14} /> Reviews
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start Session Modal */}
      {startModal && (
        <div className="modal-overlay" onClick={() => setStartModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start Session</h2>
              <button onClick={() => setStartModal(null)}><X size={20} /></button>
            </div>
            <p className="start-modal-desc">
              Paste your Google Meet / Zoom link below. Students will be notified and can join immediately.
            </p>
            <div className="form-group">
              <label>Meet Link *</label>
              <div className="meet-link-input-wrap">
                <Link size={16} className="meet-link-icon" />
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetLinkInput}
                  onChange={(e) => setMeetLinkInput(e.target.value)}
                  className="meet-link-input"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setStartModal(null)}>Cancel</button>
              <button className="btn-start-confirm" onClick={handleStartSession} disabled={startLoading}>
                {startLoading ? "Starting..." : "Go Live"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirm */}
      {endConfirm && (
        <div className="modal-overlay" onClick={() => setEndConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>End Session?</h3>
            <p>This will mark the session as completed and remove the meet link. Students will be notified and can leave reviews.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEndConfirm(null)}>Cancel</button>
              <button className="btn-end-confirm" onClick={handleEndSession} disabled={endLoading}>
                {endLoading ? "Ending..." : "End Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSession && (
        <div className="modal-overlay" onClick={() => setEditingSession(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Session</h2>
              <button onClick={() => setEditingSession(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input name="title" value={editForm.title} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditChange} rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input type="datetime-local" name="startTime" value={editForm.startTime} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Registration Deadline</label>
                  <input type="datetime-local" name="deadline" value={editForm.deadline} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Duration (mins) *</label>
                  <input type="number" name="duration" value={editForm.duration} onChange={handleEditChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input type="number" name="price" value={editForm.price} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Max Seats</label>
                  <input type="number" name="maxSeats" value={editForm.maxSeats} onChange={handleEditChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <input name="category" value={editForm.category} onChange={handleEditChange} />
                </div>
              </div>
              {editError && <p className="form-error">{editError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditingSession(null)}>Cancel</button>
                <button type="submit" className="btn-save">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Session</h3>
            <p>Are you sure you want to delete this session? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={handleDeleteConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {participants && (
        <div className="modal-overlay" onClick={() => setParticipants(null)}>
          <div className="participants-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Participants</h2>
                <p className="participants-subtitle">{participants.session.title}</p>
              </div>
              <button onClick={() => setParticipants(null)}><X size={20} /></button>
            </div>

            {participantsLoading ? (
              <div className="participants-loading">Loading participants...</div>
            ) : participants.list.length === 0 ? (
              <div className="participants-empty">
                <Users size={40} color="#ccc" />
                <p>No participants yet</p>
              </div>
            ) : (
              <>
                <p className="participants-count">
                  {participants.list.length} student{participants.list.length !== 1 ? "s" : ""} registered
                </p>
                <div className="participants-table-wrap">
                  <table className="participants-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Student</th><th>Email</th><th>Department</th>
                        <th>Batch</th><th>Payment</th><th>Attended</th><th>Registered On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.list.map((p, i) => (
                        <tr key={p._id}>
                          <td>{i + 1}</td>
                          <td>
                            <div className="participant-name-cell">
                              {p.student.profileImage?.url ? (
                                <img src={p.student.profileImage.url} alt={p.student.name} className="participant-avatar" />
                              ) : (
                                <div className="participant-avatar-placeholder">{p.student.name?.charAt(0)}</div>
                              )}
                              <span>{p.student.name}</span>
                            </div>
                          </td>
                          <td>{p.student.email}</td>
                          <td>{p.student.department || "—"}</td>
                          <td>{p.student.batchYear || "—"}</td>
                          <td><span className={`payment-badge ${p.paymentStatus}`}>{p.paymentStatus}</span></td>
                          <td>{p.attended ? <span className="attended-yes">✓ Yes</span> : <span className="attended-no">—</span>}</td>
                          <td>{new Date(p.registeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Reviews Modal (alumni read-only) */}
      {reviewsModal && (
        <div className="modal-overlay" onClick={() => setReviewsModal(null)}>
          <div className="participants-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Reviews</h2>
                <p className="participants-subtitle">{reviewsModal.session.title}</p>
              </div>
              <button onClick={() => setReviewsModal(null)}><X size={20} /></button>
            </div>

            {reviewsLoading ? (
              <div className="participants-loading">Loading reviews...</div>
            ) : reviewsModal.list.length === 0 ? (
              <div className="participants-empty">
                <MessageSquare size={40} color="#ccc" />
                <p>No reviews yet for this session.</p>
              </div>
            ) : (
              <>
                {/* Aggregate */}
                <div className="reviews-aggregate">
                  <div className="reviews-avg">
                    <Star size={20} fill="#f59e0b" color="#f59e0b" />
                    <span className="reviews-avg-num">
                      {(reviewsModal.list.reduce((s, r) => s + r.rating, 0) / reviewsModal.list.length).toFixed(1)}
                    </span>
                    <span className="reviews-avg-label">
                      avg · {reviewsModal.list.length} review{reviewsModal.list.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="alumni-reviews-list">
                  {reviewsModal.list.map((r) => (
                    <div key={r._id} className="alumni-review-card">
                      <div className="alumni-review-top">
                        <div className="alumni-reviewer-info">
                          <div className="alumni-reviewer-avatar">
                            {r.studentId?.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                          <span className="alumni-reviewer-name">{r.studentId?.name || "Student"}</span>
                        </div>
                        <div className="alumni-review-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= r.rating ? "#f59e0b" : "none"}
                              color={s <= r.rating ? "#f59e0b" : "#d1d5db"}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="alumni-review-comment">{r.comment}</p>}
                      <span className="alumni-review-date">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

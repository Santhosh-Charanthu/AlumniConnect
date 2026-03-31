"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Users, X } from "lucide-react";
import { useToast } from "../../../../../context/ToastContext";
import Loader from "../../../../../components/Loader";
import "./participants.css";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

const PAYMENT_FILTERS = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Free", value: "free" },
  { label: "Pending", value: "pending" },
  { label: "Refund Processing", value: "refund_pending" },
  { label: "Refunded", value: "refunded" },
  { label: "Cancelled", value: "cancelled" },
];

const ATTENDED_FILTERS = [
  { label: "All", value: "all" },
  { label: "Attended", value: "yes" },
  { label: "Not Attended", value: "no" },
];

const PAYMENT_BADGE = {
  paid: { label: "Paid", cls: "paid" },
  free: { label: "Free", cls: "free" },
  pending: { label: "Pending", cls: "pending" },
  refund_pending: { label: "Refund Processing", cls: "refund_pending" },
  refunded: { label: "Refunded", cls: "refunded" },
  cancelled: { label: "Cancelled", cls: "cancelled" },
};

export default function ParticipantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [attendedFilter, setAttendedFilter] = useState("all");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const [sRes, pRes] = await Promise.all([
          fetch(`${API_BASE}/alumni/sessions/${id}`, { headers }),
          fetch(`${API_BASE}/alumni/sessions/${id}/participants`, { headers }),
        ]);
        const sData = await sRes.json();
        const pData = await pRes.json();
        if (sData.success) setSession(sData.session);
        if (pData.success) setParticipants(pData.participants);
        else showToast("error", pData.message || "Failed to load participants");
      } catch {
        showToast("error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return participants.filter((p) => {
      const matchSearch =
        !q ||
        p.student.name?.toLowerCase().includes(q) ||
        p.student.email?.toLowerCase().includes(q);
      const matchPayment =
        paymentFilter === "all" || p.paymentStatus === paymentFilter;
      const matchAttended =
        attendedFilter === "all" ||
        (attendedFilter === "yes" ? p.attended : !p.attended);
      return matchSearch && matchPayment && matchAttended;
    });
  }, [participants, search, paymentFilter, attendedFilter]);

  const hasActiveFilters =
    search || paymentFilter !== "all" || attendedFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setPaymentFilter("all");
    setAttendedFilter("all");
  };

  if (loading) return <Loader />;

  return (
    <div className="pp-page">
      <div className="pp-container">
        {/* ── Header ── */}
        <div className="pp-header">
          <button className="pp-back" onClick={() => router.back()}>
            <ArrowLeft size={15} /> Back
          </button>
          <div className="pp-title-block">
            <h1>Participants</h1>
            {session && <p>{session.title}</p>}
          </div>
          <div className="pp-count-badge">
            <Users size={15} />
            {participants.length} registered
          </div>
        </div>

        {/* ── Filter card ── */}
        <div className="pp-filter-card">
          {/* Search */}
          <div className="pp-search-wrap">
            <Search size={14} className="pp-search-icon" />
            <input
              className="pp-search"
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="pp-search-clear" onClick={() => setSearch("")}>
                <X size={13} />
              </button>
            )}
          </div>

          <div className="pp-divider" />

          {/* Payment filter */}
          <div className="pp-filter-row">
            <span className="pp-filter-label">Payment</span>
            <div className="pp-pills">
              {PAYMENT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`pp-pill${paymentFilter === f.value ? " active" : ""}`}
                  onClick={() => setPaymentFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance filter */}
          <div className="pp-filter-row">
            <span className="pp-filter-label">Attendance</span>
            <div className="pp-pills">
              {ATTENDED_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`pp-pill${attendedFilter === f.value ? " active" : ""}`}
                  onClick={() => setAttendedFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer row */}
          <div className="pp-filter-footer">
            <span className="pp-results-count">
              Showing {filtered.length} of {participants.length} participant
              {participants.length !== 1 ? "s" : ""}
            </span>
            {hasActiveFilters && (
              <button className="pp-clear-btn" onClick={clearFilters}>
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Table / Empty ── */}
        {filtered.length === 0 ? (
          <div className="pp-empty">
            <Users size={44} color="#d1d5db" />
            <p>
              {participants.length === 0
                ? "No participants yet."
                : "No participants match your filters."}
            </p>
          </div>
        ) : (
          <div className="pp-table-card">
            <table className="pp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Batch</th>
                  <th>Payment</th>
                  <th>Attended</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const badge = PAYMENT_BADGE[p.paymentStatus] || {
                    label: p.paymentStatus,
                    cls: "pending",
                  };
                  return (
                    <tr key={p._id}>
                      <td className="pp-td-num">{i + 1}</td>
                      <td>
                        <div className="pp-name-cell">
                          {p.student.profileImage?.url ? (
                            <img
                              src={p.student.profileImage.url}
                              alt={p.student.name}
                              className="pp-avatar"
                            />
                          ) : (
                            <div className="pp-avatar-placeholder">
                              {p.student.name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <span className="pp-name">{p.student.name}</span>
                        </div>
                      </td>
                      <td className="pp-td-muted">{p.student.email}</td>
                      <td>{p.student.department || "—"}</td>
                      <td>{p.student.batchYear || "—"}</td>
                      <td>
                        <span className={`pp-badge pp-badge--${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        {p.attended ? (
                          <span className="pp-attended-yes">✓ Yes</span>
                        ) : (
                          <span className="pp-attended-no">—</span>
                        )}
                      </td>
                      <td className="pp-td-muted">
                        {new Date(p.registeredAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

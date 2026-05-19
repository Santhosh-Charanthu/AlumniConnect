"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Star, Sparkles, MessageSquare } from "lucide-react";
import "./AiMatchModal.css";

export default function AiMatchModal({ open, onClose }) {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/matched-alumni`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations);
        setFetched(true);
      } else {
        setError(data.message || "Failed to fetch recommendations");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !fetched) fetchRecommendations();
  }, [open, fetched, fetchRecommendations]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-title">
            <span className="ai-modal-sparkle">✦</span>
            <div>
              <h2>AI Match</h2>
              <p>Top alumni matched to your interests</p>
            </div>
          </div>
          <button
            className="ai-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="ai-modal-body">
          {loading && (
            <div className="ai-modal-loading">
              <div className="ai-spinner" />
              <p>Finding your best matches...</p>
            </div>
          )}

          {error && !loading && (
            <div className="ai-modal-error">
              <p>{error}</p>
              <button onClick={fetchRecommendations} className="ai-retry-btn">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && recommendations.length > 0 && (
            <div className="ai-cards-grid">
              {recommendations.map((rec, i) => (
                <AiAlumniCard
                  key={i}
                  rec={rec}
                  rank={i + 1}
                  router={router}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AiAlumniCard({ rec, rank, router, onClose }) {
  const name = rec.name || "Alumni";
  const company = rec.compay || rec.company || "";
  const initial = name.charAt(0).toUpperCase();

  const handleMessage = (e) => {
    e.stopPropagation();
    onClose();
    router.push(`/student/messages?name=${encodeURIComponent(name)}`);
  };

  return (
    <div
      className="ai-alumni-card"
      onClick={() => {
        onClose();
        router.push(`/student/alumni/${rec.alumniId}`);
      }}
      style={{ cursor: "pointer" }}
    >
      {/* Rank badge */}
      <span className="ai-rank-badge">#{rank}</span>

      {/* Avatar */}
      {rec.image?.url ? (
        <img src={rec.image.url} alt={name} className="ai-card-img" />
      ) : (
        <div className="ai-card-img-placeholder">{initial}</div>
      )}

      <h3 className="ai-card-name">{name}</h3>
      <p className="ai-card-job">
        {rec.jobTitle}
        {company ? ` @ ${company}` : ""}
      </p>

      {/* Match score */}
      <div className="ai-match-score">
        <span className="ai-score-bar-wrap">
          <span
            className="ai-score-bar-fill"
            style={{ width: `${rec.score}%` }}
          />
        </span>
        <span className="ai-score-label">{rec.score}% match</span>
      </div>

      {/* Skills */}
      <div className="ai-card-skills">
        {(rec.skills || []).slice(0, 3).map((skill, i) => (
          <span key={i} className="ai-card-skill">
            {skill}
          </span>
        ))}
      </div>

      <button className="ai-card-msg-btn" onClick={handleMessage}>
        <MessageSquare size={13} />
        Message
      </button>
    </div>
  );
}

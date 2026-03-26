"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import "./ReviewModal.css";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

// Props:
//   session   — { _id, title }
//   existing  — existing review object { _id, rating, comment } for edit mode (optional)
//   onClose   — fn()
//   onSubmitted — fn(review)  called after create
//   onUpdated   — fn(review)  called after edit
export default function ReviewModal({ session, existing, onClose, onSubmitted, onUpdated }) {
  const isEdit = !!existing;
  const [rating, setRating] = useState(existing?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existing?.comment || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rating) { setError("Please select a star rating."); return; }
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let res, data;

      if (isEdit) {
        res = await fetch(`${API_BASE}/student/reviews/${existing._id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment: comment.trim() }),
        });
        data = await res.json();
        if (data.success) { onUpdated && onUpdated(data.review); onClose(); }
        else setError(data.message || "Failed to update review");
      } else {
        res = await fetch(`${API_BASE}/student/sessions/${session._id}/review`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment: comment.trim() }),
        });
        data = await res.json();
        if (data.success) { onSubmitted && onSubmitted(data.review); onClose(); }
        else setError(data.message || "Failed to submit review");
      }
    } catch {
      setError(isEdit ? "Failed to update review" : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <div>
            <h2>{isEdit ? "Edit Review" : "Leave a Review"}</h2>
            <p className="review-session-name">{session?.title}</p>
          </div>
          <button className="review-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="review-stars-row">
          <p className="review-label">Your rating</p>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                className="star-btn"
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(s)}
                aria-label={`${s} star${s > 1 ? "s" : ""}`}
              >
                <Star
                  size={32}
                  fill={(hovered || rating) >= s ? "#f59e0b" : "none"}
                  color={(hovered || rating) >= s ? "#f59e0b" : "#d1d5db"}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="rating-label-text">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>

        <div className="review-comment-group">
          <label className="review-label">Your review (optional)</label>
          <textarea
            className="review-textarea"
            placeholder="Share your experience with this session..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <span className="review-char-count">{comment.length}/500</span>
        </div>

        {error && <p className="review-error">{error}</p>}

        <div className="review-modal-actions">
          <button className="review-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="review-btn-submit" onClick={handleSubmit} disabled={loading || !rating}>
            {loading ? (isEdit ? "Saving..." : "Submitting...") : (isEdit ? "Save Changes" : "Submit Review")}
          </button>
        </div>
      </div>
    </div>
  );
}

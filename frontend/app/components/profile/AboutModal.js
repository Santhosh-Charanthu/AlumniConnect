"use client";
import { useState } from "react";
import "../../../src/styles/AboutModal.css";

export default function AboutModal({ isOpen, onClose, onSave, initialValue = "" }) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!value.trim()) { setError("About section cannot be empty."); return; }
    if (value.trim().length < 20) { setError("Please write at least 20 characters."); return; }
    setError("");
    onSave(value);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Add About</h3>

        <textarea
          className="about-textarea"
          placeholder="Write about your journey, experience, and how you help students..."
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
        />
        {error && <p className="field-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>

          <button className="btn primary" onClick={handleSave}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

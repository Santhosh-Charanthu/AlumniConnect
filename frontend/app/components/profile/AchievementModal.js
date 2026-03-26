"use client";
import { useState } from "react";
import "../../../src/styles/AchievementModal.css";

export default function AchievementModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    year: "",
    certificateUrl: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Add Achievement</h3>

        <div className="form-group">
          <label>Title</label>
          <input
            name="title"
            placeholder="Achievement title"
            value={form.title}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            placeholder="Describe the achievement"
            maxLength={300}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Year</label>
          <input
            type="number"
            name="year"
            placeholder="e.g. 2023"
            value={form.year}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Certificate URL</label>
          <input
            name="certificateUrl"
            placeholder="https://certificate-link.com"
            value={form.certificateUrl}
            onChange={handleChange}
          />
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn primary"
            onClick={() => onSave(form)}
            disabled={
              !form.title ||
              !form.description ||
              !form.year ||
              !form.certificateUrl
            }
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSave = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (!form.year) errs.year = "Year is required.";
    else if (!/^\d{4}$/.test(form.year) || Number(form.year) < 1900 || Number(form.year) > new Date().getFullYear())
      errs.year = "Enter a valid year.";
    if (form.certificateUrl) {
      try { new URL(form.certificateUrl); } catch { errs.certificateUrl = "Enter a valid URL."; }
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
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
          {errors.title && <p className="field-error">{errors.title}</p>}
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
          {errors.description && <p className="field-error">{errors.description}</p>}
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
          {errors.year && <p className="field-error">{errors.year}</p>}
        </div>

        <div className="form-group">
          <label>Certificate URL</label>
          <input
            name="certificateUrl"
            placeholder="https://certificate-link.com"
            value={form.certificateUrl}
            onChange={handleChange}
          />
          {errors.certificateUrl && <p className="field-error">{errors.certificateUrl}</p>}
        </div>

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

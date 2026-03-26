"use client";
import { useState } from "react";
import "../../../src/styles/ExperienceModal.css";

export default function ExperienceModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    isPresent: false,
    description: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Add Experience</h3>

        <div className="form-group">
          <label>Company</label>
          <input
            name="company"
            placeholder="Company"
            value={form.company}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Role</label>
          <input
            name="role"
            placeholder="Role"
            value={form.role}
            onChange={handleChange}
          />
        </div>

        <div className="date-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              disabled={form.isPresent}
            />
          </div>
        </div>

        <div className="present-checkbox">
          <input
            type="checkbox"
            id="present"
            checked={form.isPresent}
            onChange={(e) =>
              setForm({
                ...form,
                isPresent: e.target.checked,
                endDate: e.target.checked ? "" : form.endDate,
              })
            }
          />
          <label htmlFor="present">Currently working here</label>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            placeholder="Describe your role and responsibilities"
            maxLength={300}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn primary"
            onClick={() =>
              onSave({
                company: form.company,
                role: form.role,
                startDate: form.startDate,
                endDate: form.isPresent ? null : form.endDate,
                description: form.description,
              })
            }
            disabled={
              !form.company ||
              !form.role ||
              !form.startDate ||
              !form.description
            }
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

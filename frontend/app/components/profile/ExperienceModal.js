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
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSave = () => {
    const errs = {};
    if (!form.company.trim()) errs.company = "Company is required.";
    if (!form.role.trim()) errs.role = "Role is required.";
    if (!form.startDate) errs.startDate = "Start date is required.";
    if (!form.isPresent && !form.endDate) errs.endDate = "End date is required.";
    if (!form.isPresent && form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate))
      errs.endDate = "End date must be after start date.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      company: form.company,
      role: form.role,
      startDate: form.startDate,
      endDate: form.isPresent ? null : form.endDate,
      description: form.description,
    });
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
          {errors.company && <p className="field-error">{errors.company}</p>}
        </div>

        <div className="form-group">
          <label>Role</label>
          <input
            name="role"
            placeholder="Role"
            value={form.role}
            onChange={handleChange}
          />
          {errors.role && <p className="field-error">{errors.role}</p>}
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
            {errors.startDate && <p className="field-error">{errors.startDate}</p>}
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
            {errors.endDate && <p className="field-error">{errors.endDate}</p>}
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
          {errors.description && <p className="field-error">{errors.description}</p>}
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

"use client";
import { useState } from "react";
import "../../../src/styles/ProjectModal.css";

export default function ProjectModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    techStack: "",
    liveLink: "",
    repoLink: "",
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const isValidUrl = (url) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleSave = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Project title is required.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (!form.techStack.trim()) errs.techStack = "Tech stack is required.";
    if (form.liveLink && !isValidUrl(form.liveLink)) errs.liveLink = "Enter a valid URL.";
    if (form.repoLink && !isValidUrl(form.repoLink)) errs.repoLink = "Enter a valid URL.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      title: form.title,
      description: form.description,
      techStack: form.techStack.split(",").map((t) => t.trim()).filter(Boolean),
      liveLink: form.liveLink,
      repoLink: form.repoLink,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Add Project</h3>

        <div className="form-group">
          <label>Project Title</label>
          <input
            name="title"
            placeholder="Project title"
            value={form.title}
            onChange={handleChange}
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            placeholder="Brief description of the project"
            maxLength={300}
            value={form.description}
            onChange={handleChange}
          />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>

        <div className="form-group">
          <label>Tech Stack</label>
          <input
            name="techStack"
            placeholder="React, Node.js, MongoDB"
            value={form.techStack}
            onChange={handleChange}
          />
          {errors.techStack && <p className="field-error">{errors.techStack}</p>}
        </div>

        <div className="form-group">
          <label>Live Demo Link</label>
          <input
            name="liveLink"
            placeholder="https://project-demo.com"
            value={form.liveLink}
            onChange={handleChange}
          />
          {errors.liveLink && <p className="field-error">{errors.liveLink}</p>}
        </div>

        <div className="form-group">
          <label>Repository Link</label>
          <input
            name="repoLink"
            placeholder="https://github.com/username/project"
            value={form.repoLink}
            onChange={handleChange}
          />
          {errors.repoLink && <p className="field-error">{errors.repoLink}</p>}
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

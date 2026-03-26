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

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
        </div>

        <div className="form-group">
          <label>Tech Stack</label>
          <input
            name="techStack"
            placeholder="React, Node.js, MongoDB"
            value={form.techStack}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Live Demo Link</label>
          <input
            name="liveLink"
            placeholder="https://project-demo.com"
            value={form.liveLink}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Repository Link</label>
          <input
            name="repoLink"
            placeholder="https://github.com/username/project"
            value={form.repoLink}
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
                title: form.title,
                description: form.description,
                techStack: form.techStack
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
                liveLink: form.liveLink,
                repoLink: form.repoLink,
              })
            }
            disabled={
              !form.title ||
              !form.description ||
              !form.techStack ||
              !form.liveLink ||
              !form.repoLink
            }
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import "../../../src/styles/AboutModal.css";

export default function AboutModal({
  isOpen,
  onClose,
  onSave,
  initialValue = "",
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Add About</h3>

        <textarea
          className="about-textarea"
          placeholder="Write about your journey, experience, and how you help students..."
          defaultValue={initialValue}
        />

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn primary"
            onClick={() => {
              const textarea = document.querySelector(".about-textarea");
              onSave(textarea.value);
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

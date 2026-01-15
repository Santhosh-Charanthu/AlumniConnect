"use client";
import { useEffect, useState } from "react";
import "../../styles/Toast.css"; // we'll reuse your CSS

export default function Toast({ type, message, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 3000); // auto close after 3s
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 400); // wait for fadeOut animation
  };

  if (!visible) return null;

  return (
    <div
      id={`toast-${type}`}
      className={`toast-box glass ${type}`}
      style={{ animation: "fadeIn 0.3s ease-out" }}
    >
      <div className="toast-left">
        <div className="toast-icon-circle">
          <span className="toast-check">{type === "success" ? "✔" : "❌"}</span>
        </div>
      </div>
      <div className="toast-body">
        <div className="toast-title">
          {type === "success" ? "Success!" : "Error!"}
        </div>
        <div className="toast-msg">{message}</div>
        <div className={`toast-bar ${type === "error" ? "error-bar" : ""}`} />
      </div>
      <button className="toast-close" onClick={handleClose}>
        ×
      </button>
    </div>
  );
}

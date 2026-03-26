"use client";
import { useEffect, useState } from "react";
import "../../styles/Toast.css";

const ICONS = {
  success: "✔",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const TITLES = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

export default function Toast({ type = "success", message, onClose }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => handleClose(), 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onClose(), 350); // match fadeOut duration
  };

  return (
    <div className={`toast-box glass ${type} ${leaving ? "toast-leaving" : "toast-entering"}`}>
      <div className="toast-left">
        <div className="toast-icon-circle">
          <span className="toast-check">{ICONS[type] ?? "ℹ"}</span>
        </div>
      </div>
      <div className="toast-body">
        <div className="toast-title">{TITLES[type] ?? "Notice"}</div>
        <div className="toast-msg">{message}</div>
        <div className={`toast-bar ${type !== "success" ? "error-bar" : ""}`} />
      </div>
      <button className="toast-close" onClick={handleClose} aria-label="Close">×</button>
    </div>
  );
}

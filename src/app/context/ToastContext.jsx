"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Toast from "../components/Toast";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  // 🔁 Show toast normally (same page)
  const showToast = (type, message) => {
    // 🧹 clear any old redirect flash
    sessionStorage.removeItem("flash");

    setToast({ type, message });
  };

  // 🔁 Show toast AFTER redirect
  const showToastAfterRedirect = (type, message) => {
    sessionStorage.setItem("flash", JSON.stringify({ type, message }));
  };

  // 🔁 On every page load, check for flash message
  useEffect(() => {
    const flash = sessionStorage.getItem("flash");

    if (flash) {
      setToast(JSON.parse(flash));
      sessionStorage.removeItem("flash");
    }
  }, []);

  const closeToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast, showToastAfterRedirect }}>
      {children}

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={closeToast} />
      )}
    </ToastContext.Provider>
  );
}

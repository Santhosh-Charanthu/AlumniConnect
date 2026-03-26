"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Toast from "../components/Toast";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const pathname = usePathname();
  const prevPathname = useRef(null);
  const isNavigating = useRef(false);

  // Mark that a redirect is about to happen
  const showToastAfterRedirect = (type, message) => {
    isNavigating.current = true;
    sessionStorage.setItem("navigating", "1");
    sessionStorage.setItem("flash", JSON.stringify({ type, message }));
  };

  // Show toast immediately (same page)
  const showToast = (type, message) => {
    sessionStorage.removeItem("flash");
    setToast({ type, message });
  };

  // Only consume flash when the pathname actually changed (real navigation, not refresh)
  useEffect(() => {
    if (prevPathname.current === null) {
      // First render — this is either a hard refresh or initial load.
      // Only show flash if we flagged a navigation (isNavigating won't be set on refresh).
      // We can't distinguish perfectly, so we use a sessionStorage flag set just before router.push.
      const navigated = sessionStorage.getItem("navigating");
      if (navigated) {
        sessionStorage.removeItem("navigating");
        const flash = sessionStorage.getItem("flash");
        if (flash) {
          setToast(JSON.parse(flash));
          sessionStorage.removeItem("flash");
        }
      } else {
        // Hard refresh — clear any stale flash silently
        sessionStorage.removeItem("flash");
      }
    } else if (prevPathname.current !== pathname) {
      // Client-side navigation happened
      const flash = sessionStorage.getItem("flash");
      if (flash) {
        setToast(JSON.parse(flash));
        sessionStorage.removeItem("flash");
      }
    }

    prevPathname.current = pathname;
  }, [pathname]);

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

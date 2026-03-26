"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { connectSocket, getSocket } from "../../lib/socket";

const NotificationContext = createContext({ unreadCount: 0, setUnreadCount: () => {}, refreshUnread: () => {} });

export function NotificationProvider({ children, role = "alumni" }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  const apiUrl = role === "student"
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/notifications`
    : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumni/notifications`;

  const refreshUnread = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && mountedRef.current) setUnreadCount(data.unreadCount);
    } catch (_) {}
  }, [apiUrl]);

  // Initial fetch
  useEffect(() => {
    refreshUnread();
    return () => { mountedRef.current = false; };
  }, [refreshUnread]);

  // Socket: connect and listen for live notifications
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = connectSocket(token);

    const onNew = () => {
      if (mountedRef.current) setUnreadCount((c) => c + 1);
    };

    socket.on("notification:new", onNew);
    return () => socket.off("notification:new", onNew);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

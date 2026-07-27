"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { connectSocket } from "../../src/lib/socket";

const MessageContext = createContext({
  unreadMessages: 0,
  unreadDMs: 0,
  unreadGroups: 0,
  setUnreadMessages: () => {},
  decrementUnread: () => {},
  setActiveConversation: () => {},
});

function getMyUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).userId;
  } catch {
    return null;
  }
}

export function MessageProvider({ children }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadDMs, setUnreadDMs] = useState(0);
  const [unreadGroups, setUnreadGroups] = useState(0);
  const mountedRef = useRef(true);
  // { type: "group"|"direct", id: string } — set by messages page when a convo is open
  const activeConvRef = useRef(null);

  const setActiveConversation = useCallback((conv) => {
    activeConvRef.current = conv; // { type, id } or null
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success && mountedRef.current) {
        setUnreadMessages(data.unreadCount);
        setUnreadDMs(data.unreadDMs ?? 0);
        setUnreadGroups(data.unreadGroups ?? 0);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnread();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchUnread]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = connectSocket(token);
    const myId = getMyUserId();

    const onGroupMsg = (msg) => {
      if (!mountedRef.current) return;
      const senderId = String(msg.senderId?._id || msg.senderId);
      if (senderId === String(myId)) return;
      // Skip if user is currently viewing this group
      const gid = String(msg.groupId);
      const active = activeConvRef.current;
      if (active?.type === "group" && String(active.id) === gid) return;
      setUnreadMessages((c) => c + 1);
      setUnreadGroups((c) => c + 1);
    };

    const onDmMsg = (msg) => {
      if (!mountedRef.current) return;
      const senderId = String(msg.senderId?._id || msg.senderId);
      if (senderId === String(myId)) return;
      // Skip if user is currently viewing this DM
      const active = activeConvRef.current;
      if (active?.type === "direct" && String(active.id) === senderId) return;
      setUnreadMessages((c) => c + 1);
      setUnreadDMs((c) => c + 1);
    };

    // Re-fetch on read ack to get accurate counts
    const onReadAck = () => {
      if (mountedRef.current) fetchUnread();
    };

    socket.on("group:receive", onGroupMsg);
    socket.on("dm:receive", onDmMsg);
    socket.on("dm:read_ack", onReadAck);
    socket.on("group:read_ack", onReadAck);

    return () => {
      socket.off("group:receive", onGroupMsg);
      socket.off("dm:receive", onDmMsg);
      socket.off("dm:read_ack", onReadAck);
      socket.off("group:read_ack", onReadAck);
    };
  }, [fetchUnread]);

  // Called by messages page when opening a conversation to subtract its count
  const decrementUnread = useCallback((count, type) => {
    if (count <= 0) return;
    setUnreadMessages((c) => Math.max(0, c - count));
    if (type === "direct") setUnreadDMs((c) => Math.max(0, c - count));
    if (type === "group") setUnreadGroups((c) => Math.max(0, c - count));
  }, []);

  return (
    <MessageContext.Provider
      value={{
        unreadMessages,
        unreadDMs,
        unreadGroups,
        setUnreadMessages,
        decrementUnread,
        setActiveConversation,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export const useMessages = () => useContext(MessageContext);

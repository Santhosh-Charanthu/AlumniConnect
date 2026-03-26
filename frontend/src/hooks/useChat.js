"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";

export function useChat(type, targetId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(null); // track which targetId we've loaded

  // ── Load history from REST on targetId change ──────────────
  useEffect(() => {
    if (!targetId) return;
    if (loadedRef.current === targetId) return; // already loaded
    loadedRef.current = targetId;

    setLoading(true);
    setTypingUsers([]);

    const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const API = base.endsWith("/api") ? base : `${base}/api`;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const url =
      type === "group"
        ? `${API}/chat/groups/${targetId}/messages`
        : `${API}/chat/dm/${targetId}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMessages(d.messages || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, targetId]);

  // ── Socket listeners ────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !targetId) return;

    const onReceive = (msg) => {
      if (type === "direct") {
        const senderId = String(msg.senderId?._id || msg.senderId);
        const receiverId = String(msg.receiverId?._id || msg.receiverId);
        const tid = String(targetId);
        // Relevant if the other party in the conversation is targetId
        const isRelevant = senderId === tid || receiverId === tid;
        if (!isRelevant) return;
      } else {
        if (String(msg.groupId) !== String(targetId)) return;
      }
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Immediately mark as read since the chat is open
      const socket = getSocket();
      if (socket) {
        if (type === "direct") socket.emit("dm:read", { from: targetId });
        else socket.emit("group:read", { groupId: targetId });
      }
    };

    const onEdited = (msg) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };

    const onDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    const onTypingStart = ({ userId, groupId }) => {
      const relevant = type === "group" ? String(groupId) === String(targetId) : userId === targetId;
      if (relevant) setTypingUsers((p) => [...new Set([...p, userId])]);
    };

    const onTypingStop = ({ userId, groupId }) => {
      const relevant = type === "group" ? String(groupId) === String(targetId) : userId === targetId;
      if (relevant) setTypingUsers((p) => p.filter((id) => id !== userId));
    };

    // Live read receipts for group — update readBy on all messages in this group
    const onGroupReadAck = ({ groupId, readBy, totalMembers }) => {
      if (type !== "group" || String(groupId) !== String(targetId)) return;
      setMessages((prev) =>
        prev.map((m) => {
          const alreadyRead = m.readBy && m.readBy.map(String).includes(String(readBy));
          if (!alreadyRead) {
            return {
              ...m,
              readBy: [...(m.readBy || []), readBy],
              _totalMembers: totalMembers,
            };
          }
          // Always update totalMembers in case it changed
          return { ...m, _totalMembers: totalMembers };
        })
      );
    };

    // Live read receipts for DM — mark messages as read when recipient reads them
    const onDMReadAck = ({ by }) => {
      if (type !== "direct") return;
      setMessages((prev) =>
        prev.map((m) => (!m.isRead ? { ...m, isRead: true } : m))
      );
    };

    const receiveEvent = type === "direct" ? "dm:receive" : "group:receive";
    socket.on(receiveEvent, onReceive);
    socket.on("message:edited", onEdited);
    socket.on("message:deleted", onDeleted);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("group:read_ack", onGroupReadAck);
    socket.on("dm:read_ack", onDMReadAck);

    // Mark as read
    if (type === "direct") socket.emit("dm:read", { from: targetId });
    else socket.emit("group:read", { groupId: targetId });

    return () => {
      socket.off(receiveEvent, onReceive);
      socket.off("message:edited", onEdited);
      socket.off("message:deleted", onDeleted);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("group:read_ack", onGroupReadAck);
      socket.off("dm:read_ack", onDMReadAck);
    };
  }, [type, targetId]);

  const sendMessage = useCallback(
    (content, media = null) => {
      const socket = getSocket();
      if (!socket || (!content.trim() && !media)) return;
      const payload = media
        ? { content: content || "", mediaUrl: media.url, mediaType: media.type, mediaName: media.name }
        : { content };
      if (type === "direct") socket.emit("dm:send", { to: targetId, ...payload });
      else socket.emit("group:send", { groupId: targetId, ...payload });
    },
    [type, targetId]
  );

  const editMessage = useCallback((messageId, content) => {
    const socket = getSocket();
    if (!socket || !content.trim()) return;
    socket.emit("message:edit", { messageId, content });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("message:delete", { messageId });
  }, []);

  const sendTyping = useCallback(
    (isTyping) => {
      const socket = getSocket();
      if (!socket) return;
      const event = isTyping ? "typing:start" : "typing:stop";
      if (type === "direct") socket.emit(event, { to: targetId });
      else socket.emit(event, { groupId: targetId });
    },
    [type, targetId]
  );

  return { messages, loading, typingUsers, sendMessage, editMessage, deleteMessage, sendTyping };
}

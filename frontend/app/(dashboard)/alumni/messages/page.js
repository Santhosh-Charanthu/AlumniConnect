"use client";

// Alumni messages page - same UI as student, just different import path for CSS
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Send, ArrowLeft, MessageSquare, Users,
  Pencil, Trash2, CheckCheck, X, MoreVertical, Paperclip, FileText, Play
} from "lucide-react";
import { authFetch } from "../../../../src/services/authFetch";
import { connectSocket, getSocket } from "../../../../src/lib/socket";
import { useChat } from "../../../../src/hooks/useChat";
import { useMessages } from "../../../context/MessageContext";
import Loader from "../../../components/Loader";
// Reuse the same CSS
import "../../../(student-dashboard)/student/messages/messages.css";

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDateSeparator(iso) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today - 86400000);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDay.getTime() === today.getTime()) return "Today";
  if (msgDay.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function TypingBubble() {
  return (
    <div className="typing-bubble">
      <span /><span /><span />
    </div>
  );
}

async function downloadPdf(url, name) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;
  const proxyUrl = `${API}/chat/proxy-download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name || "document.pdf")}`;
  try {
    const res = await fetch(proxyUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("proxy failed");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = name || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (e) {
    console.error("PDF download failed:", e);
  }
}

function MediaBubble({ msg }) {
  if (!msg.mediaUrl) return null;
  if (msg.mediaType === "image") {
    return (
      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
        <img src={msg.mediaUrl} alt={msg.mediaName || "image"} className="media-img" />
      </a>
    );
  }
  if (msg.mediaType === "video") {
    return (
      <video controls className="media-video" src={msg.mediaUrl}>
        Your browser does not support video.
      </video>
    );
  }
  if (msg.mediaType === "pdf") {
    return (
      <button onClick={() => downloadPdf(msg.mediaUrl, msg.mediaName)} className="media-pdf">
        <FileText size={18} />
        <span>{msg.mediaName || "Document"}</span>
        <span className="media-pdf-dl">? Download</span>
      </button>
    );
  }
  return null;
}

function ContextMenu({ onEdit, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="ctx-menu">
      <button onClick={onEdit}><Pencil size={13} /> Edit</button>
      <button onClick={onDelete} className="ctx-delete"><Trash2 size={13} /> Delete</button>
    </div>
  );
}

function ChatPanel({ type, targetId, targetName, targetMeta, totalMembers = 2, myId, onBack, isGroupActive = true }) {
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [typingTimer, setTypingTimer] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [groupDeactivated, setGroupDeactivated] = useState(!isGroupActive);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const { messages, loading, typingUsers, sendMessage, editMessage, deleteMessage, sendTyping } =
    useChat(type, targetId);

  // Listen for group deactivation
  useEffect(() => {
    const socket = getSocket();
    if (!socket || type !== "group") return;
    const onDeactivated = ({ groupId }) => {
      if (groupId === targetId) setGroupDeactivated(true);
    };
    socket.on("group:deactivated", onDeactivated);
    return () => socket.off("group:deactivated", onDeactivated);
  }, [targetId, type]);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() && !mediaPreview) return;
    if (mediaPreview) {
      setUploading(true);
      try {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", mediaPreview.file);
        const res = await fetch(`${API}/chat/upload-media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          sendMessage(input.trim(), { url: data.url, type: data.mediaType, name: data.mediaName });
        }
      } catch (e) { console.error(e); }
      finally { setUploading(false); }
      setMediaPreview(null);
    } else {
      sendMessage(input.trim());
    }
    setInput("");
    sendTyping(false);
    clearTimeout(typingTimer);
    inputRef.current?.focus();
  }, [input, mediaPreview, sendMessage, sendTyping, typingTimer]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = file.type;
    let type = "image";
    if (mime.startsWith("video/")) type = "video";
    else if (mime === "application/pdf") type = "pdf";
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type, name: file.name, file });
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimer);
    setTypingTimer(setTimeout(() => sendTyping(false), 2000));
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const openCtx = (msg) => {
    setActiveMenu((prev) => prev === msg._id ? null : msg._id);
  };

  const startEdit = (msg) => { setEditingId(msg._id); setEditInput(msg.content); setActiveMenu(null); };
  const submitEdit = () => {
    if (!editInput.trim()) return;
    editMessage(editingId, editInput.trim());
    setEditingId(null); setEditInput("");
  };
  const cancelEdit = () => { setEditingId(null); setEditInput(""); };
  const handleDelete = (id) => { setActiveMenu(null); setConfirmDelete(id); };

  return (
    <>
      <div className="thread-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className={`thread-avatar ${type === "group" ? "group-av" : ""}`}>
          {type === "group" ? <Users size={17} /> : getInitials(targetName)}
        </div>
        <div className="thread-header-info">
          <p className="thread-contact-name">{targetName}</p>
          <p className="thread-contact-role">{targetMeta}</p>
        </div>
      </div>

      <div className="messages-list">
        {loading ? (
          <div className="chat-loader"><Loader /></div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <MessageSquare size={36} />
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId?._id === myId || msg.senderId === myId;
            const othersCount = type === "group" ? (msg._totalMembers ? msg._totalMembers - 1 : totalMembers - 1) : 1;
            const readCount = type === "group"
              ? (msg.readBy?.filter((id) => String(id) !== String(myId)).length || 0)
              : (msg.isRead ? 1 : 0);
            const seenByAll = readCount >= othersCount;
            const showDate = i === 0 || !isSameDay(messages[i - 1].createdAt, msg.createdAt);
            const showAvatar = !isMe && type === "group" &&
              (i === messages.length - 1 || messages[i + 1]?.senderId?._id !== msg.senderId?._id);

            return (
              <div key={msg._id}>
                {showDate && (
                  <div className="date-separator">
                    <span>{formatDateSeparator(msg.createdAt)}</span>
                  </div>
                )}
                {msg.isSystem ? (
                  <div className="system-msg-row">
                    <span className="system-msg">{msg.content}</span>
                  </div>
                ) : (
                <div className={`msg-row ${isMe ? "me" : "other"}`}>
                  {!isMe && type === "group" && (
                    <div className={`msg-avatar ${showAvatar ? "" : "invisible"}`}>
                      {getInitials(msg.senderId?.name)}
                    </div>
                  )}
                  <div className="msg-wrap">
                    {!isMe && type === "group" && showAvatar && (
                      <p className="msg-sender-name">{msg.senderId?.name}</p>
                    )}
                    <div className="bubble-outer">
                      {isMe && (
                        <div className="msg-actions">
                          <button className="msg-dots-btn" onClick={() => openCtx(msg)}>
                            <MoreVertical size={15} />
                          </button>
                          {activeMenu === msg._id && (
                            <ContextMenu
                              onEdit={() => startEdit(msg)}
                              onDelete={() => handleDelete(msg._id)}
                              onClose={() => setActiveMenu(null)}
                            />
                          )}
                        </div>
                      )}
                      <div
                        className={`message-bubble ${isMe ? "me" : "them"}`}
                        onDoubleClick={() => isMe && startEdit(msg)}
                      >
                        {msg.mediaUrl && <MediaBubble msg={msg} />}
                        {msg.content && <span className="message-text">{msg.content}</span>}
                        <div className="bubble-footer">
                          <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.edited && <span className="edited-tag">edited</span>}
                          {isMe && (
                            <span className="seen-icon">
                              {seenByAll
                                ? <CheckCheck size={13} color="#4fc3f7" />
                                : <CheckCheck size={13} color="#c4b5a5" />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            );
          })
        )}
        {typingUsers.length > 0 && (
          <div className="msg-row other">
            <div className="msg-avatar" />
            <TypingBubble />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {editingId && (
        <div className="edit-bar">
          <Pencil size={14} color="#ff7a18" />
          <span>Editing message</span>
          <button className="edit-bar-cancel" onClick={cancelEdit}><X size={14} /></button>
        </div>
      )}

      {groupDeactivated ? (
        <div className="group-closed-bar">
          This session has been cancelled. This group is now closed.
        </div>
      ) : (
      <div className="message-input-area">
        {mediaPreview && (
          <div className="media-preview-bar">
            {mediaPreview.type === "image" && <img src={mediaPreview.url} alt="preview" className="media-preview-thumb" />}
            {mediaPreview.type === "video" && <Play size={16} />}
            {mediaPreview.type === "pdf" && <FileText size={16} />}
            <span className="media-preview-name">{mediaPreview.name}</span>
            <button className="media-preview-remove" onClick={() => setMediaPreview(null)}><X size={14} /></button>
          </div>
        )}
        <div className="media-input-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
            <Paperclip size={18} />
          </button>
          <textarea
            ref={inputRef}
            className="message-input"
            placeholder={editingId ? "Edit message..." : "Type a message"}
            value={editingId ? editInput : input}
            onChange={editingId ? (e) => setEditInput(e.target.value) : handleInputChange}
            onKeyDown={editingId
              ? (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); } if (e.key === "Escape") cancelEdit(); }
              : handleKeyDown}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={editingId ? submitEdit : handleSend}
            disabled={uploading || (editingId ? !editInput.trim() : (!input.trim() && !mediaPreview))}
          >
            {uploading ? <span className="upload-spinner" /> : <Send size={18} />}
          </button>
        </div>
      </div>
      )}

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p>Delete this message?</p>
            <p className="confirm-sub">This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="confirm-delete" onClick={() => { deleteMessage(confirmDelete); setConfirmDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AlumniMessagesPage() {
  const [tab, setTab] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [myId, setMyId] = useState(null);
  const [search, setSearch] = useState("");
  const [unreadMap, setUnreadMap] = useState({});
  const { decrementUnread, setActiveConversation } = useMessages();
  const selectedRef = useRef(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setMyId(payload.userId);
    } catch {}
    connectSocket(token);
    loadData();
    return () => setActiveConversation(null);
  }, []);

  const loadData = async () => {
    try {
      const [gRes, dRes] = await Promise.all([
        authFetch(`${API}/chat/groups`),
        authFetch(`${API}/chat/dm/conversations`),
      ]);
      const gData = await gRes.json();
      const dData = await dRes.json();
      if (gData.success) {
        setGroups(gData.groups);
        const groupInitial = {};
        gData.groups.forEach((g) => { if (g.unread > 0) groupInitial[g._id] = g.unread; });
        setUnreadMap((prev) => ({ ...prev, ...groupInitial }));
      }
      if (dData.success) {
        setConversations(dData.conversations);
        const dmInitial = {};
        dData.conversations.forEach((c) => {
          if (c.unread > 0) dmInitial[c._id] = c.unread;
        });
        setUnreadMap((prev) => ({ ...prev, ...dmInitial }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const myIdNow = myId;

    const onGroupMsg = (msg) => {
      const gid = String(msg.groupId);
      setGroups((prev) =>
        prev.map((g) =>
          String(g._id) === gid
            ? { ...g, lastMessage: msg, lastMessageAt: msg.createdAt }
            : g
        ).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
      );
      const senderId = String(msg.senderId?._id || msg.senderId);
      const isOpen = selectedRef.current?.type === "group" && String(selectedRef.current?.id) === gid;
      if (!isOpen && senderId !== String(myIdNow)) {
        setUnreadMap((prev) => ({ ...prev, [gid]: (prev[gid] || 0) + 1 }));
      }
    };

    const onDMMsg = (msg) => {
      const senderId = String(msg.senderId?._id || msg.senderId);
      const receiverId = String(msg.receiverId?._id || msg.receiverId);
      // The conversation partner is whoever is NOT me
      const partnerId = senderId === String(myIdNow) ? receiverId : senderId;
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === partnerId ? { ...c, lastMessage: msg } : c
        )
      );
      const isOpen = selectedRef.current?.type === "direct" && String(selectedRef.current?.id) === partnerId;
      if (!isOpen && senderId !== String(myIdNow)) {
        setUnreadMap((prev) => ({ ...prev, [partnerId]: (prev[partnerId] || 0) + 1 }));
      }
    };

    socket.on("group:receive", onGroupMsg);
    socket.on("dm:receive", onDMMsg);
    return () => { socket.off("group:receive", onGroupMsg); socket.off("dm:receive", onDMMsg); };
  }, [myId]);

  const selectGroup = (g) => {
    const id = g._id;
    const count = unreadMap[id] || 0;
    if (count > 0) decrementUnread(count, "group");
    setUnreadMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setActiveConversation({ type: "group", id });
    setSelected({ type: "group", id, name: g.name, meta: `${g.members?.length} members`, totalMembers: g.members?.length || 0, isActive: g.isActive !== false });
    selectedRef.current = { type: "group", id };
  };
  const selectDM = (c) => {
    const id = c._id;
    const count = unreadMap[id] || 0;
    if (count > 0) decrementUnread(count, "direct");
    setUnreadMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setActiveConversation({ type: "direct", id });
    setSelected({ type: "direct", id, name: c.user?.name, meta: c.user?.role || "Member" });
    selectedRef.current = { type: "direct", id };
  };

  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  const filteredDMs = conversations.filter((c) => c.user?.name?.toLowerCase().includes(search.toLowerCase()));

  // Derive tab dot visibility directly from unreadMap
  const hasUnreadGroups = groups.some((g) => (unreadMap[g._id] || 0) > 0);
  const hasUnreadDMs = conversations.some((c) => (unreadMap[c._id] || 0) > 0);

  if (loading) return <Loader />;

  return (
    <div className="messages-page">
      <div className="messages-container">
        <div className={`contacts-panel ${selected ? "hidden-mobile" : ""}`}>
          <div className="contacts-header">
            <h2>Messages</h2>
            <div className="search-bar">
              <Search size={15} className="search-icon" />
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="msg-tabs">
              <button className={`msg-tab ${tab === "groups" ? "active" : ""}`} onClick={() => setTab("groups")}>
                <Users size={13} /> Groups
                {hasUnreadGroups && <span className="tab-dot" />}
              </button>
              <button className={`msg-tab ${tab === "dms" ? "active" : ""}`} onClick={() => setTab("dms")}>
                <MessageSquare size={13} /> Direct
                {hasUnreadDMs && <span className="tab-dot" />}
              </button>
            </div>
          </div>

          <div className="contacts-list">
            {tab === "groups" && (
              filteredGroups.length === 0
                ? <p className="empty-list">No groups yet. Create a session to get started.</p>
                : filteredGroups.map((g) => (
                  <div key={g._id} className={`contact-item ${selected?.id === g._id ? "active" : ""}`} onClick={() => selectGroup(g)}>
                    <div className="contact-avatar group-avatar"><Users size={15} /></div>
                    <div className="contact-info">
                      <p className="contact-name">{g.name}</p>
                      <p className="contact-preview">{g.lastMessage?.content || (g.lastMessage?.mediaType === "image" ? "?? Photo" : g.lastMessage?.mediaType === "video" ? "?? Video" : g.lastMessage?.mediaType === "pdf" ? "?? Document" : "No messages yet")}</p>
                    </div>
                    <div className="contact-meta">
                      <span className="contact-time">{formatTime(g.lastMessageAt)}</span>
                      {unreadMap[g._id] > 0
                        ? <span className="unread-dot">{unreadMap[g._id]}</span>
                        : <span className="member-count">{g.members?.length} members</span>}
                    </div>
                  </div>
                ))
            )}
            {tab === "dms" && (
              filteredDMs.length === 0
                ? <p className="empty-list">No direct messages yet.</p>
                : filteredDMs.map((c) => (
                  <div key={c._id} className={`contact-item ${selected?.id === c._id ? "active" : ""}`} onClick={() => selectDM(c)}>
                    <div className="contact-avatar">{getInitials(c.user?.name)}</div>
                    <div className="contact-info">
                      <p className="contact-name">{c.user?.name}</p>
                      <p className="contact-preview">{c.lastMessage?.content || (c.lastMessage?.mediaType === "image" ? "?? Photo" : c.lastMessage?.mediaType === "video" ? "?? Video" : c.lastMessage?.mediaType === "pdf" ? "?? Document" : "")}</p>
                    </div>
                    <div className="contact-meta">
                      <span className="contact-time">{formatTime(c.lastMessage?.createdAt)}</span>
                      {(unreadMap[c._id] || 0) > 0 && <span className="unread-dot">{unreadMap[c._id]}</span>}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className={`thread-panel ${selected ? "visible-mobile" : ""}`}>
          {!selected ? (
            <div className="thread-empty">
              <div className="thread-empty-icon"><MessageSquare size={40} /></div>
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <ChatPanel
              key={selected.id}
              type={selected.type}
              targetId={selected.id}
              targetName={selected.name}
              targetMeta={selected.meta}
              totalMembers={selected.totalMembers || 2}
              myId={myId}
              onBack={() => { setSelected(null); setActiveConversation(null); }}
              isGroupActive={selected.isActive !== false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

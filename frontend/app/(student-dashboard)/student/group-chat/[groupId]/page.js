"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Send,
  Pencil,
  Trash2,
  Check,
  CheckCheck,
  ArrowLeft,
  Users,
  Paperclip,
  FileText,
  X,
} from "lucide-react";
import { authFetch } from "../../../../../src/services/authFetch";
import { connectSocket, getSocket } from "../../../../../src/lib/socket";
import { useChat } from "../../../../../src/hooks/useChat";
import Loader from "../../../../components/Loader";
import "./group-chat.css";

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

async function downloadPdf(url, name) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const proxyUrl = `${API}/chat/proxy-download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name || "document.pdf")}`;
  try {
    const res = await fetch(proxyUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
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

export default function GroupChatPage() {
  const { groupId } = useParams();
  const router = useRouter();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Connect socket synchronously before useChat registers its listeners
  // This ensures getSocket() returns a valid instance when useChat's effect runs
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setMyId(payload.userId);
    } catch {}

    const sock = connectSocket(token);
    if (sock.connected) {
      setSocketReady(true);
      sock.emit("group:join_room", { groupId });
    } else {
      sock.once("connect", () => {
        setSocketReady(true);
        sock.emit("group:join_room", { groupId });
      });
    }

    const load = async () => {
      try {
        const res = await authFetch(`${API}/chat/groups`);
        const data = await res.json();
        if (data.success) {
          const found = data.groups.find((g) => g._id === groupId);
          setGroup(found || null);
          if (found && !found.isActive) setIsDeactivated(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId]);

  const {
    messages,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTyping,
  } = useChat("group", socketReady ? groupId : null);

  // Listen for real-time group deactivation
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onDeactivated = ({ groupId: gid }) => {
      if (String(gid) === String(groupId)) setIsDeactivated(true);
    };
    socket.on("group:deactivated", onDeactivated);
    return () => socket.off("group:deactivated", onDeactivated);
  }, [groupId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
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
          sendMessage(input.trim(), {
            url: data.url,
            type: data.mediaType,
            name: data.mediaName,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setUploading(false);
      }
      setMediaPreview(null);
    } else {
      sendMessage(input);
    }
    setInput("");
    sendTyping(false);
    clearTimeout(typingTimeout);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = file.type;
    let type = "image";
    if (mime.startsWith("video/")) type = "video";
    else if (mime === "application/pdf") type = "pdf";
    setMediaPreview({
      url: URL.createObjectURL(file),
      type,
      name: file.name,
      file,
    });
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimeout);
    const t = setTimeout(() => sendTyping(false), 2000);
    setTypingTimeout(t);
  };

  const startEdit = (msg) => {
    setEditingId(msg._id);
    setEditInput(msg.content);
  };
  const submitEdit = () => {
    if (!editInput.trim()) return;
    editMessage(editingId, editInput);
    setEditingId(null);
    setEditInput("");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditInput("");
  };
  const handleDelete = (messageId) => {
    if (confirm("Delete this message?")) deleteMessage(messageId);
  };

  if (loading) return <Loader />;
  if (!group)
    return (
      <div style={{ padding: 30 }}>
        Group not found or you are not a member.
      </div>
    );

  return (
    <div className="gc-page">
      {/* Header */}
      <div className="gc-header">
        <button className="gc-back" onClick={() => router.back()}>
          <ArrowLeft size={18} />
        </button>
        <div className="gc-header-info">
          <div className="gc-avatar">{getInitials(group.name)}</div>
          <div>
            <p className="gc-name">{group.name}</p>
            <p className="gc-meta">{group.members?.length} members</p>
          </div>
        </div>
        <button
          className="gc-members-btn"
          onClick={() => setShowMembers((v) => !v)}
        >
          <Users size={18} />
        </button>
      </div>

      <div className="gc-body">
        {/* Members sidebar */}
        {showMembers && (
          <div className="gc-members-panel">
            <p className="gc-members-title">Members</p>
            {group.members?.map((m) => (
              <div key={m.user._id} className="gc-member-row">
                <div className="gc-member-avatar">
                  {getInitials(m.user.name)}
                </div>
                <div>
                  <p className="gc-member-name">{m.user.name}</p>
                  <p className="gc-member-role">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="gc-messages">
          {messages.length === 0 && (
            <div className="gc-empty">No messages yet. Say hello!</div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId?._id === myId || msg.senderId === myId;
            const seenByOthers =
              (msg.readBy || []).filter((id) => String(id) !== String(myId))
                .length > 0;

            if (msg.isSystem) {
              return (
                <div key={msg._id} className="gc-system-msg">
                  {msg.content}
                </div>
              );
            }

            return (
              <div
                key={msg._id}
                className={`gc-msg-row ${isMe ? "me" : "other"}`}
              >
                {!isMe && (
                  <div className="gc-msg-avatar">
                    {getInitials(msg.senderId?.name)}
                  </div>
                )}

                <div className="gc-msg-bubble-wrap">
                  {!isMe && (
                    <p className="gc-msg-sender">{msg.senderId?.name}</p>
                  )}

                  {editingId === msg._id ? (
                    <div className="gc-edit-box">
                      <input
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submitEdit()}
                        autoFocus
                      />
                      <button onClick={submitEdit}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <div
                      className={`gc-bubble ${isMe ? "gc-bubble-me" : "gc-bubble-other"}`}
                    >
                      {msg.mediaUrl &&
                        (msg.mediaType === "image" ? (
                          <a
                            href={msg.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={msg.mediaUrl}
                              alt={msg.mediaName || "image"}
                              className="media-img"
                            />
                          </a>
                        ) : msg.mediaType === "video" ? (
                          <video
                            controls
                            className="media-video"
                            src={msg.mediaUrl}
                          />
                        ) : (
                          <button
                            onClick={() =>
                              downloadPdf(msg.mediaUrl, msg.mediaName)
                            }
                            className="media-pdf"
                          >
                            <FileText size={18} />
                            <span>{msg.mediaName || "Document"}</span>
                            <span className="media-pdf-dl">↓ Download</span>
                          </button>
                        ))}
                      {msg.content && <p>{msg.content}</p>}
                      {msg.edited && (
                        <span className="gc-edited">(edited)</span>
                      )}
                    </div>
                  )}

                  <div className="gc-msg-meta">
                    <span className="gc-msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      <span
                        className="gc-seen"
                        title={seenByOthers ? "Seen" : "Delivered"}
                      >
                        {seenByOthers ? (
                          <CheckCheck size={13} color="#3b82f6" />
                        ) : (
                          <Check size={13} color="#9ca3af" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {isMe && editingId !== msg._id && (
                  <div className="gc-msg-actions">
                    <button onClick={() => startEdit(msg)} title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(msg._id)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {typingUsers.length > 0 && (
            <div className="gc-typing">
              {typingUsers.length} member(s) typing...
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      {isDeactivated ? (
        <div className="gc-deactivated-bar">
          This session has been cancelled. This group is now closed.
        </div>
      ) : (
        <div className="gc-input-area">
          {mediaPreview && (
            <div className="media-preview-bar">
              {mediaPreview.type === "image" && (
                <img
                  src={mediaPreview.url}
                  alt="preview"
                  className="media-preview-thumb"
                />
              )}
              {mediaPreview.type === "video" && <span>🎥</span>}
              {mediaPreview.type === "pdf" && <FileText size={16} />}
              <span className="media-preview-name">{mediaPreview.name}</span>
              <button
                className="media-preview-remove"
                onClick={() => setMediaPreview(null)}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="gc-input-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
            <textarea
              className="gc-input"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="gc-send-btn"
              onClick={handleSend}
              disabled={uploading || (!input.trim() && !mediaPreview)}
            >
              {uploading ? (
                <span className="upload-spinner" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, Send, ArrowLeft, MessageSquare } from "lucide-react";
import "./messages.css";

const MOCK_CONTACTS = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Alumni - Software Engineer",
    lastMessage: "Sure, let's schedule a session!",
    time: "10:30 AM",
    unread: 2,
    messages: [
      { id: 1, from: "them", text: "Hi! I saw you registered for my React session.", time: "10:00 AM" },
      { id: 2, from: "me", text: "Yes! I'm really excited about it.", time: "10:15 AM" },
      { id: 3, from: "them", text: "Sure, let's schedule a session!", time: "10:30 AM" },
    ],
  },
  {
    id: 2,
    name: "Rahul Verma",
    role: "Alumni - Data Scientist",
    lastMessage: "Check out this resource I shared.",
    time: "Yesterday",
    unread: 0,
    messages: [
      { id: 1, from: "them", text: "Hey, how's your prep going?", time: "Yesterday 2:00 PM" },
      { id: 2, from: "me", text: "Going well, thanks for asking!", time: "Yesterday 2:10 PM" },
      { id: 3, from: "them", text: "Check out this resource I shared.", time: "Yesterday 2:15 PM" },
    ],
  },
  {
    id: 3,
    name: "Ananya Iyer",
    role: "Alumni - Product Manager",
    lastMessage: "Great question! Let me explain...",
    time: "Mon",
    unread: 0,
    messages: [
      { id: 1, from: "me", text: "Can you explain product roadmaps?", time: "Mon 11:00 AM" },
      { id: 2, from: "them", text: "Great question! Let me explain...", time: "Mon 11:05 AM" },
    ],
  },
];

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function MessagesPage() {
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageInput, setMessageInput] = useState("");

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Left panel — contacts list */}
        <div className={`contacts-panel ${selectedContact ? "hidden-mobile" : ""}`}>
          <div className="contacts-header">
            <h2>Messages</h2>
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Search conversations..." readOnly />
            </div>
          </div>

          <div className="contacts-list">
            {MOCK_CONTACTS.map((contact) => (
              <div
                key={contact.id}
                className={`contact-item ${selectedContact?.id === contact.id ? "active" : ""}`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="contact-avatar">{getInitials(contact.name)}</div>
                <div className="contact-info">
                  <p className="contact-name">{contact.name}</p>
                  <p className="contact-preview">{contact.lastMessage}</p>
                </div>
                <div className="contact-meta">
                  <span className="contact-time">{contact.time}</span>
                  {contact.unread > 0 && (
                    <span className="unread-dot">{contact.unread}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — thread */}
        <div className={`thread-panel ${!selectedContact ? "" : "visible-mobile"}`}>
          {!selectedContact ? (
            <div className="thread-empty">
              <MessageSquare size={48} />
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              <div className="thread-header">
                <button
                  className="back-btn"
                  onClick={() => setSelectedContact(null)}
                  aria-label="Back to contacts"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="thread-header-info">
                  <p className="thread-contact-name">{selectedContact.name}</p>
                  <p className="thread-contact-role">{selectedContact.role}</p>
                </div>
              </div>

              <div className="messages-list">
                {selectedContact.messages.map((msg) => (
                  <div key={msg.id} className={`message-bubble ${msg.from}`}>
                    <span className="message-text">{msg.text}</span>
                    <span className="message-time">{msg.time}</span>
                  </div>
                ))}
              </div>

              <div className="message-input-area">
                <input
                  className="message-input"
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button className="send-btn" aria-label="Send message">
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

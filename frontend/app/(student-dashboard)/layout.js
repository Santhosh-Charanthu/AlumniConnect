"use client";

import { useState } from "react";
import StudentSidebar from "../components/StudentSidebar";
import Navbar from "../components/Navbar";
import { NotificationProvider } from "../context/NotificationContext";
import { MessageProvider } from "../context/MessageContext";
import "../../styles/Sidebar.css";
import "../../styles/Navbar.css";
import "../../styles/Layout.css";

export default function StudentDashboardLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NotificationProvider role="student">
      <MessageProvider role="student">
      <div className="layout">
        <StudentSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="main">
          <Navbar setIsOpen={setIsOpen} />
          <div className="content">{children}</div>
        </div>
      </div>
      </MessageProvider>
    </NotificationProvider>
  );
}

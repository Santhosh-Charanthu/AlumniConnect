"use client";

import { useState } from "react";
import StudentSidebar from "../components/StudentSidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { NotificationProvider } from "../context/NotificationContext";
import { MessageProvider } from "../context/MessageContext";
import "../../src/styles/Sidebar.css";
import "../../src/styles/Navbar.css";
import "../../src/styles/Layout.css";

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
          <Footer />
        </div>
      </div>
      </MessageProvider>
    </NotificationProvider>
  );
}

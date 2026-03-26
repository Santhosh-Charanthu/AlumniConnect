"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { NotificationProvider } from "../context/NotificationContext";
import { MessageProvider } from "../context/MessageContext";
import "../../styles/Sidebar.css";
import "../../styles/Navbar.css";
import "../../styles/Layout.css";

export default function DashboardLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NotificationProvider role="alumni">
      <MessageProvider role="alumni">
      <div className="layout">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="main">
          <Navbar setIsOpen={setIsOpen} />
          <div className="content">{children}</div>
        </div>
      </div>
      </MessageProvider>
    </NotificationProvider>
  );
}

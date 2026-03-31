"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { NotificationProvider } from "../context/NotificationContext";
import { MessageProvider } from "../context/MessageContext";
import "../../src/styles/Sidebar.css";
import "../../src/styles/Navbar.css";
import "../../src/styles/Layout.css";

export default function DashboardLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const hideFooter = pathname === "/alumni/messages";
  const noPad =
    pathname === "/alumni/messages" || pathname.includes("/participants");

  return (
    <NotificationProvider role="alumni">
      <MessageProvider role="alumni">
        <div className="layout">
          <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
          <div className="main">
            <Navbar setIsOpen={setIsOpen} />
            <div className={`content${noPad ? " content--no-pad" : ""}`}>
              {children}
            </div>
            {!hideFooter && <Footer />}
          </div>
        </div>
      </MessageProvider>
    </NotificationProvider>
  );
}

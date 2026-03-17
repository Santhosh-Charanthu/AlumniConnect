"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../../styles/Sidebar.css";
import "../../styles/Navbar.css";
import "../../styles/Layout.css";

export default function DashboardLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Navbar setIsOpen={setIsOpen} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Sidebar from "../../app/components/Sidebar";
import Navbar from "../../app/components/Navbar";

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

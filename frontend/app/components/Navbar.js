"use client";

import { Menu } from "lucide-react";
import "../../src/styles/Navbar.css";

export default function Navbar({ setIsOpen }) {
  return (
    <div className="navbar">
      <Menu size={28} onClick={() => setIsOpen(true)} />
      <h3 className="navbar-brand">AlumniConnect</h3>
    </div>
  );
}
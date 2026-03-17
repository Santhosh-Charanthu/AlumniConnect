"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  Bell,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";
import "../../styles/Sidebar.css";

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/alumni/dashboard", icon: LayoutDashboard },
    {
      name: "Create Session",
      href: "/alumni/create-session",
      icon: CalendarPlus,
    },
    { name: "My Sessions", href: "/alumni/my-sessions", icon: CalendarCheck },
    { name: "Notifications", href: "/alumni/notifications", icon: Bell },
    { name: "Messaging", href: "/alumni/messages", icon: MessageSquare },
    { name: "Profile", href: "/alumni/profile", icon: User },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="overlay" onClick={() => setIsOpen(false)}></div>
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <h2 className="logo">AlumniConnect</h2>

        <nav>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={index}
                href={item.href}
                className={`menu-item ${isActive ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout at bottom */}
        <div className="logout">
          <button>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

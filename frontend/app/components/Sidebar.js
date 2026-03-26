"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  Bell,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useMessages } from "../context/MessageContext";
import "../../src/styles/Sidebar.css";

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount, refreshUnread } = useNotifications();
  const { unreadMessages } = useMessages();

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard",      href: "/alumni/dashboard",      icon: LayoutDashboard },
    { name: "Create Session", href: "/alumni/create-session", icon: CalendarPlus },
    { name: "My Sessions",    href: "/alumni/my-sessions",    icon: CalendarCheck },
    { name: "Notifications",  href: "/alumni/notifications",  icon: Bell, badge: unreadCount },
    { name: "Messaging",      href: "/alumni/messages",       icon: MessageSquare, badge: unreadMessages },
    { name: "Profile",        href: "/alumni/profile",        icon: User },
  ];

  return (
    <>
      {isOpen && (
        <div className="overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="logo-icon">A</div>
        <h2 className="logo">AlumniConnect</h2>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`menu-item ${isActive ? "active" : ""}`}
                data-tooltip={item.name}
              >
                <span className="menu-icon-wrap">
                  <Icon size={20} />
                  {item.badge > 0 && <span className="notif-badge-dot" />}
                </span>
                <span className="menu-label">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="logout">
          <button onClick={handleLogout}>
            <LogOut size={20} />
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

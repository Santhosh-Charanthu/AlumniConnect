"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  MonitorPlay,
  Compass,
  User,
  Bell,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useMessages } from "../context/MessageContext";
import "../../styles/Sidebar.css";

export default function StudentSidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { unreadMessages } = useMessages();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard",        href: "/student/dashboard",        icon: LayoutDashboard },
    { name: "My Sessions",      href: "/student/my-sessions",      icon: CalendarCheck },
    { name: "Explore Sessions", href: "/student/explore-sessions", icon: MonitorPlay },
    { name: "Explore Alumni",   href: "/student/explore-alumni",   icon: Compass },
    { name: "Profile",          href: "/student/profile",          icon: User },
    { name: "Notifications",    href: "/student/notifications",    icon: Bell, badge: unreadCount },
    { name: "Messaging",        href: "/student/messages",         icon: MessageSquare, badge: unreadMessages },
  ];

  return (
    <>
      {isOpen && (
        <div className="overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Collapsed: single letter icon */}
        <div className="logo-icon">A</div>
        {/* Expanded: full name */}
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

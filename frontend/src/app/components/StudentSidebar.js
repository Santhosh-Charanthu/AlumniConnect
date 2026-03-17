"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Compass,
  User,
  Bell,
  MessageSquare,
  LogOut,
} from "lucide-react";
import "../../styles/Sidebar.css";

export default function StudentSidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "My Sessions", href: "/student/my-sessions", icon: CalendarCheck },
    { name: "Explore Alumni", href: "/student/explore-alumni", icon: Compass },
    { name: "Profile", href: "/student/profile", icon: User },
    { name: "Notifications", href: "/student/notifications", icon: Bell },
    { name: "Messaging", href: "/student/messages", icon: MessageSquare },
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
          <button onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

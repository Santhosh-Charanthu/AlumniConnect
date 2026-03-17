"use client";

import { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";
import { BookOpen, CalendarCheck, CheckCircle, Calendar, Clock, User } from "lucide-react";
import "./dashboard.css";

export default function StudentDashboardPage() {
  const { showToast } = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/student/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setDashboardData(data);
        } else {
          showToast("error", data.message || "Failed to load dashboard");
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!dashboardData) {
    return <p>Failed to load dashboard.</p>;
  }

  const { user, stats, upcomingSessions } = dashboardData;

  return (
    <div className="student-dashboard">
      {/* Welcome */}
      <div className="welcome-section">
        <h1>Welcome, {user.name}!</h1>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <BookOpen size={28} />
          <h2>{stats.total}</h2>
          <p>Total Sessions</p>
        </div>
        <div className="stat-card green">
          <CalendarCheck size={28} />
          <h2>{stats.upcoming}</h2>
          <p>Upcoming</p>
        </div>
        <div className="stat-card orange">
          <CheckCircle size={28} />
          <h2>{stats.completed}</h2>
          <p>Completed</p>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="sessions-section">
        <h2>Upcoming Sessions</h2>

        {upcomingSessions.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming sessions. Browse available sessions to get started!</p>
          </div>
        ) : (
          <div className="sessions-list">
            {upcomingSessions.map((session, index) => (
              <div key={index} className="session-item">
                <div className="session-info">
                  <h3>{session.title}</h3>
                  <span className="alumni-name">
                    <User size={14} /> {session.alumniName}
                  </span>
                </div>
                <div className="session-time">
                  <span>
                    <Calendar size={14} /> {new Date(session.date).toLocaleDateString()}
                  </span>
                  <span>
                    <Clock size={14} /> {new Date(session.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <span className={`status-badge status-${session.status?.toLowerCase()}`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

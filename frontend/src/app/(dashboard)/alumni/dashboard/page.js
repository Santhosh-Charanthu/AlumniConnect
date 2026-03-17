"use client";

import { useState } from "react";
import { useToast } from "../../../context/ToastContext";
import { useRouter } from "next/navigation";
import "./dashboard.css";

export default function DashboardPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const { showToastAfterRedirect } = useToast();
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/alumni/my-sessions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setSessions(data.sessions);
        setUser(data.alumni);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🎯 Filter logic
  const now = new Date();

  const upcoming = sessions.filter((s) => new Date(s.startTime) > now);

  const previous = sessions.filter((s) => new Date(s.startTime) <= now);

  const displaySessions = activeTab === "upcoming" ? upcoming : previous;

  // 📊 Stats
  const totalSessions = sessions.length;
  const totalStudents = sessions.reduce(
    (sum, s) => sum + (s.currentSeats || 0),
    0,
  );
  const totalRevenue = sessions.reduce(
    (sum, s) => sum + (s.price || 0) * (s.currentSeats || 0),
    0,
  );

  return (
    <div className="dashboard">
      {/* Header */}
      <h1 className="title">Welcome Back, Aditya Singh! 👋</h1>
      <p className="subtitle">
        Manage your courses and check your teaching stats
      </p>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card blue">
          <h2>5</h2>
          <p>Total Classes</p>
        </div>

        <div className="stat-card peach">
          <h2>73</h2>
          <p>Students Taught</p>
        </div>

        <div className="stat-card teal">
          <h2>10</h2>
          <p>Hours of Teaching</p>
        </div>

        <div className="stat-card orange">
          <h2>₹12,500</h2>
          <p>Total Earnings</p>
        </div>
      </div>

      {/* Button */}
      <button className="create-btn">+ Create New Course</button>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "upcoming" ? "active" : ""}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming Classes
        </button>

        <button
          className={activeTab === "previous" ? "active" : ""}
          onClick={() => setActiveTab("previous")}
        >
          Previous Classes
        </button>
      </div>

      {/* Section Title */}
      <h2 className="section-title">Your Upcoming Webinars</h2>

      {/* Cards */}
      <div className="webinars">
        <div className="webinar-card">
          <h3>Web Development Fundamentals</h3>

          <div className="info">
            <div>
              <p>Date:</p>
              <span>June 8, 2025</span>
            </div>
            <div>
              <p>Time:</p>
              <span>10:00 AM - 12:00 PM</span>
            </div>
          </div>

          <div className="info">
            <div>
              <p>Enrollments:</p>
              <span className="orange-text">15 students</span>
            </div>
            <div>
              <p>Status:</p>
              <span className="green-text">Scheduled</span>
            </div>
          </div>

          <div className="card-actions">
            <button>Edit</button>
            <button className="primary">Start Webinar</button>
          </div>
        </div>

        <div className="webinar-card">
          <h3>Introduction to React</h3>

          <div className="info">
            <div>
              <p>Date:</p>
              <span>June 16, 2025</span>
            </div>
            <div>
              <p>Time:</p>
              <span>6:00 PM - 8:00 PM</span>
            </div>
          </div>

          <div className="info">
            <div>
              <p>Enrollments:</p>
              <span className="orange-text">8 students</span>
            </div>
            <div>
              <p>Status:</p>
              <span className="green-text">Scheduled</span>
            </div>
          </div>

          <div className="card-actions">
            <button>Edit</button>
            <button className="primary">Start Webinar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

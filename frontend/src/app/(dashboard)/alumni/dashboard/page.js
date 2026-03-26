"use client";

import { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";
import { useRouter } from "next/navigation";
import "./dashboard.css";
import Loader from "../../../components/Loader";

export default function DashboardPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const { showToastAfterRedirect } = useToast();
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [alumni, setAlumni] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log(token);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumni/my-sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log(data);
      if (data.success) {
        setSessions(data.sessions);
        setAlumni(data.alumni);
      } else {
        setLoadError(data.message || "Failed to load dashboard");
      }
    } catch (err) {
      console.error(err);
      setLoadError("Failed to connect to server");
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
  if (loadError) return <div style={{ padding: "2rem", color: "red" }}>{loadError}</div>;
  if (!alumni) return <Loader />;

  return (
    <div className="dashboard">
      {/* Header */}
      <h1 className="title">
        Welcome Back, {alumni?.userId?.name || "Alumni"}! 👋
      </h1>

      <p className="subtitle">
        {alumni?.jobTitle || "Mentor"} @ {alumni?.company || "Company"}
      </p>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card blue">
          <h2>{totalSessions}</h2>
          <p>Total Sessions</p>
        </div>

        <div className="stat-card peach">
          <h2>{totalStudents}</h2>
          <p>Students Taught</p>
        </div>

        <div className="stat-card teal">
          <h2>
            {sessions.reduce((sum, s) => sum + (s.duration || 0), 0)} mins
          </h2>
          <p>Hours of Teaching</p>
        </div>

        <div className="stat-card orange">
          <h2>₹{totalRevenue}</h2>
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
        {displaySessions.length === 0 ? (
          <p>No sessions found</p>
        ) : (
          displaySessions.map((session) => (
            <div key={session._id} className="webinar-card">
              <h3>{session.title}</h3>

              <div className="info">
                <div>
                  <p>Date:</p>
                  <span>
                    {new Date(session.startTime).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <p>Time:</p>
                  <span>
                    {new Date(session.startTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="info">
                <div>
                  <p>Enrollments:</p>
                  <span className="orange-text">
                    {session.currentSeats || 0} students
                  </span>
                </div>

                <div>
                  <p>Status:</p>
                  <span className="green-text">{session.status}</span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  onClick={() => router.push(`/edit-session/${session._id}`)}
                >
                  Edit
                </button>

                <button className="primary">
                  {activeTab === "upcoming" ? "Start Session" : "View"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

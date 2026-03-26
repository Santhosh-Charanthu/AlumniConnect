"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users, ChevronRight, CheckCircle } from "lucide-react";
import { authFetch } from "../../../../src/services/authFetch";
import "./explore-sessions.css";
import Loader from "../../../components/Loader";

export default function ExploreSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/upcoming-sessions`);
        const data = await res.json();
        if (data.success) setSessions(data.sessions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="es-page">
      <div className="es-header">
        <h1>Explore Sessions</h1>
        <p>Browse upcoming sessions from alumni mentors</p>
      </div>

      {sessions.length === 0 ? (
        <div className="es-empty">
          <Calendar size={48} />
          <p>No upcoming sessions</p>
          <span>Check back later for new sessions</span>
        </div>
      ) : (
        <div className="es-grid">
          {sessions.map((s) => (
            <SessionCard
              key={s._id}
              session={s}
              onClick={() => router.push(`/student/session/${s._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onClick }) {
  const seatsLeft = (session.maxSeats || 0) - (session.currentSeats || 0);
  return (
    <div className="es-card" onClick={onClick}>
      {session.coverImage?.url && (
        <img src={session.coverImage.url} alt={session.title} className="es-card-img" />
      )}
      <div className="es-card-body">
        <div className="es-card-top-row">
          {session.category && <span className="es-category">{session.category}</span>}
          {session.isRegistered && (
            <span className="es-registered-badge"><CheckCircle size={12} /> Registered</span>
          )}
        </div>
        <h3 className="es-card-title">{session.title}</h3>

        {session.alumni && (
          <div className="es-alumni-row">
            {session.alumni.profileImage?.url ? (
              <img src={session.alumni.profileImage.url} alt={session.alumni.name} className="es-alumni-avatar" />
            ) : (
              <div className="es-alumni-avatar-placeholder">{session.alumni.name?.charAt(0)}</div>
            )}
            <div>
              <span className="es-alumni-name">{session.alumni.name}</span>
              {session.alumni.jobTitle && <span className="es-alumni-job">{session.alumni.jobTitle}</span>}
            </div>
          </div>
        )}

        <div className="es-meta">
          <span><Calendar size={13} /> {new Date(session.startTime).toLocaleDateString()}</span>
          <span><Clock size={13} /> {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span><Users size={13} /> {seatsLeft} seats left</span>
          {session.deadline && (
            <span className="es-deadline"><Clock size={13} /> Deadline: {new Date(session.deadline).toLocaleDateString()}</span>
          )}
        </div>

        <div className="es-card-footer">
          <span className="es-price">{session.price === 0 ? "Free" : `₹${session.price}`}</span>
          <span className="es-view-btn">View Details <ChevronRight size={14} /></span>
        </div>
      </div>
    </div>
  );
}

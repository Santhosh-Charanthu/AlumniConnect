"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  Users,
  MessageSquare,
} from "lucide-react";
import "../../../../(dashboard)/alumni/profile/profile.css";
import "./alumni-profile.css";
import Loader from "../../../../components/Loader";

export default function StudentAlumniProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [alumni, setAlumni] = useState(null);
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const tabDropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        tabDropdownRef.current &&
        !tabDropdownRef.current.contains(e.target)
      ) {
        setShowTabDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumni/${id}`,
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setAlumni(data.alumni);
          setUser(data.user);
          setSessions(data.sessions || []);
          setReviews(data.reviews || []);
        } else if (res.status === 404) {
          setNotFound(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlumni();
  }, [id]);

  if (loading) return <Loader text="Loading profile..." />;
  if (notFound || !alumni)
    return (
      <div className="profile-not-found">
        <p>Alumni not found</p>
      </div>
    );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1,
      )
    : alumni.rating?.toFixed(1) || "0.0";

  const tabs = [
    "about",
    "experience",
    "projects",
    "achievements",
    "skills",
    "sessions",
    "reviews",
  ];

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        {/* Back button */}
        <button className="pub-back-btn" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back to Explore
        </button>

        {/* HERO — read-only, no edit icon */}
        <section className="profile-hero">
          <div className="hero-left">
            <div className="avatar-wrapper">
              {alumni.profileImage?.url ? (
                <img
                  src={alumni.profileImage.url}
                  alt={user?.name}
                  width={110}
                  height={110}
                  className="avatar-img"
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div className="avatar">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="hero-right">
            <h1>{user?.name}</h1>
            <h3>{alumni.jobTitle}</h3>
            <p className="meta">
              {alumni.company} • {user?.college} • Batch {alumni.batchYear}
            </p>
            <p className="bio">{alumni.bio}</p>
            <button
              className="alumni-profile-msg-btn"
              onClick={() =>
                router.push(
                  `/student/messages?dm=${alumni.userId?._id || alumni.userId}&name=${encodeURIComponent(user?.name || "")}`,
                )
              }
            >
              <MessageSquare size={15} /> Message
            </button>
          </div>
        </section>

        {/* TABS */}
        <nav className="profile-tabs" ref={tabDropdownRef}>
          <div className="tabs-desktop">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="tabs-mobile">
            <button
              className="tab-dropdown-trigger"
              onClick={() => setShowTabDropdown((p) => !p)}
            >
              <span>{activeTab}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: showTabDropdown
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showTabDropdown && (
              <div className="tab-dropdown-menu">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`tab-dropdown-item ${activeTab === tab ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab(tab);
                      setShowTabDropdown(false);
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* TAB CONTENT */}
        <section className="profile-content">
          {/* ABOUT */}
          {activeTab === "about" && (
            <div className="content-card">
              {alumni.about ? (
                <>
                  <h3>About</h3>
                  <p className="about-text">{alumni.about}</p>
                </>
              ) : (
                <div className="empty-state">
                  <h3>No about section yet</h3>
                  <p>This alumni hasn't added an about section.</p>
                </div>
              )}
            </div>
          )}

          {/* EXPERIENCE */}
          {activeTab === "experience" && (
            <>
              {!alumni.experiences || alumni.experiences.length === 0 ? (
                <div className="empty-state content-card">
                  <h3>No experience added yet</h3>
                  <p>This alumni hasn't added any experience.</p>
                </div>
              ) : (
                alumni.experiences.map((exp) => (
                  <div key={exp._id} className="content-card">
                    <div className="card-header">
                      <h3>{exp.role}</h3>
                      <span>
                        {new Date(exp.startDate).getFullYear()} –{" "}
                        {exp.endDate
                          ? new Date(exp.endDate).getFullYear()
                          : "Present"}
                      </span>
                    </div>
                    <h4>{exp.company}</h4>
                    <p>{exp.description}</p>
                  </div>
                ))
              )}
            </>
          )}

          {/* PROJECTS */}
          {activeTab === "projects" && (
            <>
              {!alumni.projects || alumni.projects.length === 0 ? (
                <div className="empty-state content-card">
                  <h3>No projects added yet</h3>
                  <p>This alumni hasn't added any projects.</p>
                </div>
              ) : (
                alumni.projects.map((proj) => (
                  <div key={proj._id} className="content-card">
                    <h3>{proj.title}</h3>
                    <p>{proj.description}</p>
                    <div className="skill-row">
                      {proj.techStack?.map((tech) => (
                        <span key={tech}>{tech}</span>
                      ))}
                    </div>
                    <div className="project-actions">
                      {proj.liveLink && (
                        <a
                          href={proj.liveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn demo"
                        >
                          🌐 Live Demo
                        </a>
                      )}
                      {proj.repoLink && (
                        <a
                          href={proj.repoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn github"
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ACHIEVEMENTS */}
          {activeTab === "achievements" && (
            <>
              {!alumni.achievements || alumni.achievements.length === 0 ? (
                <div className="empty-state content-card">
                  <h3>No achievements added yet</h3>
                  <p>This alumni hasn't added any achievements.</p>
                </div>
              ) : (
                alumni.achievements.map((ach) => (
                  <div key={ach._id} className="content-card">
                    <div className="card-header">
                      <h3>{ach.title}</h3>
                      <span>{ach.year}</span>
                    </div>
                    <p>{ach.description}</p>
                    {ach.certificateUrl && (
                      <a
                        href={ach.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="certificate-link"
                      >
                        View Certificate
                      </a>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* SKILLS */}
          {activeTab === "skills" && (
            <>
              {alumni.skills && alumni.skills.length > 0 ? (
                <div className="skills-grid">
                  {alumni.skills.map((skill, index) => (
                    <span
                      key={skill}
                      className={`skill-chip color-${index % 6}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="empty-state content-card">
                  <h3>No skills added yet</h3>
                </div>
              )}
            </>
          )}

          {/* SESSIONS */}
          {activeTab === "sessions" && (
            <div className="content-card">
              <h3 style={{ marginBottom: "16px" }}>Available Sessions</h3>
              {sessions.length === 0 ? (
                <div className="empty-state">
                  <p>No upcoming sessions available.</p>
                </div>
              ) : (
                <div className="pub-sessions-list">
                  {sessions.map((session, i) => (
                    <div key={i} className="pub-session-card">
                      <div className="pub-session-info">
                        <h4>{session.title}</h4>
                        <div className="pub-session-meta">
                          <span>
                            <Calendar size={13} />{" "}
                            {new Date(session.startTime).toLocaleDateString()}
                          </span>
                          <span>
                            <Clock size={13} />{" "}
                            {new Date(session.startTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="pub-session-right">
                        <span className="pub-session-price">
                          {session.price === 0 ? "Free" : `₹${session.price}`}
                        </span>
                        <button
                          className="btn primary"
                          style={{ fontSize: "13px", padding: "8px 16px" }}
                        >
                          Book Session
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === "reviews" && (
            <div className="content-card">
              <div className="pub-reviews-header">
                <h3>Reviews & Ratings</h3>
                <div className="pub-avg-rating">
                  <Star size={18} fill="#f59e0b" color="#f59e0b" />
                  <span>{avgRating}</span>
                  <span className="pub-review-count">
                    ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>
              {reviews.length === 0 ? (
                <div className="empty-state">
                  <p>No reviews yet.</p>
                </div>
              ) : (
                <div className="pub-reviews-list">
                  {reviews.map((review) => (
                    <div key={review._id} className="pub-review-card">
                      <div className="pub-review-top">
                        <span className="pub-reviewer-name">
                          {review.studentId?.name || "Student"}
                        </span>
                        <div className="pub-review-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= review.rating ? "#f59e0b" : "none"}
                              color={s <= review.rating ? "#f59e0b" : "#d1d5db"}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="pub-review-comment">{review.comment}</p>
                      )}
                      <span className="pub-review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import AboutModal from "../components/profile/AboutModal";
import ExperienceModal from "../components/profile/ExperienceModal";
import ProjectModal from "../components/profile/ProjectModal";
import AchievementModal from "../components/profile/AchievementModal";
import { useRouter } from "next/navigation";
import { useToast } from "../context/ToastContext";
import Image from "next/image";
import "./profile.css";

export default function AlumniProfile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("experience");
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const { showToast } = useToast();
  const { showToastAfterRedirect } = useToast();
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/alumni/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) {
          setProfile(data.alumni);
          console.log(data.user);
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const handleSaveAbout = async (text) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/alumni/about", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ about: text }),
      });

      const data = await res.json();

      if (!data.success) {
        showToast("error", data.message || "Failed to update About");
        return;
      }

      // ✅ Update UI instantly
      setProfile((prev) => ({
        ...prev,
        about: data.about,
      }));

      setShowAboutModal(false);
    } catch (err) {
      console.error("Failed to save about", err);
    }
  };

  const handleSaveExperience = async (formData) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/experience", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add experience");
        return;
      }

      // ✅ Optimistic UI update
      setProfile((prev) => ({
        ...prev,
        experiences: [...prev.experiences, data.experience],
      }));

      setShowExperienceModal(false);
    } catch (err) {
      console.error("Failed to create experience", err);
    }
  };

  const handleSaveProject = async (projectData) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add project");
        return;
      }

      // ✅ Optimistic UI update
      setProfile((prev) => ({
        ...prev,
        projects: [...prev.projects, data.project],
      }));

      setShowProjectModal(false);
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const handleSaveAchievement = async (achievementData) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/achievements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(achievementData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add achievement");
        return;
      }

      // ✅ Optimistic UI update
      setProfile((prev) => ({
        ...prev,
        achievements: [...prev.achievements, data.achievement],
      }));

      setShowAchievementModal(false);
    } catch (err) {
      console.error("Failed to create achievement", err);
    }
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        {/* HERO SECTION */}
        <section className="profile-hero">
          <div className="hero-left">
            <Image
              src={profile.profileImage.url}
              alt={`${profile.name} profile`}
              loading="eager"
              width={110}
              height={110}
              className="avatar-img"
            />
          </div>
          <button
            className="btn ghost"
            onClick={() => router.push("/alumni/edit-profile")}
          >
            Edit Profile
          </button>

          <div className="hero-right">
            <h1>{user.name}</h1>
            <h3>{profile.jobTitle}</h3>

            <p className="meta">
              {profile.company} • {user.college} • Batch {profile.batchYear}
            </p>

            <p className="bio">{profile.bio}</p>

            {/* <div className="actions">
              <button className="btn primary">Request Referral</button>
              <button className="btn secondary">Request Mentorship</button>
              <button className="btn ghost">Message</button>
              <a href={profile.linkedin} target="_blank" className="btn ghost">
                LinkedIn
              </a>
            </div> */}
          </div>
        </section>

        {/* TABS */}
        <nav className="profile-tabs">
          {["about", "experience", "projects", "achievements", "skills"].map(
            (tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            )
          )}
        </nav>

        {/* TAB CONTENT */}
        <section className="profile-content">
          {/* ABOUT */}
          {/* ABOUT */}
          {activeTab === "about" && (
            <div className="content-card">
              {profile.about ? (
                <>
                  <div className="about-header">
                    <h3>About</h3>
                    <button
                      className="btn ghost small"
                      onClick={() => {
                        setShowAboutModal(true);
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  <p className="about-text">{profile.about}</p>
                </>
              ) : (
                <div className="empty-state">
                  <h3>Add your About section</h3>
                  <p>
                    Share your journey, experience, and how you can help
                    students.
                  </p>
                  <button
                    className="btn primary"
                    onClick={() => setShowAboutModal(true)}
                  >
                    Add About
                  </button>
                </div>
              )}
            </div>
          )}

          <AboutModal
            isOpen={showAboutModal}
            onClose={() => setShowAboutModal(false)}
            onSave={handleSaveAbout}
            initialValue={profile.about || ""}
          />

          {/* EXPERIENCE */}
          {activeTab === "experience" && (
            <>
              {profile.experiences.length === 0 ? (
                <div className="empty-state">
                  <h3>Add your first experience</h3>
                  <p>
                    Your professional experience helps students trust and
                    connect with you.
                  </p>

                  <button
                    className="btn primary"
                    onClick={() => setShowExperienceModal(true)}
                  >
                    Add Experience
                  </button>
                </div>
              ) : (
                <>
                  {profile.experiences.map((exp) => (
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
                  ))}

                  {/* ✅ Bottom-center Add button */}
                  <div className="add-center">
                    <button
                      className="btn primary"
                      onClick={() => setShowExperienceModal(true)}
                    >
                      + Add Experience
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          <ExperienceModal
            isOpen={showExperienceModal}
            onClose={() => setShowExperienceModal(false)}
            onSave={handleSaveExperience}
          />

          {/* PROJECTS */}
          {activeTab === "projects" && (
            <>
              {profile.projects.length === 0 ? (
                <div className="empty-state">
                  <h3>Add your first project</h3>
                  <p>
                    Projects help students understand your practical experience.
                  </p>

                  <button
                    className="btn primary"
                    onClick={() => setShowProjectModal(true)}
                  >
                    Add Project
                  </button>
                </div>
              ) : (
                <>
                  {profile.projects.map((proj) => (
                    <div key={proj._id} className="content-card">
                      <h3>{proj.title}</h3>
                      <p>{proj.description}</p>

                      <div className="skill-row">
                        {proj.techStack.map((tech) => (
                          <span key={tech}>{tech}</span>
                        ))}
                      </div>

                      <div className="project-actions">
                        <a
                          href={proj.liveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn demo"
                        >
                          🌐 Live Demo
                        </a>

                        <a
                          href={proj.repoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn github"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.43 7.86 10.96.58.1.79-.25.79-.56v-2.02c-3.2.7-3.87-1.38-3.87-1.38-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.74 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.52-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.67.41.36.77 1.07.77 2.15v3.18c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.74 18.27.5 12 .5z" />
                          </svg>
                          GitHub
                        </a>
                      </div>
                    </div>
                  ))}

                  <div className="add-center">
                    <button
                      className="btn primary"
                      onClick={() => setShowProjectModal(true)}
                    >
                      + Add Project
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          <ProjectModal
            isOpen={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            onSave={handleSaveProject}
          />

          {/* ACHIEVEMENTS */}
          {activeTab === "achievements" && (
            <>
              {profile.achievements.length === 0 ? (
                <div className="empty-state">
                  <h3>Add your first achievement</h3>
                  <p>
                    Achievements help validate your accomplishments and build
                    trust.
                  </p>

                  <button
                    className="btn primary"
                    onClick={() => setShowAchievementModal(true)}
                  >
                    Add Achievement
                  </button>
                </div>
              ) : (
                <>
                  {profile.achievements.map((ach) => (
                    <div key={ach._id} className="content-card">
                      <div className="card-header">
                        <h3>{ach.title}</h3>
                        <span>{ach.year}</span>
                      </div>

                      <p>{ach.description}</p>

                      <a
                        href={ach.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="certificate-link"
                      >
                        View Certificate
                      </a>
                    </div>
                  ))}

                  <div className="add-center">
                    <button
                      className="btn primary"
                      onClick={() => setShowAchievementModal(true)}
                    >
                      + Add Achievement
                    </button>
                  </div>
                </>
              )}
            </>
          )}
          <AchievementModal
            isOpen={showAchievementModal}
            onClose={() => setShowAchievementModal(false)}
            onSave={handleSaveAchievement}
          />

          {activeTab === "skills" && (
            <>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="skills-grid">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={skill}
                      className={`skill-chip color-${index % 6}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3>No skills added yet</h3>
                  <p>Add your skills to showcase your expertise.</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

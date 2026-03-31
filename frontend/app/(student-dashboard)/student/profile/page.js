"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "../../../context/ToastContext";
import { Pencil, X, Plus, User, GraduationCap, BookOpen, Camera } from "lucide-react";
import "./profile.css";
import Loader from "../../../components/Loader";

export default function StudentProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "", department: "", batchYear: "", interests: [] });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [interestInput, setInterestInput] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditClick = () => {
    setForm({
      name: user?.name || "",
      department: profile?.department || "",
      batchYear: profile?.batchYear || "",
      interests: profile?.interests ? [...profile.interests] : [],
    });
    setImagePreview(null);
    setImageFile(null);
    setFormError("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormError("");
    setImagePreview(null);
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !form.interests.includes(trimmed)) {
      setForm((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }));
    }
    setInterestInput("");
  };

  const handleRemoveInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (form.batchYear && !/^\d{4}$/.test(form.batchYear)) {
      setFormError("Enter a valid 4-digit batch year.");
      return;
    }
    setFormError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("department", form.department);
      formData.append("batchYear", form.batchYear);
      formData.append("interests", JSON.stringify(form.interests));
      if (imageFile) {
        formData.append("profileImage", imageFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/student/profile`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setUser(data.user);
        setIsEditing(false);
        showToast("success", "Profile updated successfully");
      } else {
        showToast("error", data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to save profile", err);
      showToast("error", "Something went wrong");
    }
  };

  if (loading) return <Loader text="Loading profile..." />;
  if (!profile || !user) return <p>Failed to load profile.</p>;

  const avatarSrc = imagePreview || profile?.profileImage?.url || null;

  return (
    <div className="student-profile">
      <div className="profile-card">
        {!isEditing ? (
          <>
            {/* View Mode */}
            <div className="profile-hero">
              <div className="avatar-wrapper">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={40} color="#aaa" />
                  </div>
                )}
              </div>

              <div className="profile-info">
                <h2>{user.name}</h2>
                <p className="profile-role">
                  <GraduationCap size={15} /> Student
                </p>
                <p className="profile-meta">
                  {profile.department && <span>{profile.department}</span>}
                  {profile.department && profile.batchYear && <span> • </span>}
                  {profile.batchYear && <span>Batch {profile.batchYear}</span>}
                  {(profile.department || profile.batchYear) && user.college && <span> • </span>}
                  {user.college && <span>{user.college}</span>}
                </p>
              </div>
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div className="interests-section">
                <h4><BookOpen size={15} /> Interests</h4>
                <div className="interests-tags">
                  {profile.interests.map((interest) => (
                    <span key={interest} className="interest-tag">{interest}</span>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-edit-profile" onClick={handleEditClick}>
              <Pencil size={15} /> Edit Profile
            </button>
          </>
        ) : (
          <>
            {/* Edit Mode */}
            <div className="edit-form">
              {/* Image upload */}
              <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer" }}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={40} color="#aaa" />
                  </div>
                )}
                <div className="avatar-edit-overlay">
                  <Camera size={18} color="#fff" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />

              {/* Name */}
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>

              {/* Department */}
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Computer Science"
                />
              </div>

              {/* Batch Year */}
              <div className="form-group">
                <label>Batch Year</label>
                <input
                  type="number"
                  value={form.batchYear}
                  onChange={(e) => setForm((prev) => ({ ...prev, batchYear: e.target.value }))}
                  placeholder="e.g. 2025"
                />
              </div>

              {/* Interests */}
              <div className="form-group">
                <label>Interests</label>
                <div className="interests-tags" style={{ marginBottom: "8px" }}>
                  {form.interests.map((interest) => (
                    <span key={interest} className="interest-tag">
                      {interest}
                      <button
                        type="button"
                        className="interest-remove"
                        onClick={() => handleRemoveInterest(interest)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="interests-input-row">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="Add an interest"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInterest())}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddInterest}>
                    <Plus size={15} /> Add
                  </button>
                </div>
              </div>

              {formError && <p className="form-error">{formError}</p>}

              <div className="form-actions">
                <button className="btn-primary" onClick={handleSave}>Save</button>
                <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
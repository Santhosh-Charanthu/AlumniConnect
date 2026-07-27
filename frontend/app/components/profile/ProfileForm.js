"use client";
import styles from "../../register/register.module.css";
import { useEffect, useState } from "react";

export default function AlumniForm({
  mode = "register", // register | edit
  initialData = {},
  onSubmit,
}) {
  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: initialData.user?.name || "",
        email: initialData.user?.email || "",
        college: initialData.user?.college || "",
        department: initialData.department || "",
        batchYear: initialData.batchYear || "",
        company: initialData.company || "",
        jobTitle: initialData.jobTitle || "",
        bio: initialData.bio || "",
        hourlyRate: initialData.hourlyRate || "",
        availability: initialData.availability || "",
      });

      setSelectedSkills(initialData.skills || []);
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      // ❌ Don’t allow email change in edit
      if (mode === "edit" && key === "email") return;
      formData.append(key, form[key]);
    });

    formData.append("skills", JSON.stringify(selectedSkills));

    if (image) formData.append("profileImage", image);

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        {/* Full Name */}
        <div>
          <label className={styles.label}>Full Name</label>
          <input
            name="name"
            className={styles.input}
            value={form.name || ""}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email (disabled in edit) */}
        <div>
          <label className={styles.label}>College Email</label>
          <input
            name="email"
            className={styles.input}
            value={form.email || ""}
            disabled={mode === "edit"}
          />
        </div>

        {/* College */}
        <div>
          <label className={styles.label}>College</label>
          <input
            name="college"
            className={styles.input}
            value={form.college || ""}
            onChange={handleChange}
          />
        </div>

        {/* Branch */}
        <div>
          <label className={styles.label}>Branch</label>
          <input
            name="department"
            className={styles.input}
            value={form.department || ""}
            onChange={handleChange}
          />
        </div>

        {/* Batch */}
        <div>
          <label className={styles.label}>Batch Year</label>
          <input
            name="batchYear"
            className={styles.input}
            value={form.batchYear || ""}
            onChange={handleChange}
          />
        </div>

        {/* Company */}
        <div>
          <label className={styles.label}>Company</label>
          <input
            name="company"
            className={styles.input}
            value={form.company || ""}
            onChange={handleChange}
          />
        </div>

        {/* Job Title */}
        <div>
          <label className={styles.label}>Job Title</label>
          <input
            name="jobTitle"
            className={styles.input}
            value={form.jobTitle || ""}
            onChange={handleChange}
          />
        </div>

        {/* Bio */}
        <div className={styles.fullWidth}>
          <label className={styles.label}>Bio</label>
          <textarea
            name="bio"
            className={styles.input}
            rows={3}
            value={form.bio || ""}
            onChange={handleChange}
          />
        </div>

        {/* Skills UI reused here */}
        {/* (Use same pills + dropdown logic you already have) */}

        {/* Profile Image */}
        <div className={styles.fullWidth}>
          <label className={styles.label}>Profile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>
      </div>

      <button type="submit" className={styles.submitBtn}>
        {mode === "edit" ? "Update Profile" : "Register"}
      </button>
    </form>
  );
}

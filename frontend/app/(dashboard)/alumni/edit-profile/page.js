"use client";
import styles from "../../../register/register.module.css";
import { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // 🔥 SAME STATES AS REGISTER
  const [role, setRole] = useState("alumni"); // fixed for edit
  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});

  const [branchOpen, setBranchOpen] = useState(false);
  const [branch, setBranch] = useState("");

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  const [selectedInterests, setSelectedInterests] = useState([]);
  const [existingImage, setExistingImage] = useState(null);

  const branches = ["CSE", "AIML", "IT", "AIDS", "ECE", "CIVIL", "EEE", "MECH"];

  // Predefined skills (same as register)
  const predefinedSkills = [
    "Java",
    "Python",
    "C",
    "C++",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "MongoDB",
    "System Design",
    "DSA",
    "Machine Learning",
    "Data Science",
    "Cloud Computing",
    "DevOps",
    "Cyber Security",
  ];

  const filteredSkills = predefinedSkills.filter(
    (skill) =>
      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !selectedSkills.includes(skill),
  );

  const addSkill = (skill) => {
    setSelectedSkills([...selectedSkills, skill]);
    setSkillInput("");
    setShowSkillDropdown(false);
  };

  const removeSkill = (skillToRemove) => {
    setSelectedSkills(
      selectedSkills.filter((skill) => skill !== skillToRemove),
    );
  };

  // 🔥 PREFILL DATA
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumni/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        const alumni = data.alumni;
        const user = data.user;

        setForm({
          name: user.name,
          email: user.email,
          college: user.college,
          department: alumni.department,
          batchYear: alumni.batchYear,
          company: alumni.company,
          jobTitle: alumni.jobTitle,
          bio: alumni.bio,
          hourlyRate: alumni.hourlyRate,
          availability: alumni.availability,
        });

        setBranch(alumni.department);
        setSelectedSkills(alumni.skills || []);
        setSelectedInterests(alumni.interests || []);
        setExistingImage(alumni.profileImage?.url || null);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // 🔥 EDIT SUBMIT (PATCH)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = {};
    if (!form.name?.trim()) errs.name = "Full name is required.";
    if (!form.college?.trim()) errs.college = "College name is required.";
    if (!branch) errs.department = "Please select your branch.";
    if (!form.batchYear?.toString().trim()) errs.batchYear = "Batch year is required.";
    else if (!/^\d{4}$/.test(form.batchYear)) errs.batchYear = "Enter a valid 4-digit year.";
    if (!form.company?.trim()) errs.company = "Company is required.";
    if (form.hourlyRate !== "" && form.hourlyRate !== undefined && Number(form.hourlyRate) < 0) errs.hourlyRate = "Hourly rate cannot be negative.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      // ❌ do not update email
      if (key === "email") return;
      formData.append(key, form[key]);
    });

    if (image) formData.append("profileImage", image);
    formData.append("skills", JSON.stringify(selectedSkills));
    formData.append("interests", JSON.stringify(selectedInterests));

    const token = localStorage.getItem("token");

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumni/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      showToast("success", "Profile updated successfully");
      router.push("/alumni/profile");
    } else {
      showToast("error", data.message || "Update failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>Edit Profile</h1>
            <p>Update your alumni profile details</p>
          </div>

          {/* SAME FORM JSX AS REGISTER (ONLY ADD value props) */}

          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>Full Name</label>
              <input
                name="name"
                className={styles.input}
                value={form.name || ""}
                onChange={handleChange}
              />
              {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
            </div>

            <div>
              <label className={styles.label}>College Email</label>
              <input
                name="email"
                className={styles.input}
                value={form.email || ""}
                disabled
              />
            </div>

            <div>
              <label className={styles.label}>College Name</label>
              <input
                name="college"
                className={styles.input}
                value={form.college || ""}
                onChange={handleChange}
              />
              {errors.college && <p className={styles.fieldError}>{errors.college}</p>}
            </div>

            {/* Branch */}
            <div>
              <label className={styles.label}>Branch</label>
              <div className={styles.dropdown}>
                <div
                  className={styles.dropdownControl}
                  onClick={() => setBranchOpen(!branchOpen)}
                >
                  {branch || "Select your branch"}
                </div>

                {branchOpen && (
                  <div className={styles.dropdownMenu}>
                    {branches.map((b) => (
                      <div
                        key={b}
                        className={styles.dropdownItem}
                        onClick={() => {
                          setBranch(b);
                          setForm({ ...form, department: b });
                          setBranchOpen(false);
                          setErrors((prev) => ({ ...prev, department: "" }));
                        }}
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.department && <p className={styles.fieldError}>{errors.department}</p>}
            </div>

            <div>
              <label className={styles.label}>Batch Year</label>
              <input
                name="batchYear"
                className={styles.input}
                value={form.batchYear || ""}
                onChange={handleChange}
              />
              {errors.batchYear && <p className={styles.fieldError}>{errors.batchYear}</p>}
            </div>

            <div>
              <label className={styles.label}>Company</label>
              <input
                name="company"
                className={styles.input}
                value={form.company || ""}
                onChange={handleChange}
                required
              />
              {errors.company && <p className={styles.fieldError}>{errors.company}</p>}
            </div>

            <div>
              <label className={styles.label}>Job Title</label>
              <input
                name="jobTitle"
                className={styles.input}
                value={form.jobTitle || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fullWidth}>
              <label className={styles.label}>Skills</label>

              {/* Selected Skill Pills */}
              {selectedSkills.length > 0 && (
                <div className={styles.skillPills}>
                  {selectedSkills.map((skill) => (
                    <span key={skill} className={styles.skillPill}>
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className={styles.removeSkill}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search Input */}
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Search skills (React, DSA, ML...)"
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);
                    setShowSkillDropdown(true);
                  }}
                  onFocus={() => setShowSkillDropdown(true)}
                />

                {/* Dropdown */}
                {showSkillDropdown && filteredSkills.length > 0 && (
                  <div className={styles.skillDropdown}>
                    {filteredSkills.map((skill) => (
                      <div
                        key={skill}
                        className={styles.skillOption}
                        onClick={() => addSkill(skill)}
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.fullWidth}>
              <label className={styles.label}>Bio</label>
              <textarea
                name="bio"
                rows="3"
                className={styles.input}
                value={form.bio || ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={styles.label}>Hourly Rate (₹)</label>
              <input
                type="number"
                name="hourlyRate"
                className={styles.input}
                value={form.hourlyRate || ""}
                onChange={handleChange}
              />
              {errors.hourlyRate && <p className={styles.fieldError}>{errors.hourlyRate}</p>}
            </div>

            <div>
              <label className={styles.label}>Availability</label>
              <input
                name="availability"
                className={styles.input}
                placeholder="Weekends / Evenings"
                value={form.availability || ""}
                onChange={handleChange}
              />
            </div>

            {/* Profile Image */}
            <div className={styles.fileWrapper}>
              <label className={styles.label}>Profile Image</label>

              {/* 🔥 Show existing image */}
              {existingImage && !image && (
                <div style={{ marginBottom: "10px", textAlign: "center" }}>
                  <img
                    src={existingImage}
                    alt="Current profile"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #e2e8f0",
                    }}
                  />
                </div>
              )}

              <input
                type="file"
                id="profileImage"
                className={styles.fileInput}
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
              />

              <label
                htmlFor="profileImage"
                className={`${styles.fileLabel} ${
                  image ? styles.fileSelected : ""
                }`}
              >
                {image
                  ? image.name
                  : existingImage
                    ? "Click to change profile image"
                    : "Click to upload profile image"}
              </label>

              <span className={styles.fileHint}>
                JPG / JPEG / PNG • Max size 2MB
              </span>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Update Profile
          </button>
        </div>
      </div>
    </form>
  );
}

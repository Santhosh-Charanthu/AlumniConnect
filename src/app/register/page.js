"use client";
import styles from "./register.module.css";
import { useState } from "react";
import { registerUser } from "@/services/api";
import { useToast } from "../context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { showToastAfterRedirect } = useToast();

  const [role, setRole] = useState("student");
  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);

  const [branchOpen, setBranchOpen] = useState(false);
  const [branch, setBranch] = useState("");
  // Skills (Alumni only)
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Predefined skills (same idea as your old project)
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
      !selectedSkills.includes(skill)
  );

  const addSkill = (skill) => {
    setSelectedSkills([...selectedSkills, skill]);
    setSkillInput("");
    setShowSkillDropdown(false);
  };

  const removeSkill = (skillToRemove) => {
    setSelectedSkills(
      selectedSkills.filter((skill) => skill !== skillToRemove)
    );
  };

  // Student Interests
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interestInput, setInterestInput] = useState("");
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);

  const predefinedInterests = [
    "Web Development",
    "App Development",
    "Machine Learning",
    "Artificial Intelligence",
    "Data Science",
    "Competitive Programming",
    "DSA",
    "Open Source",
    "Hackathons",
    "Startups",
    "Cyber Security",
    "Cloud Computing",
    "UI/UX Design",
    "Robotics",
  ];

  const filteredInterests = predefinedInterests.filter(
    (interest) =>
      interest.toLowerCase().includes(interestInput.toLowerCase()) &&
      !selectedInterests.includes(interest)
  );

  const addInterest = (interest) => {
    setSelectedInterests([...selectedInterests, interest]);
    setInterestInput("");
    setShowInterestDropdown(false);
  };

  const removeInterest = (interestToRemove) => {
    setSelectedInterests(
      selectedInterests.filter((i) => i !== interestToRemove)
    );
  };

  const branches = ["CSE", "AIML", "IT", "AIDS", "ECE", "CIVIL", "EEE", "MECH"];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // Append normal fields
    Object.keys(form).forEach((key) => {
      // ❌ Skip skills & interests (handled separately)
      if (key === "skills" || key === "interests") return;
      formData.append(key, form[key]);
    });

    // Append role & image
    formData.append("role", role);
    formData.append("profileImage", image);

    // ✅ Append arrays ONLY ONCE
    formData.append("skills", JSON.stringify(selectedSkills));
    formData.append("interests", JSON.stringify(selectedInterests));

    try {
      const res = await registerUser(formData);

      // ❌ registration failed
      if (!res.success) {
        showToast("error", res.message);
        return;
      }

      // ✅ success
      localStorage.setItem("token", res.token);
      showToastAfterRedirect("success", res.message);

      router.push(`/${res.user.role}/dashboard`);
    } catch (err) {
      showToast("error", err?.message || "Registration failed. Try again!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <h1>Create an Account</h1>
            <p>Join AlumniConnect and start your learning journey</p>
          </div>

          {/* Role Tabs */}
          <div className={styles.roleTabs}>
            <button
              type="button"
              className={`${styles.roleTab} ${
                role === "student" ? styles.activeRole : ""
              }`}
              onClick={() => setRole("student")}
            >
              As Student
            </button>

            <button
              type="button"
              className={`${styles.roleTab} ${
                role === "alumni" ? styles.activeRole : ""
              }`}
              onClick={() => setRole("alumni")}
            >
              As Alumni
            </button>
          </div>

          {/* Form Grid */}
          <div className={styles.formGrid}>
            {/* Common fields */}
            <div>
              <label className={styles.label}>Full Name</label>
              <input
                name="name"
                className={styles.input}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className={styles.label}>College Email</label>
              <input
                name="email"
                className={styles.input}
                placeholder="yourname@college.edu"
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className={styles.label}>College Name</label>
              <input
                name="college"
                className={styles.input}
                placeholder="e.g. IIT Hyderabad"
                onChange={handleChange}
                required
              />
            </div>

            {/* Branch Dropdown */}
            <div>
              <label className={styles.label}>Branch</label>
              <div className={styles.dropdown}>
                <div
                  className={`${styles.dropdownControl} ${
                    branchOpen ? styles.dropdownControlActive : ""
                  }`}
                  onClick={() => setBranchOpen(!branchOpen)}
                >
                  <span className={branch ? "" : styles.dropdownPlaceholder}>
                    {branch || "Select your branch..."}
                  </span>
                  <span
                    className={`${styles.dropdownArrow} ${
                      branchOpen ? styles.arrowOpen : ""
                    }`}
                  >
                    ▾
                  </span>
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
                        }}
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={styles.label}>Batch Year</label>
              <input
                name="batchYear"
                className={styles.input}
                onChange={handleChange}
                required
              />
            </div>

            {role === "student" && (
              <div className={styles.fullWidth}>
                <label className={styles.label}>Interests</label>

                {/* Selected Interest Pills */}
                {selectedInterests.length > 0 && (
                  <div className={styles.skillPills}>
                    {selectedInterests.map((interest) => (
                      <span key={interest} className={styles.skillPill}>
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
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
                    placeholder="Search interests (AI, Web, Startups...)"
                    value={interestInput}
                    onChange={(e) => {
                      setInterestInput(e.target.value);
                      setShowInterestDropdown(true);
                    }}
                    onFocus={() => setShowInterestDropdown(true)}
                  />

                  {/* Dropdown */}
                  {showInterestDropdown && filteredInterests.length > 0 && (
                    <div className={styles.skillDropdown}>
                      {filteredInterests.map((interest) => (
                        <div
                          key={interest}
                          className={styles.skillOption}
                          onClick={() => addInterest(interest)}
                        >
                          {interest}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                className={styles.input}
                onChange={handleChange}
                required
              />
            </div>

            {/* Alumni-only fields */}
            {role === "alumni" && (
              <>
                <div>
                  <label className={styles.label}>Company</label>
                  <input
                    name="company"
                    className={styles.input}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className={styles.label}>Job Title</label>
                  <input
                    name="jobTitle"
                    className={styles.input}
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
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className={styles.label}>Hourly Rate (₹)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    className={styles.input}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className={styles.label}>Availability</label>
                  <input
                    name="availability"
                    className={styles.input}
                    placeholder="Weekends / Evenings"
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* Profile Image */}
            <div className={styles.fileWrapper}>
              <label className={styles.label}>Profile Image</label>

              <input
                type="file"
                id="profileImage"
                className={styles.fileInput}
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                required
              />

              <label
                htmlFor="profileImage"
                className={`${styles.fileLabel} ${
                  image ? styles.fileSelected : ""
                }`}
              >
                {image ? image.name : "Click to upload profile image"}
              </label>

              <span className={styles.fileHint}>
                JPG / JPEG / PNG • Max size 2MB
              </span>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Register as {role === "student" ? "Student" : "Alumni"}
          </button>

          <div className={styles.footer}>
            Already have an account?{" "}
            <Link href="/login">
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}

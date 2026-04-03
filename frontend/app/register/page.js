"use client";
import styles from "./register.module.css";
import { useState, useRef, useEffect } from "react";
import { registerUser, sendOtp, verifyOtp } from "@/services/api";
import { useToast } from "../context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function RegisterPage() {
  const router = useRouter();
  const { showToast, showToastAfterRedirect } = useToast();

  const [role, setRole] = useState("student");
  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // Branch dropdown
  const [branchOpen, setBranchOpen] = useState(false);
  const [branch, setBranch] = useState("");

  // Skills (Alumni only)
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Interests (Student only)
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interestInput, setInterestInput] = useState("");
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);

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

  const filteredSkills = predefinedSkills.filter(
    (s) =>
      s.toLowerCase().includes(skillInput.toLowerCase()) &&
      !selectedSkills.includes(s),
  );
  const filteredInterests = predefinedInterests.filter(
    (i) =>
      i.toLowerCase().includes(interestInput.toLowerCase()) &&
      !selectedInterests.includes(i),
  );

  const branches = ["CSE", "AIML", "IT", "AIDS", "ECE", "CIVIL", "EEE", "MECH"];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // ── OTP timer ──────────────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const email = form.email?.trim();
    if (!email) {
      showToast("error", "Please enter your email first");
      return;
    }

    const emailParts = email.split("@");
    if (
      emailParts.length !== 2 ||
      !emailParts[1].toLowerCase().includes(".edu")
    ) {
      showToast("error", "Please use your college email with a .edu domain");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendOtp(email);
      if (!res.success) {
        showToast("error", res.message);
        return;
      }
      setShowOtpModal(true);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setOtpVerified(false);
      startResendTimer();
      showToast("success", "OTP sent to your email");
    } catch {
      showToast("error", "Failed to send OTP. Try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── OTP input handling ─────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value.slice(-1);
    setOtpDigits(updated);
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setOtpDigits(pasted.split(""));
      otpRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length < OTP_LENGTH) {
      showToast("error", "Please enter the complete 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await verifyOtp(form.email, otp);
      if (!res.success) {
        showToast("error", res.message);
        return;
      }
      setOtpVerified(true);
      setShowOtpModal(false);
      showToast("success", "Email verified successfully ✅");
    } catch {
      showToast("error", "Verification failed. Try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Final registration submit ──────────────────────────────────────────────
  const validateForm = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Full name is required.";
    if (!form.email?.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!branch) errs.department = "Please select your branch.";
    if (!form.batchYear?.trim()) errs.batchYear = "Batch year is required.";
    else if (!/^\d{4}$/.test(form.batchYear))
      errs.batchYear = "Enter a valid 4-digit year.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    if (!image) errs.profileImage = "Profile image is required.";
    if (role === "alumni" && !form.company?.trim())
      errs.company = "Company is required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpVerified) {
      showToast("error", "Please verify your email with OTP first");
      return;
    }

    const errs = validateForm();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      if (key === "skills" || key === "interests") return;
      formData.append(key, form[key]);
    });
    formData.append("role", role);
    formData.append("profileImage", image);
    formData.append("skills", JSON.stringify(selectedSkills));
    formData.append("interests", JSON.stringify(selectedInterests));

    setSubmitting(true);
    try {
      const res = await registerUser(formData);
      if (!res.success) {
        showToast("error", res.message);
        return;
      }
      localStorage.setItem("token", res.token);
      showToastAfterRedirect("success", res.message);
      router.push(`/${res.user.role}/dashboard`);
    } catch (err) {
      showToast("error", err?.message || "Registration failed. Try again!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── OTP Modal ── */}
      {showOtpModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button
              className={styles.modalClose}
              onClick={() => setShowOtpModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className={styles.modalTitle}>Verify your email</h2>
            <p className={styles.modalSubtitle}>
              We sent a 6-digit code to <strong>{form.email}</strong>
            </p>

            <div className={styles.otpRow} onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  className={styles.otpBox}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            <button
              className={styles.submitBtn}
              onClick={handleVerifyOtp}
              disabled={otpLoading}
            >
              {otpLoading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className={styles.resendRow}>
              {resendTimer > 0 ? (
                <span className={styles.resendTimer}>
                  Resend OTP in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.resendBtn}
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Registration Form ── */}
      <form onSubmit={handleSubmit}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.header}>
              <h1>Create an Account</h1>
              <p>Join AlumniConnect and start your learning journey</p>
            </div>

            <div className={styles.roleTabs}>
              <button
                type="button"
                className={`${styles.roleTab} ${role === "student" ? styles.activeRole : ""}`}
                onClick={() => setRole("student")}
              >
                As Student
              </button>
              <button
                type="button"
                className={`${styles.roleTab} ${role === "alumni" ? styles.activeRole : ""}`}
                onClick={() => setRole("alumni")}
              >
                As Alumni
              </button>
            </div>

            <div className={styles.formGrid}>
              {/* Full Name */}
              <div>
                <label className={styles.label}>Full Name</label>
                <input
                  name="name"
                  className={styles.input}
                  onChange={handleChange}
                />
                {errors.name && (
                  <p className={styles.fieldError}>{errors.name}</p>
                )}
              </div>

              {/* Email + OTP trigger */}
              <div>
                <label className={styles.label}>College Email</label>
                <div className={styles.emailRow}>
                  <input
                    name="email"
                    className={styles.input}
                    placeholder="yourname@college.edu"
                    onChange={handleChange}
                    disabled={otpVerified}
                  />
                  {otpVerified ? (
                    <span className={styles.verifiedBadge}>✓ Verified</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.sendOtpBtn}
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                    >
                      {sendingOtp ? "Sending..." : "Send OTP"}
                    </button>
                  )}
                </div>
                {errors.email && (
                  <p className={styles.fieldError}>{errors.email}</p>
                )}
              </div>

              {/* College */}
              <div>
                <label className={styles.label}>College Name</label>
                <input
                  name="college"
                  className={styles.input}
                  placeholder="e.g. IIT Hyderabad"
                  onChange={handleChange}
                />
              </div>

              {/* Branch */}
              <div>
                <label className={styles.label}>Branch</label>
                <div className={styles.dropdown}>
                  <div
                    className={`${styles.dropdownControl} ${branchOpen ? styles.dropdownControlActive : ""}`}
                    onClick={() => setBranchOpen(!branchOpen)}
                  >
                    <span className={branch ? "" : styles.dropdownPlaceholder}>
                      {branch || "Select your branch..."}
                    </span>
                    <span
                      className={`${styles.dropdownArrow} ${branchOpen ? styles.arrowOpen : ""}`}
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
                            setErrors((prev) => ({ ...prev, department: "" }));
                          }}
                        >
                          {b}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.department && (
                  <p className={styles.fieldError}>{errors.department}</p>
                )}
              </div>

              {/* Batch Year */}
              <div>
                <label className={styles.label}>Batch Year</label>
                <input
                  name="batchYear"
                  className={styles.input}
                  onChange={handleChange}
                />
                {errors.batchYear && (
                  <p className={styles.fieldError}>{errors.batchYear}</p>
                )}
              </div>

              {/* Student Interests */}
              {role === "student" && (
                <div className={styles.fullWidth}>
                  <label className={styles.label}>Interests</label>
                  {selectedInterests.length > 0 && (
                    <div className={styles.skillPills}>
                      {selectedInterests.map((i) => (
                        <span key={i} className={styles.skillPill}>
                          {i}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedInterests(
                                selectedInterests.filter((x) => x !== i),
                              )
                            }
                            className={styles.removeSkill}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={styles.searchWrapper}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Search interests..."
                      value={interestInput}
                      onChange={(e) => {
                        setInterestInput(e.target.value);
                        setShowInterestDropdown(true);
                      }}
                      onFocus={() => setShowInterestDropdown(true)}
                    />
                    {showInterestDropdown && filteredInterests.length > 0 && (
                      <div className={styles.skillDropdown}>
                        {filteredInterests.map((i) => (
                          <div
                            key={i}
                            className={styles.skillOption}
                            onClick={() => {
                              setSelectedInterests([...selectedInterests, i]);
                              setInterestInput("");
                              setShowInterestDropdown(false);
                            }}
                          >
                            {i}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  name="password"
                  className={styles.input}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className={styles.fieldError}>{errors.password}</p>
                )}
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
                    />
                    {errors.company && (
                      <p className={styles.fieldError}>{errors.company}</p>
                    )}
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
                    {selectedSkills.length > 0 && (
                      <div className={styles.skillPills}>
                        {selectedSkills.map((s) => (
                          <span key={s} className={styles.skillPill}>
                            {s}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedSkills(
                                  selectedSkills.filter((x) => x !== s),
                                )
                              }
                              className={styles.removeSkill}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={styles.searchWrapper}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Search skills..."
                        value={skillInput}
                        onChange={(e) => {
                          setSkillInput(e.target.value);
                          setShowSkillDropdown(true);
                        }}
                        onFocus={() => setShowSkillDropdown(true)}
                      />
                      {showSkillDropdown && filteredSkills.length > 0 && (
                        <div className={styles.skillDropdown}>
                          {filteredSkills.map((s) => (
                            <div
                              key={s}
                              className={styles.skillOption}
                              onClick={() => {
                                setSelectedSkills([...selectedSkills, s]);
                                setSkillInput("");
                                setShowSkillDropdown(false);
                              }}
                            >
                              {s}
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
                  onChange={(e) => {
                    setImage(e.target.files[0]);
                    setErrors((prev) => ({ ...prev, profileImage: "" }));
                  }}
                />
                <label
                  htmlFor="profileImage"
                  className={`${styles.fileLabel} ${image ? styles.fileSelected : ""}`}
                >
                  {image ? image.name : "Click to upload profile image"}
                </label>
                <span className={styles.fileHint}>
                  JPG / JPEG / PNG • Max size 2MB
                </span>
                {errors.profileImage && (
                  <p className={styles.fieldError}>{errors.profileImage}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className={styles.btnSpinner} /> Registering...
                </>
              ) : (
                `Register as ${role === "student" ? "Student" : "Alumni"}`
              )}
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
    </>
  );
}

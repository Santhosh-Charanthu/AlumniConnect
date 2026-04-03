"use client";

import styles from "../register/register.module.css"; // ?? reuse same CSS
import demoStyles from "./demo.module.css";
import { useState } from "react";
import { loginUser } from "../../src/services/api";
import { useRouter } from "next/navigation";
import { useToast } from "../context/ToastContext";
import Link from "next/link";

const DEMO_CREDENTIALS = {
  student: { email: "santhosh@college.edu", password: "password123" },
  alumni: { email: "venkat@college.edu", password: "password123" },
};

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { showToastAfterRedirect } = useToast();

  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ email: "", password: "" });

  const fillDemo = () => {
    setForm(DEMO_CREDENTIALS[role]);
    setErrors({});
  };
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Password is required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ ...form, role });

      if (!res.token || !res.user) {
        showToast("error", res.message || "Invalid credentials");
        return;
      }

      localStorage.setItem("token", res.token);
      showToastAfterRedirect("success", res.message || "Login successful");
      router.push(`/${res.user.role}/dashboard`);
    } catch (err) {
      showToast("error", err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <h1>Welcome Back</h1>
            <p>Login to continue your AlumniConnect journey</p>
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

          {/* Demo Credentials Banner */}
          <div className={demoStyles.demoBanner}>
            <div className={demoStyles.demoLeft}>
              <span className={demoStyles.demoLabel}>
                Demo {role === "student" ? "Student" : "Alumni"}
              </span>
              <span className={demoStyles.demoEmail}>
                {DEMO_CREDENTIALS[role].email}
              </span>
              <span className={demoStyles.demoDot}>·</span>
              <span className={demoStyles.demoPass}>password123</span>
            </div>
            <button
              type="button"
              className={demoStyles.demoBtn}
              onClick={fillDemo}
            >
              Use
            </button>
          </div>

          {/* Form Fields */}
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <label className={styles.label}>College Email</label>
              <input
                name="email"
                type="email"
                className={styles.input}
                placeholder="yourname@college.edu"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className={styles.fieldError}>{errors.email}</p>
              )}
            </div>

            <div className={styles.fullWidth}>
              <label className={styles.label}>Password</label>
              <input
                name="password"
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className={styles.fieldError}>{errors.password}</p>
              )}
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <span className={styles.btnSpinner} /> Logging in...
              </>
            ) : (
              `Login as ${role === "student" ? "Student" : "Alumni"}`
            )}
          </button>

          <div className={styles.footer}>
            Don&apos;t have an account?{" "}
            <Link href="/register">
              <span>Register</span>
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}

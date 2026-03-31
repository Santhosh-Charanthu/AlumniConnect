"use client";

import styles from "../register/register.module.css"; // ?? reuse same CSS
import { useState } from "react";
import { loginUser } from "../../src/services/api";
import { useRouter } from "next/navigation";
import { useToast } from "../context/ToastContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { showToastAfterRedirect } = useToast();

  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Password is required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      const res = await loginUser({ ...form, role });

      // ? login failed (no token)
      if (!res.token || !res.user) {
        showToast("error", res.message || "Invalid credentials");
        return;
      }

      // ? login success
      localStorage.setItem("token", res.token);

      showToastAfterRedirect("success", res.message || "Login successful");

      router.push(`/${res.user.role}/dashboard`);
    } catch (err) {
      showToast("error", err?.message || "Login failed. Please try again.");
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

          {/* Form Fields */}
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <label className={styles.label}>College Email</label>
              <input
                name="email"
                type="email"
                className={styles.input}
                placeholder="yourname@college.edu"
                onChange={handleChange}
              />
              {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
            </div>

            <div className={styles.fullWidth}>
              <label className={styles.label}>Password</label>
              <input
                name="password"
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                onChange={handleChange}
              />
              {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Login as {role === "student" ? "Student" : "Alumni"}
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

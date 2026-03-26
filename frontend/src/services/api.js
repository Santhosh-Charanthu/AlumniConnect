import { authFetch } from "@/services/authFetch";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

/* ---------------- OTP ---------------- */
export const sendOtp = async (email) => {
  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const verifyOtp = async (email, otp) => {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  return res.json();
};

/* ---------------- REGISTER ---------------- */
export const registerUser = async (formData) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    body: formData,
  });

  return res.json();
};

/* ---------------- LOGIN ---------------- */
export const loginUser = async (data) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

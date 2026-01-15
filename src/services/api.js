import { authFetch } from "@/services/authFetch";

const API_BASE = "http://localhost:5000/api";

/* ---------------- REGISTER ---------------- */
export const registerUser = async (formData) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    body: formData, // ✅ FormData handles headers automatically
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

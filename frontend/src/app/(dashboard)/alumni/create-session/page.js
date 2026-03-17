"use client";

import { useState } from "react";
import { useToast } from "../../../context/ToastContext";
import "./create-session.css";
import { useRouter } from "next/navigation";

export default function CreateSession() {
  const { showToast } = useToast();
  const router = useRouter();
  const { showToastAfterRedirect } = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    duration: "",
    price: "",
    meetLink: "",
    maxSeats: "",
    category: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    if (image) {
      formData.append("coverImage", image);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToastAfterRedirect("error", "Please Login to continue");
        router.push("/login");
        return;
      }
      const res = await fetch(
        "http://localhost:5000/api/alumni/create-session",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await res.json();

      if (data.success) {
        showToastAfterRedirect("success", data.message);
        router.push("/alumni/my-sessions");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="create-session">
      <div className="form-container">
        <h2>Create New Session</h2>

        <form onSubmit={handleSubmit} className="form">
          {/* Title */}
          <div className="form-group">
            <label>Session Title</label>
            <input type="text" name="title" onChange={handleChange} required />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" onChange={handleChange} />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label>Cover Image</label>

            <div
              className="upload-box"
              onClick={() => document.getElementById("fileInput").click()}
            >
              {preview ? (
                <img src={preview} alt="preview" className="preview-img" />
              ) : (
                <p>Click to upload session image</p>
              )}
            </div>

            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />

            <span className="upload-hint">JPG / JPEG / PNG • Max size 2MB</span>
          </div>

          {/* Date & Time */}
          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Price & Seats */}
          <div className="form-row">
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" name="price" onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Max Seats</label>
              <input type="number" name="maxSeats" onChange={handleChange} />
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              name="category"
              placeholder="e.g. DSA, Web Dev"
              onChange={handleChange}
            />
          </div>

          {/* Meet Link */}
          <div className="form-group">
            <label>Meeting Link</label>
            <input
              type="text"
              name="meetLink"
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Create Session
          </button>
        </form>
      </div>
    </div>
  );
}

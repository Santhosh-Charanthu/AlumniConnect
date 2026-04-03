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
    deadline: "",
    duration: "",
    price: "",
    category: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const errs = {};
    if (!form.title.trim()) errs.title = "Session title is required.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (!form.startTime) errs.startTime = "Start time is required.";
    else if (new Date(form.startTime) <= new Date())
      errs.startTime = "Start time must be in the future.";
    if (!form.deadline) errs.deadline = "Registration deadline is required.";
    else if (
      form.startTime &&
      new Date(form.deadline) >= new Date(form.startTime)
    )
      errs.deadline = "Deadline must be before start time.";
    if (!form.duration || Number(form.duration) <= 0)
      errs.duration = "Enter a valid duration.";
    if (form.price !== "" && Number(form.price) < 0)
      errs.price = "Price cannot be negative.";
    if (!form.category.trim()) errs.category = "Category is required.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);

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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumni/create-session`,
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
    } finally {
      setSubmitting(false);
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
            <input type="text" name="title" onChange={handleChange} />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" onChange={handleChange} />
            {errors.description && (
              <p className="field-error">{errors.description}</p>
            )}
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
              />
              {errors.startTime && (
                <p className="field-error">{errors.startTime}</p>
              )}
            </div>

            <div className="form-group">
              <label>Registration Deadline</label>
              <input
                type="datetime-local"
                name="deadline"
                onChange={handleChange}
              />
              {errors.deadline && (
                <p className="field-error">{errors.deadline}</p>
              )}
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" name="duration" onChange={handleChange} />
              {errors.duration && (
                <p className="field-error">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="form-row">
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" name="price" onChange={handleChange} />
              {errors.price && <p className="field-error">{errors.price}</p>}
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
            {errors.category && (
              <p className="field-error">{errors.category}</p>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Creating..." : "Create Session"}
          </button>
        </form>
      </div>
    </div>
  );
}

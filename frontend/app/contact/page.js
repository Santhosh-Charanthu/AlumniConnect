"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, ArrowLeft, Mail, MessageSquare, Clock, Send, CheckCircle } from "lucide-react";
import "../components/legal-pages.css";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send");
      setSent(true);
    } catch (err) {
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <Link href="/" className="legal-logo">
          <Sparkles size={16} className="legal-logo-icon" />
          AlumniConnect
        </Link>
        <Link href="/" className="legal-nav-back">
          <ArrowLeft size={15} /> Back to home
        </Link>
      </nav>

      <div className="legal-hero">
        <span className="legal-hero-label">Support</span>
        <h1>Contact Us</h1>
        <p>Have a question or need help? We're here for you.</p>
      </div>

      <div className="legal-body">

        {/* Contact cards */}
        <div className="legal-section">
          <h2>Get in touch</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-card-icon"><Mail size={18} /></div>
              <h3>General enquiries</h3>
              <a href="mailto:alumniconnect455@gmail.com">alumniconnect455@gmail.com</a>
              <p>We reply within 24 hours on business days.</p>
            </div>
            {/* <div className="contact-card">
              <div className="contact-card-icon"><MessageSquare size={18} /></div>
              <h3>General enquiries</h3>
              <a href="mailto:hello@alumniconnect.app">hello@alumniconnect.app</a>
              <p>For partnerships, feedback, or press.</p>
            </div> */}
            <div className="contact-card">
              <div className="contact-card-icon"><Clock size={18} /></div>
              <h3>Support hours</h3>
              <p>Monday – Friday</p>
              <p>9 AM – 6 PM IST</p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="contact-form">
          <h2>Send us a message</h2>

          {sent ? (
            <div className="contact-success">
              <CheckCircle size={20} />
              Thanks for reaching out! We'll get back to you within 24 hours.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Your name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <select id="subject" name="subject" value={form.subject} onChange={handleChange}>
                  <option value="general">General enquiry</option>
                  <option value="account">Account issue</option>
                  <option value="session">Session or booking</option>
                  <option value="payment">Payment</option>
                  <option value="report">Report a user</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Describe your issue or question..."
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="contact-submit" disabled={loading}>
                <Send size={15} />
                {loading ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>

        <div className="legal-section" style={{ marginTop: 40 }}>
          <h2>Other resources</h2>
          <p>
            Looking for legal information?{" "}
            <Link href="/privacy" style={{ color: "#ff7a18" }}>Privacy Policy</Link>
            {" "}and{" "}
            <Link href="/terms" style={{ color: "#ff7a18" }}>Terms of Service</Link>
            {" "}are available for your reference.
          </p>
        </div>
      </div>

      <footer className="legal-footer">
        <p>© {new Date().getFullYear()} Alumni Connect. All rights reserved.</p>
        <div className="legal-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <span>|</span>
          <Link href="/terms">Terms</Link>
          <span>|</span>
          <Link href="/refund-policy">Refund Policy</Link>
          <span>|</span>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
}

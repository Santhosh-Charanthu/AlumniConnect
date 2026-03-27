"use client";
import Link from "next/link";
import {
  BookOpen, MessageCircle, Compass, Globe,
  ArrowRight, Users, CalendarCheck, Star,
  Sparkles, ChevronRight, Zap, TrendingUp, ShieldCheck, CreditCard, RotateCcw
} from "lucide-react";
import "./landing.css";

const features = [
  {
    icon: <BookOpen size={24} />,
    title: "Expert-Led Sessions",
    desc: "Book 1-on-1 or group mentoring sessions with alumni at top companies.",
    color: "feat-orange",
  },
  {
    icon: <MessageCircle size={24} />,
    title: "Real-Time Messaging",
    desc: "Chat directly with alumni or in session group chats — instantly.",
    color: "feat-amber",
  },
  {
    icon: <Compass size={24} />,
    title: "Career Guidance",
    desc: "Get personalised advice on resumes, interviews, and career paths.",
    color: "feat-rose",
  },
  {
    icon: <Globe size={24} />,
    title: "Alumni Network",
    desc: "Explore profiles of alumni across industries and find your mentor.",
    color: "feat-purple",
  },
];

const steps = [
  { num: "01", icon: <Zap size={20} />, title: "Create your account", desc: "Sign up as a student or alumni in under a minute." },
  { num: "02", icon: <Users size={20} />, title: "Explore & connect", desc: "Browse alumni profiles and available mentoring sessions." },
  { num: "03", icon: <CalendarCheck size={20} />, title: "Book a session", desc: "Reserve your spot and get a dedicated group chat instantly." },
  { num: "04", icon: <TrendingUp size={20} />, title: "Grow your career", desc: "Apply insights from real-world professionals to your journey." },
];

const stats = [
  { icon: <Users size={20} />, value: "500+", label: "Alumni mentors" },
  { icon: <CalendarCheck size={20} />, value: "2k+", label: "Sessions booked" },
  { icon: <Star size={20} />, value: "98%", label: "Satisfaction rate" },
];

export default function LandingPage() {
  return (
    <div className="lp-root">
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <span className="lp-logo">
          <Sparkles size={18} className="lp-logo-icon" />
          AlumniConnect
        </span>
        <div className="lp-nav-links">
          <Link href="/login" className="lp-btn-ghost">Log in</Link>
          <Link href="/register" className="lp-btn-primary">
            Get started <ChevronRight size={15} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true">
          <div className="lp-blob lp-blob-1" />
          <div className="lp-blob lp-blob-2" />
          <div className="lp-blob lp-blob-3" />
          <div className="lp-grid-overlay" />
        </div>

        <div className="lp-hero-badge">
          <span className="lp-badge-dot" />
          Connecting students with alumni
        </div>

        <h1 className="lp-hero-title">
          Bridge the gap between
          <br />
          <span className="lp-gradient-text">students &amp; alumni</span>
        </h1>

        <p className="lp-hero-sub">
          AlumniConnect brings students and alumni together through mentoring
          sessions, real-time chat, and career guidance — all in one place.
        </p>

        <div className="lp-hero-cta">
          <Link href="/register" className="lp-btn-primary lp-btn-lg lp-btn-glow">
            Start for free <ArrowRight size={17} />
          </Link>
          <Link href="/login" className="lp-btn-outline lp-btn-lg">
            Log in
          </Link>
        </div>

        {/* Stats row */}
        <div className="lp-stats-row">
          {stats.map((s, i) => (
            <div key={i} className="lp-stat-card">
              <div className="lp-stat-icon">{s.icon}</div>
              <span className="lp-stat-value">{s.value}</span>
              <p className="lp-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-section-label">Why AlumniConnect</p>
          <h2 className="lp-section-title">Everything you need to grow</h2>
          <div className="lp-features-grid">
            {features.map((f) => (
              <div key={f.title} className={`lp-feature-card ${f.color}`}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="lp-card-shine" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner">
          <p className="lp-section-label">How it works</p>
          <h2 className="lp-section-title">Up and running in minutes</h2>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={s.num} className="lp-step">
                <div className="lp-step-head">
                  <div className="lp-step-num">
                    <span>{s.num}</span>
                    <div className="lp-step-ring" />
                  </div>
                  {i < steps.length - 1 && <div className="lp-step-connector" />}
                </div>
                <div className="lp-step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payments ── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-section-label">Secure Payments</p>
          <h2 className="lp-section-title">Pay safely, learn confidently</h2>
          <p className="lp-section-sub">All session payments are processed through <strong>Razorpay</strong>, India's leading payment gateway. Your financial data is always protected.</p>
          <div className="lp-payment-grid">
            <div className="lp-payment-card">
              <div className="lp-payment-icon"><ShieldCheck size={22} /></div>
              <h3>PCI-DSS Secure</h3>
              <p>Razorpay is fully PCI-DSS compliant. We never store your card or UPI details.</p>
            </div>
            <div className="lp-payment-card">
              <div className="lp-payment-icon"><CreditCard size={22} /></div>
              <h3>Multiple Payment Methods</h3>
              <p>Pay via UPI, credit/debit cards, net banking, or wallets — whatever works for you.</p>
            </div>
            <div className="lp-payment-card">
              <div className="lp-payment-icon"><RotateCcw size={22} /></div>
              <h3>Hassle-Free Refunds</h3>
              <p>Cancel 24+ hours before a session for a full refund. Alumni cancellations are always fully refunded.</p>
            </div>
          </div>
          <div className="lp-payment-note">
            <span>Powered by</span>
            <span className="lp-razorpay-badge">Razorpay</span>
            <span>·</span>
            <Link href="/refund-policy" className="lp-payment-link">Refund Policy</Link>
            <span>·</span>
            <Link href="/terms" className="lp-payment-link">Terms</Link>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="lp-cta-banner">
        <div className="lp-cta-inner">
          <p className="lp-section-label" style={{ marginBottom: 14 }}>Get started today</p>
          <h2>Ready to accelerate your career?</h2>
          <p>Join thousands of students already learning from alumni who've walked the path.</p>
          <div className="lp-cta-actions">
            <Link href="/register" className="lp-btn-primary lp-btn-lg">
              Create free account <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="lp-btn-outline lp-btn-lg">Log in</Link>
          </div>
          <div className="lp-cta-proof">
            <div className="lp-cta-avatars">
              {["S","A","R","K","M"].map((l, i) => (
                <div key={i} className="lp-cta-av" style={{ zIndex: 5 - i }}>{l}</div>
              ))}
            </div>
            <p><strong>500+</strong> alumni mentors ready to help you</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <span className="lp-logo lp-logo-sm">
          <Sparkles size={15} className="lp-logo-icon" />
          AlumniConnect
        </span>
        <p>© {new Date().getFullYear()} Alumni Connect. All rights reserved.</p>
        <div className="lp-footer-links">
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

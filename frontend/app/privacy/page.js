import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import "../components/legal-pages.css";

export const metadata = {
  title: "Privacy Policy — AlumniConnect",
};

export default function PrivacyPage() {
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
        <span className="legal-hero-label">Legal</span>
        <h1>Privacy Policy</h1>
        <p>How we collect, use, and protect your information.</p>
      </div>

      <div className="legal-body">
        <p className="legal-updated">Last updated: January 1, 2026</p>

        <div className="legal-section">
          <h2>1. Information We Collect</h2>
          <p>When you register on AlumniConnect, we collect the following information:</p>
          <ul>
            <li>Name, email address, and password (hashed)</li>
            <li>Profile details such as bio, skills, experience, and achievements</li>
            <li>Profile photos and documents uploaded via Cloudinary</li>
            <li>Messages sent through our real-time chat system</li>
            <li>Session booking details and payment records</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Create and manage your account</li>
            <li>Facilitate mentoring sessions between students and alumni</li>
            <li>Enable real-time messaging and group chat features</li>
            <li>Send transactional emails such as OTP verification and session confirmations</li>
            <li>Improve the platform based on usage patterns</li>
            <li>Respond to support requests and inquiries</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>3. Payment Data</h2>
          <p>AlumniConnect uses <strong>Razorpay</strong> as its payment gateway for processing session booking fees. When you make a payment:</p>
          <ul>
            <li>Your card or UPI details are entered directly on Razorpay's secure, PCI-DSS compliant checkout — AlumniConnect never sees or stores your raw payment credentials</li>
            <li>We store only the Razorpay Order ID, Payment ID, and payment status in our database for record-keeping and dispute resolution</li>
            <li>Transaction amounts, currency, and booking references are logged to maintain accurate payment history</li>
            <li>Razorpay may collect and process your payment information in accordance with their own <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" style={{ color: "#ff7a18" }}>Privacy Policy</a></li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>4. Data Sharing</h2>
          <p>We do not sell your personal data to third parties. We may share data with:</p>
          <ul>
            <li>Razorpay — our payment gateway partner, for processing session booking payments securely</li>
            <li>Cloudinary — for secure media storage and delivery</li>
            <li>Email service providers — to send transactional emails such as booking confirmations and OTPs</li>
          </ul>
          <p>All third-party services are bound by their own privacy policies and data protection agreements.</p>
        </div>

        <div className="legal-section">
          <h2>5. Profile Visibility</h2>
          <p>Alumni profiles, including name, bio, skills, experience, and session listings, are visible to registered students on the platform. Students can control what information appears on their own profiles. Private messages are only visible to the participants of that conversation.</p>
        </div>

        <div className="legal-section">
          <h2>6. Data Security</h2>
          <p>We take reasonable technical and organisational measures to protect your data, including:</p>
          <ul>
            <li>Passwords are hashed using bcrypt and never stored in plain text</li>
            <li>All data is transmitted over HTTPS</li>
            <li>Authentication is handled via JWT tokens with expiry</li>
            <li>Database access is restricted and secured</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>7. Data Retention</h2>
          <p>We retain your data for as long as your account is active. If you request account deletion, we will remove your personal data within 30 days, except where retention is required by law.</p>
        </div>

        <div className="legal-section">
          <h2>8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent for optional data processing</li>
          </ul>
          <p>To exercise any of these rights, contact us at <strong>privacy@alumniconnect.app</strong>.</p>
        </div>

        <div className="legal-section">
          <h2>9. Cookies</h2>
          <p>AlumniConnect uses minimal cookies necessary for authentication and session management. We do not use tracking or advertising cookies.</p>
        </div>

        <div className="legal-section">
          <h2>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify registered users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
        </div>

        <div className="legal-section">
          <h2>11. Contact</h2>
          <p>For privacy-related questions, reach us at <strong>privacy@alumniconnect.app</strong> or visit our <Link href="/contact" style={{ color: "#ff7a18" }}>Contact page</Link>.</p>
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

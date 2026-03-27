import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import "../components/legal-pages.css";

export const metadata = {
  title: "Terms of Service — AlumniConnect",
};

export default function TermsPage() {
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
        <h1>Terms of Service</h1>
        <p>Please read these terms carefully before using AlumniConnect.</p>
      </div>

      <div className="legal-body">
        <p className="legal-updated">Last updated: January 1, 2026</p>

        <div className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>By creating an account or using AlumniConnect, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
        </div>

        <div className="legal-section">
          <h2>2. Eligibility</h2>
          <p>AlumniConnect is intended for:</p>
          <ul>
            <li>Students currently enrolled in or recently graduated from an educational institution</li>
            <li>Alumni who wish to offer mentoring, guidance, or career sessions</li>
          </ul>
          <p>You must be at least 16 years old to register. By registering, you confirm that the information you provide is accurate and truthful.</p>
        </div>

        <div className="legal-section">
          <h2>3. Account Responsibilities</h2>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your login credentials</li>
            <li>All activity that occurs under your account</li>
            <li>Keeping your profile information accurate and up to date</li>
            <li>Notifying us immediately of any unauthorised use of your account</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>4. Payments</h2>
          <p>AlumniConnect uses <strong>Razorpay</strong> as its payment gateway. All session booking fees are collected through Razorpay's secure checkout, which is PCI-DSS compliant. By making a payment on AlumniConnect, you agree to Razorpay's <a href="https://razorpay.com/terms/" target="_blank" rel="noopener noreferrer" style={{ color: "#ff7a18" }}>Terms of Service</a>.</p>
          <ul>
            <li>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise</li>
            <li>Payment must be completed at the time of booking to confirm your seat in a session</li>
            <li>Accepted payment methods include UPI, credit/debit cards, net banking, and wallets — as supported by Razorpay</li>
            <li>A booking confirmation email is sent upon successful payment</li>
            <li>AlumniConnect does not store your card or UPI credentials at any point</li>
            <li>In the event of a payment failure, no amount is deducted. If an amount is debited but the booking is not confirmed, it will be automatically refunded within 5–7 business days</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>5. Cancellations and Refunds</h2>
          <p>We understand that plans change. Our refund policy is as follows:</p>
          <ul>
            <li><strong>Alumni cancels the session:</strong> A full refund will be issued to the student's original payment method within 5–7 business days</li>
            <li><strong>Student cancels more than 24 hours before the session:</strong> A full refund is issued</li>
            <li><strong>Student cancels within 24 hours of the session:</strong> No refund is applicable</li>
            <li><strong>Student does not attend (no-show):</strong> No refund is applicable</li>
            <li><strong>Technical failure on our end:</strong> If a session cannot be conducted due to a platform issue, a full refund will be issued</li>
          </ul>
          <p>All refunds are processed via Razorpay back to the original payment source. Refund timelines depend on your bank or payment provider and typically take 5–7 business days after initiation.</p>
          <p>To request a refund or report a payment issue, contact us at <strong>alumniconnect455@gmail.com</strong> with your booking ID and payment reference.</p>
        </div>

        <div className="legal-section">
          <h2>6. Sessions and Bookings</h2>
          <p>Alumni may create mentoring sessions with defined topics, schedules, and fees. Students may book available sessions subject to the following:</p>
          <ul>
            <li>Booking is confirmed only after successful payment via Razorpay</li>
            <li>Alumni are responsible for delivering the session as described at the scheduled time</li>
            <li>AlumniConnect is not liable for the quality or outcome of any session</li>
            <li>Session group chats are created automatically upon booking and are accessible to all participants</li>
            <li>Sessions may be conducted via the platform's group chat or through a link shared by the alumni</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>7. Acceptable Use</h2>
          <p>You agree not to use AlumniConnect to:</p>
          <ul>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Harass, abuse, or threaten other users</li>
            <li>Share spam, unsolicited promotions, or malicious content</li>
            <li>Attempt to gain unauthorised access to other accounts or systems</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </div>

        <div className="legal-section">
          <h2>8. Intellectual Property</h2>
          <p>All content on AlumniConnect — including the platform design, code, and branding — is owned by AlumniConnect. User-generated content (profiles, messages, session materials) remains the property of the respective users. By uploading content, you grant AlumniConnect a non-exclusive licence to display it within the platform.</p>
        </div>

        <div className="legal-section">
          <h2>9. Reviews and Ratings</h2>
          <p>Students may leave reviews for completed sessions. Reviews must be honest and based on genuine experience. AlumniConnect reserves the right to remove reviews that are abusive, fraudulent, or violate community standards.</p>
        </div>

        <div className="legal-section">
          <h2>10. Limitation of Liability</h2>
          <p>AlumniConnect is provided "as is" without warranties of any kind. We are not liable for:</p>
          <ul>
            <li>Any indirect, incidental, or consequential damages</li>
            <li>Loss of data or service interruptions</li>
            <li>The conduct or content of any user on the platform</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>11. Termination</h2>
          <p>You may delete your account at any time. We reserve the right to suspend or terminate accounts that breach these terms, with or without prior notice.</p>
        </div>

        <div className="legal-section">
          <h2>12. Changes to Terms</h2>
          <p>We may update these Terms of Service periodically. Continued use of the platform after changes are posted constitutes your acceptance of the revised terms. We will notify users of material changes via email.</p>
        </div>

        <div className="legal-section">
          <h2>13. Contact</h2>
          <p>For questions about these terms, contact us at <strong>alumniconnect455@gmail.com</strong> or visit our <Link href="/contact" style={{ color: "#ff7a18" }}>Contact page</Link>.</p>
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

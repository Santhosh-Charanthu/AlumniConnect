import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import "../components/legal-pages.css";

export const metadata = {
  title: "Refund Policy — AlumniConnect",
};

export default function RefundPolicyPage() {
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
        <h1>Cancellation &amp; Refund Policy</h1>
        <p>Clear, fair policies for session payments and refunds.</p>
      </div>

      <div className="legal-body">
        <p className="legal-updated">Last updated: January 1, 2026</p>

        <div className="legal-section">
          <h2>1. Overview</h2>
          <p>AlumniConnect facilitates paid mentoring sessions between students and alumni. All payments are processed securely through <strong>Razorpay</strong>, a PCI-DSS compliant payment gateway. This policy outlines the conditions under which cancellations and refunds are applicable.</p>
        </div>

        <div className="legal-section">
          <h2>2. Payment Processing</h2>
          <ul>
            <li>All session fees are collected in Indian Rupees (INR) at the time of booking</li>
            <li>Payments are processed via Razorpay and accepted through UPI, credit/debit cards, net banking, and wallets</li>
            <li>A booking is confirmed only after a successful payment is received</li>
            <li>A confirmation email with your booking details and Razorpay payment reference is sent upon successful payment</li>
            <li>AlumniConnect does not store any card or UPI credentials — all payment data is handled by Razorpay</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>3. Cancellation Policy</h2>
          <p>Either party (student or alumni) may cancel a booked session subject to the following conditions:</p>
          <ul>
            <li><strong>Student cancels more than 24 hours before the session start time:</strong> Full refund is issued</li>
            <li><strong>Student cancels within 24 hours of the session start time:</strong> No refund is applicable</li>
            <li><strong>Student does not attend (no-show):</strong> No refund is applicable</li>
            <li><strong>Alumni cancels the session (any time):</strong> Full refund is issued to the student automatically</li>
            <li><strong>Session cancelled due to a platform/technical issue:</strong> Full refund is issued to all affected students</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>4. Refund Eligibility</h2>
          <p>A refund will be issued in the following scenarios:</p>
          <ul>
            <li>The alumni cancels or does not conduct the session</li>
            <li>The student cancels more than 24 hours before the session</li>
            <li>A duplicate payment was made for the same booking</li>
            <li>Payment was deducted but booking was not confirmed due to a technical error</li>
            <li>The session was cancelled by AlumniConnect due to a policy violation by the alumni</li>
          </ul>
          <p>Refunds are <strong>not</strong> applicable in the following cases:</p>
          <ul>
            <li>Student cancels within 24 hours of the session</li>
            <li>Student does not attend the session without prior cancellation</li>
            <li>Dissatisfaction with session content (subjective quality disputes)</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>5. Refund Process and Timeline</h2>
          <p>All approved refunds are processed via Razorpay back to the original payment source:</p>
          <ul>
            <li><strong>UPI:</strong> 1–3 business days</li>
            <li><strong>Credit/Debit Card:</strong> 5–7 business days</li>
            <li><strong>Net Banking:</strong> 3–5 business days</li>
            <li><strong>Wallets:</strong> 1–3 business days</li>
          </ul>
          <p>Timelines are subject to your bank or payment provider's processing schedule. AlumniConnect initiates the refund within 2 business days of approval.</p>
        </div>

        <div className="legal-section">
          <h2>6. Payment Failure</h2>
          <p>If a payment fails during checkout, no amount is deducted and no booking is created. If an amount is debited from your account but the booking is not confirmed, please contact us immediately at <strong>alumniconnect455@gmail.com</strong> with your transaction details. Such amounts are refunded within 5–7 business days.</p>
        </div>

        <div className="legal-section">
          <h2>7. Dispute Resolution</h2>
          <p>If you believe a refund has been incorrectly denied or you have a payment dispute:</p>
          <ul>
            <li>Email us at <strong>alumniconnect455@gmail.com</strong> with your booking ID, Razorpay Payment ID, and a description of the issue</li>
            <li>We will review and respond within 3 business days</li>
            <li>If unresolved, you may raise a dispute directly with Razorpay or your bank</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>8. Contact for Refund Requests</h2>
          <p>To request a refund or report a payment issue, reach us at:</p>
          <ul>
            <li>Email: <strong>alumniconnect455@gmail.com</strong></li>
            <li>Subject line: <em>Refund Request — [Your Booking ID]</em></li>
            <li>Include: your registered email, Razorpay Payment ID, and reason for refund</li>
          </ul>
          <p>Or use our <Link href="/contact" style={{ color: "#ff7a18" }}>Contact page</Link>.</p>
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

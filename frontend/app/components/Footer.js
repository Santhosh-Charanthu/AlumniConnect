import Link from "next/link";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="app-footer">
      <p>© {new Date().getFullYear()} Alumni Connect</p>
      <div className="app-footer-links">
        <Link href="/privacy">Privacy Policy</Link>
        <span>|</span>
        <Link href="/terms">Terms</Link>
        <span>|</span>
        <Link href="/refund-policy">Refund Policy</Link>
        <span>|</span>
        <Link href="/contact">Contact</Link>
      </div>
    </footer>
  );
}

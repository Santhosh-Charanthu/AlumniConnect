import { ToastProvider } from "./context/ToastContext";
import "@/styles/Toast.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

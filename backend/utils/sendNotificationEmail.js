const User = require("../models/User");
const { transporter } = require("../config/mailer");

const subjects = {
  session_booking: "Session Booking Update — AlumniConnect",
  group_invite: "You've been invited to a group — AlumniConnect",
  new_session: "New Session Available — AlumniConnect",
  session_cancelled: "Session Cancelled — AlumniConnect",
  session_live: "Session is Live Now — AlumniConnect",
  session_completed: "Session Completed — AlumniConnect",
};

const icons = {
  session_booking: "📋",
  group_invite: "💬",
  new_session: "🎓",
  session_cancelled: "❌",
  session_live: "🔴",
  session_completed: "✅",
};

const sendNotificationEmail = async (notification) => {
  try {
    const user = await User.findById(notification.userId).select("email name");
    if (!user?.email) return;

    const subject =
      subjects[notification.type] || "New Notification — AlumniConnect";
    const icon = icons[notification.type] || "🔔";

    await transporter.sendMail({
      from: `"AlumniConnect" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border-radius:12px;border:1px solid #e2e8f0;">
          <h2 style="color:#0f172a;margin-bottom:4px;">${icon} ${subject}</h2>
          <p style="color:#94a3b8;font-size:13px;margin-bottom:24px;">Hi ${user.name || "there"},</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">${notification.message}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="color:#94a3b8;font-size:12px;">You're receiving this because you have an account on AlumniConnect.</p>
        </div>
      `,
    });
  } catch (err) {
    // Non-blocking — log but don't crash
    console.error("Failed to send notification email:", err.message);
  }
};

module.exports = sendNotificationEmail;

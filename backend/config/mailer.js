const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // needed in some cloud environments
  },
});

/**
 * Send OTP email
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit OTP
 */
const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"AlumniConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your AlumniConnect Verification Code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:12px;border:1px solid #e2e8f0;">
        <h2 style="color:#0f172a;margin-bottom:8px;">Verify your email</h2>
        <p style="color:#475569;font-size:15px;">Use the code below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
        <div style="margin:28px 0;text-align:center;">
          <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#2563eb;">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

const sendContactEmail = async ({ name, email, subject, message }) => {
  const subjectLabels = {
    general: "General Enquiry",
    account: "Account Issue",
    session: "Session or Booking",
    payment: "Payment",
    report: "Report a User",
    other: "Other",
  };

  await transporter.sendMail({
    from: `"AlumniConnect Contact" <${process.env.EMAIL_USER}>`,
    to: "alumniconnect455@gmail.com",
    replyTo: email,
    subject: `[Contact Form] ${subjectLabels[subject] || subject} — ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border-radius:12px;border:1px solid #e2e8f0;">
        <h2 style="color:#0f172a;margin-bottom:4px;">New Contact Form Submission</h2>
        <p style="color:#94a3b8;font-size:13px;margin-bottom:24px;">Received via AlumniConnect contact page</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:100px;">Name</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;color:#0f172a;"><a href="mailto:${email}" style="color:#ff7a18;">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Subject</td><td style="padding:8px 0;color:#0f172a;">${subjectLabels[subject] || subject}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
        <p style="color:#64748b;font-size:13px;margin-bottom:8px;">Message</p>
        <p style="color:#0f172a;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
      </div>
    `,
  });
};

module.exports = { transporter, sendOtpEmail, sendContactEmail };

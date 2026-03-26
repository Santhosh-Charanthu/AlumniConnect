const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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

module.exports = { sendOtpEmail };

require("dotenv").config({
  quiet: true, // suppress logs
});
const http = require("http");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { initSocket } = require("./socket/socket");

const authRoutes = require("./routes/auth.routes");
const experienceRoutes = require("./routes/experience.routes");
const achievementRoutes = require("./routes/achievement.routes");
const projectRoutes = require("./routes/project.routes");
const alumniRoutes = require("./routes/alumni.routes");
const studentRoutes = require("./routes/student.routes");
const chatRoutes = require("./routes/chat.routes");
const contactRoutes = require("./routes/contact.routes");
const paymentRoutes = require("./routes/paymentRoutes");
const aiRoutes = require("./routes/ai.routes");

const PORT = process.env.PORT || 3000;
const app = express();
const httpServer = http.createServer(app);

connectDB();

// Verify mailer on startup — check Render logs for result
const { transporter } = require("./config/mailer");
transporter.verify((err) => {
  if (err) console.error("Mailer connection failed:", err.message);
  else console.log("Mailer ready ✅");
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// ⚠️ Webhook must be registered BEFORE express.json() so it receives the raw body
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes,
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res
    .status(status)
    .json({ success: false, message: err.message || "Server error" });
});

app.get("/test", (req, res) => {
  res.send(`Handled by ${process.pid}`);
});

async function startServer() {
  const io = await initSocket(httpServer);
  app.set("io", io);

  return httpServer;
}

module.exports = startServer;

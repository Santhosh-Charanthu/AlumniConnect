require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const experienceRoutes = require("./routes/experience.routes");
const achievementRoutes = require("./routes/achievement.routes");
const projectRoutes = require("./routes/project.routes");
const alumniRoutes = require("./routes/alumni.routes");
const PORT = process.env.PORT || 3000;
const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/alumni", alumniRoutes);

console.log("Alumni routes loaded");

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

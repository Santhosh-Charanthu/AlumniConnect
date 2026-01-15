const mongoose = require("mongoose");

const alumniProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    profileImage: {
      url: String,
      filename: String,
    },

    department: String,
    batchYear: Number,

    company: String,
    jobTitle: String,

    skills: [String],

    bio: String,

    hourlyRate: {
      type: Number,
      default: 0,
    },

    availability: {
      type: String,
    },

    rating: {
      type: Number,
      default: 0,
    },

    totalSessions: {
      type: Number,
      default: 0,
    },
    about: {
      type: String,
      default: "",
    },

    experiences: [{ type: mongoose.Schema.Types.ObjectId, ref: "Experience" }],
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    achievements: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Achievement" },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AlumniProfile", alumniProfileSchema);

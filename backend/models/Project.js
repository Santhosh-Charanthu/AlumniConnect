const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumni",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 300,
    },

    techStack: {
      type: [String],
      required: true,
    },

    liveLink: {
      type: String,
      required: true,
    },

    repoLink: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);

const Project = require("../models/Project");
const Alumni = require("../models/Alumni");

exports.createProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alumniId = await Alumni.findOne({ userId: userId });
    const alumni = await Alumni.findById(alumniId);

    if (!alumni) {
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });
    }

    const project = await Project.create({
      alumni: alumniId,
      title: req.body.title,
      description: req.body.description,
      techStack: req.body.techStack,
      liveLink: req.body.liveLink,
      repoLink: req.body.repoLink,
    });

    await Alumni.findByIdAndUpdate(alumniId, {
      $push: { projects: project._id },
    });

    res.status(201).json({
      success: true,
      message: "Project added successfully",
      project,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

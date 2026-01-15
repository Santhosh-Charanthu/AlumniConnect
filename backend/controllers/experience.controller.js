const Experience = require("../models/Experience");
const Alumni = require("../models/Alumni");

exports.createExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alumniId = await Alumni.findOne({ userId: userId });
    const alumni = await Alumni.findById(alumniId);

    if (!alumni) {
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });
    }

    const experience = await Experience.create({
      alumni: alumniId,
      company: req.body.company,
      role: req.body.role,
      startDate: req.body.startDate,
      endDate: req.body.endDate || null,
      description: req.body.description,
    });

    await Alumni.findByIdAndUpdate(alumniId, {
      $push: { experiences: experience._id },
    });

    res.status(201).json({
      message: "Experience added successfully",
      experience,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

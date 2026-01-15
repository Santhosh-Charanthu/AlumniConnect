const Achievement = require("../models/Achievement");
const Alumni = require("../models/Alumni");

exports.createAchievement = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alumniId = await Alumni.findOne({ userId: userId });

    const alumni = await Alumni.findById(alumniId);

    if (!alumni) {
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });
    }

    const achievement = await Achievement.create({
      alumni: alumniId,
      title: req.body.title,
      description: req.body.description,
      year: req.body.year,
      certificateUrl: req.body.certificateUrl,
    });

    await Alumni.findByIdAndUpdate(alumniId, {
      $push: { achievements: achievement._id },
    });

    res.status(201).json({
      message: "Achievement added successfully",
      achievement,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

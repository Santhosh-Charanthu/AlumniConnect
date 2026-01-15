const Alumni = require("../models/Alumni");
const User = require("../models/User");

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const alumniId = await Alumni.findOne({ userId: userId });

    const alumni = await Alumni.findById(alumniId)
      .populate("experiences")
      .populate("projects")
      .populate("achievements");

    if (!alumni) {
      return res.status(404).json({ message: "Alumni not found" });
    }

    res.json({
      success: true,
      alumni,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateAbout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alumniId = await Alumni.findOne({ userId: userId });
    const { about } = req.body;

    if (!about || about.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "About section cannot be empty",
      });
    }

    const updatedAlumni = await Alumni.findByIdAndUpdate(
      alumniId,
      { about },
      { new: true }
    );

    if (!updatedAlumni) {
      return res.status(404).json({
        success: false,
        message: "Alumni not found",
      });
    }

    res.json({
      success: true,
      message: "About section updated successfully",
      about: updatedAlumni.about,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

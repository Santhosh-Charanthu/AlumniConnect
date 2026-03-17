const Alumni = require("../models/Alumni");
const User = require("../models/User");
const Session = require("../models/Session");

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
      { new: true },
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

exports.createSession = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      duration,
      price,
      meetLink,
      maxSeats,
      category,
    } = req.body;

    const userId = req.user.userId;
    const alumniId = await Alumni.findOne({ userId: userId });

    if (
      !title ||
      !description ||
      !startTime ||
      !duration ||
      !meetLink ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }
    // if (user.role != "alumni") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "You are not authorized for this action",
    //   });
    // }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    const coverImage = {
      url: req.file.path,
      filename: req.file.filename,
    };

    const session = await Session.create({
      alumniId,
      title,
      description,
      startTime,
      duration,
      price,
      coverImage,
      meetLink,
      maxSeats,
      category,
    });

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      session,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error creating session",
      error: error.message,
    });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alumni = await Alumni.findOne({ userId: userId });

    const sessions = await Session.find({
      alumniId: alumni._id,
    }).sort({ startTime: -1 });

    res.status(200).json({
      alumni,
      success: true,
      sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sessions",
    });
  }
};

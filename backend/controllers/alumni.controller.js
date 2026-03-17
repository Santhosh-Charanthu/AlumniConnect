const Alumni = require("../models/Alumni");
const User = require("../models/User");
const Session = require("../models/Session");
const Review = require("../models/Review");
const cloudinary = require("../config/cloudinary");

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
    // const user = await User.findById(userId);
    const alumni = await Alumni.findOne({ userId: userId }).populate("userId");

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

exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const alumni = await Alumni.findOne({ userId: req.user.userId });
    if (!alumni) {
      return res.status(404).json({ success: false, message: "Alumni not found" });
    }

    const session = await Session.findById(id).select("+meetLink");
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.alumniId.toString() !== alumni._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching session", error: error.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const alumni = await Alumni.findOne({ userId: req.user.userId });
    if (!alumni) {
      return res.status(404).json({ success: false, message: "Alumni not found" });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.alumniId.toString() !== alumni._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { title, description, startTime, duration, price, meetLink, maxSeats, category, status } = req.body;
    const updateData = { title, description, startTime, duration, price, meetLink, maxSeats, category, status };

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (session.coverImage && session.coverImage.filename) {
        await cloudinary.uploader.destroy(session.coverImage.filename);
      }
      updateData.coverImage = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    const updatedSession = await Session.findByIdAndUpdate(id, updateData, { new: true }).select("+meetLink");

    res.status(200).json({ success: true, message: "Session updated successfully", session: updatedSession });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating session", error: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const alumni = await Alumni.findOne({ userId: req.user.userId });
    if (!alumni) {
      return res.status(404).json({ success: false, message: "Alumni not found" });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.alumniId.toString() !== alumni._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (session.coverImage && session.coverImage.filename) {
      await cloudinary.uploader.destroy(session.coverImage.filename);
    }

    await Session.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting session", error: error.message });
  }
};

exports.getAlumniById = async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id)
      .populate("userId", "name college")
      .populate("experiences")
      .populate("projects")
      .populate("achievements");

    if (!alumni) {
      return res.status(404).json({ success: false, message: "Alumni not found" });
    }

    const sessions = await Session.find({
      alumniId: alumni._id,
      status: "scheduled",
    }).sort({ startTime: 1 });

    const reviews = await Review.find({ alumniId: alumni.userId })
      .populate("studentId", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, alumni, user: alumni.userId, sessions, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.searchAlumni = async (req, res) => {
  try {
    const { name, college, company, jobTitle, skills, sort } = req.query;
    const hasFilters = name || college || company || jobTitle || skills;

    const alumniQuery = {};

    // Handle name and college filters (fields on User model) via two-step lookup
    if (name || college) {
      const userQuery = {};
      if (name) userQuery.name = { $regex: name, $options: "i" };
      if (college) userQuery.college = { $regex: college, $options: "i" };
      const matchingUsers = await User.find(userQuery).select("_id");
      const matchingUserIds = matchingUsers.map((u) => u._id);
      alumniQuery.userId = { $in: matchingUserIds };
    }

    // Handle direct AlumniProfile field filters
    if (company) alumniQuery.company = { $regex: company, $options: "i" };
    if (jobTitle) alumniQuery.jobTitle = { $regex: jobTitle, $options: "i" };
    if (skills) alumniQuery.skills = { $elemMatch: { $regex: skills, $options: "i" } };

    // Default: no filters provided — apply college filter from authenticated user
    if (!hasFilters && req.user) {
      const studentUser = await User.findById(req.user.userId).select("college");
      if (studentUser && studentUser.college) {
        const sameCollegeUsers = await User.find({ college: studentUser.college }).select("_id");
        const sameCollegeUserIds = sameCollegeUsers.map((u) => u._id);
        alumniQuery.userId = { $in: sameCollegeUserIds };
      }
    }
    // If no filters and no req.user, alumniQuery stays empty → returns all alumni

    // Build sort option
    let sortOption = {};
    if (sort === "rating") sortOption = { rating: -1 };
    else if (sort === "sessions") sortOption = { totalSessions: -1 };

    const alumni = await Alumni.find(alumniQuery)
      .populate("userId", "name college")
      .sort(sortOption);

    res.json({ success: true, alumni });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

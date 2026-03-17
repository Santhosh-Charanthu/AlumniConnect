const StudentProfile = require("../models/Student");
const Registration = require("../models/Registration");
const Session = require("../models/Session");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    let profile = await StudentProfile.findOneAndUpdate(
      { userId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const user = await User.findById(userId).select("name email");

    res.json({ success: true, profile, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { department, batchYear, interests, name } = req.body;

    // Validate batchYear
    if (batchYear !== undefined && batchYear !== "") {
      const year = Number(batchYear);
      if (isNaN(year) || year < 1900 || year > 2100) {
        return res.status(400).json({
          success: false,
          message: "batchYear must be a number between 1900 and 2100",
        });
      }
    }

    const updateData = {};
    if (department !== undefined) updateData.department = department;
    if (batchYear !== undefined && batchYear !== "") updateData.batchYear = Number(batchYear);

    // Parse interests from JSON string (FormData sends arrays as JSON strings)
    if (interests !== undefined) {
      updateData.interests =
        typeof interests === "string" ? JSON.parse(interests) : interests;
    }

    if (req.file) {
      updateData.profileImage = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Update User.name if provided
    let user = await User.findById(userId).select("name email");
    if (name) {
      user = await User.findByIdAndUpdate(userId, { name }, { new: true }).select("name email");
    }

    res.json({ success: true, message: "Profile updated", profile, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const registrations = await Registration.find({ studentId: userId }).populate("sessionId");

    // Populate alumni name for each session
    const populated = await Promise.all(
      registrations.map(async (reg) => {
        const regObj = reg.toObject();
        if (regObj.sessionId && regObj.sessionId.alumniId) {
          const alumniUser = await User.findById(regObj.sessionId.alumniId).select("name email");
          regObj.sessionId.alumni = alumniUser;
        }
        return regObj;
      })
    );

    res.json({ success: true, sessions: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const profile = await StudentProfile.findOne({ userId });
    const user = await User.findById(userId).select("name");

    const registrations = await Registration.find({ studentId: userId }).populate("sessionId");

    const total = registrations.length;
    const upcomingRegs = registrations.filter(
      (r) => r.sessionId && r.sessionId.startTime > now
    );
    const completed = registrations.filter(
      (r) => !r.sessionId || r.sessionId.startTime <= now
    ).length;
    const upcoming = upcomingRegs.length;

    // Build upcomingSessions with alumni name
    const upcomingSessions = await Promise.all(
      upcomingRegs.map(async (reg) => {
        const session = reg.sessionId;
        let alumniName = null;
        if (session && session.alumniId) {
          const alumniUser = await User.findById(session.alumniId).select("name");
          alumniName = alumniUser ? alumniUser.name : null;
        }
        return {
          title: session ? session.title : null,
          alumniName,
          date: session ? session.startTime : null,
          time: session ? session.startTime : null,
          status: session ? session.status : null,
        };
      })
    );

    res.json({
      success: true,
      profile,
      user: { name: user ? user.name : null },
      stats: { total, upcoming, completed },
      upcomingSessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const razorpay = require("../config/razorpay");
const Alumni = require("../models/Alumni");
const User = require("../models/User");
const Session = require("../models/Session");
const Review = require("../models/Review");
const Registration = require("../models/Registration");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const StudentProfile = require("../models/Student");
const cloudinary = require("../config/cloudinary");
const redis = require("../utils/redisClient");

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      college,
      department,
      batchYear,
      company,
      jobTitle,
      bio,
      hourlyRate,
      availability,
      skills,
    } = req.body;

    // Update User fields
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (college) userUpdate.college = college;
    if (Object.keys(userUpdate).length) {
      await User.findByIdAndUpdate(userId, userUpdate);
    }

    // Build alumni update
    const alumniUpdate = {};
    if (department !== undefined) alumniUpdate.department = department;
    if (batchYear !== undefined && batchYear !== "")
      alumniUpdate.batchYear = Number(batchYear);
    if (company !== undefined) alumniUpdate.company = company;
    if (jobTitle !== undefined) alumniUpdate.jobTitle = jobTitle;
    if (bio !== undefined) alumniUpdate.bio = bio;
    if (hourlyRate !== undefined && hourlyRate !== "")
      alumniUpdate.hourlyRate = Number(hourlyRate);
    if (availability !== undefined) alumniUpdate.availability = availability;
    if (skills !== undefined) {
      alumniUpdate.skills =
        typeof skills === "string" ? JSON.parse(skills) : skills;
    }

    if (req.file) {
      // Delete old image from Cloudinary
      const existing = await Alumni.findOne({ userId });
      if (existing?.profileImage?.filename) {
        await cloudinary.uploader.destroy(existing.profileImage.filename);
      }
      alumniUpdate.profileImage = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    const alumni = await Alumni.findOneAndUpdate({ userId }, alumniUpdate, {
      new: true,
    });
    const user = await User.findById(userId).select("name email college");

    res.json({
      success: true,
      message: "Profile updated successfully",
      alumni,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

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
      deadline,
      duration,
      price,
      category,
    } = req.body;

    const userId = req.user.userId;
    const alumniProfile = await Alumni.findOne({ userId });

    if (
      !title ||
      !description ||
      !startTime ||
      !deadline ||
      !duration ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

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
      alumniId: alumniProfile._id,
      title,
      description,
      startTime,
      deadline,
      duration,
      price,
      isPaid: price > 0,
      coverImage,
      category,
    });

    // Auto-create a group chat for this session
    const GroupChat = require("../models/GroupChat");
    const alumniUser = await User.findById(userId).select("name");
    const group = await GroupChat.create({
      name: `${title} — by ${alumniUser?.name || "Alumni"}`,
      description: `Group chat for the session: ${title}`,
      createdBy: userId,
      sessionId: session._id,
      members: [{ user: userId, role: "admin" }],
    });

    // Notify the alumni that their group chat is ready (upsert to prevent duplicates)
    await Notification.findOneAndUpdate(
      {
        userId,
        type: "session_booking",
        "meta.sessionId": session._id,
        "meta.groupId": group._id,
      },
      {
        $setOnInsert: {
          userId,
          type: "session_booking",
          message: `A group chat has been created for your session "${title}". Participants will be added as they register.`,
          meta: {
            sessionId: session._id,
            sessionTitle: title,
            groupId: group._id,
          },
        },
      },
      { upsert: true, new: true },
    );

    // Notify all students from the same college about the new session
    const alumniUser2 = await User.findById(userId).select("college");
    const collegeStudents = await User.find({
      role: "student",
      college: alumniUser2?.college,
    }).select("_id");
    const io = req.app.get("io");

    await Promise.all(
      collegeStudents.map(async (student) => {
        const notif = await Notification.create({
          userId: student._id,
          type: "new_session",
          message: `A new session "${title}" has been created by ${alumniUser?.name || "an alumni"}. Check it out!`,
          meta: { sessionId: session._id, sessionTitle: title },
        });
        if (io) io.to(`user:${student._id}`).emit("notification:new", notif);
      }),
    );

    const keys = await redis.keys("student:*:explore-sessions");

    if (keys.length > 0) {
      await redis.del(keys);
    }

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
    const alumni = await Alumni.findOne({ userId }).populate("userId");

    if (!alumni) {
      return res
        .status(404)
        .json({ success: false, message: "Alumni profile not found" });
    }

    const sessions = await Session.find({ alumniId: alumni._id }).sort({
      startTime: -1,
    });

    res.status(200).json({ success: true, alumni, sessions });
  } catch (error) {
    console.error("getMySessions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sessions",
      error: error.message,
    });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const alumni = await Alumni.findOne({ userId: req.user.userId });
    if (!alumni) {
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.alumniId.toString() !== alumni._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching session",
      error: error.message,
    });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const alumni = await Alumni.findOne({ userId: req.user.userId });
    if (!alumni) {
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.alumniId.toString() !== alumni._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const {
      title,
      description,
      startTime,
      deadline,
      duration,
      price,
      category,
      status,
    } = req.body;
    const updateData = {
      title,
      description,
      duration,
      price,
      category,
      status,
    };

    if (startTime !== undefined) {
      updateData.startTime = new Date(startTime);
    }

    if (deadline !== undefined) {
      updateData.deadline = new Date(deadline);
    }

    console.log("Incoming startTime:", startTime);
    console.log("Converted:", new Date(startTime));

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    if (updateData.price !== undefined) {
      updateData.isPaid = updateData.price > 0;
    }

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

    const updatedSession = await Session.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    const keys = await redis.keys("student:*:explore-sessions");

    if (keys.length > 0) {
      await redis.del(keys);
    }

    res.status(200).json({
      success: true,
      message: "Session updated successfully",
      session: updatedSession,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating session",
      error: error.message,
    });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const alumni = await Alumni.findOne({ userId: req.user.userId });
    if (!alumni) {
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.alumniId.toString() !== alumni._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (session.coverImage && session.coverImage.filename) {
      await cloudinary.uploader.destroy(session.coverImage.filename);
    }

    // Get all registered students before deleting
    const GroupChat = require("../models/GroupChat");
    const Message = require("../models/Message");
    const registrations = await Registration.find({ sessionId: id }).select(
      "studentId",
    );
    const transactions = await Transaction.find({ sessionId: id });
    await Promise.allSettled(
      transactions.map(async (tx) => {
        if (tx.status !== "paid") return;
        if (!tx.razorpayPaymentId) return;

        try {
          tx.status = "refund_pending";
          await tx.save();

          await razorpay.payments.refund(tx.razorpayPaymentId, {
            amount: tx.amount * 100,
          });
        } catch (err) {
          console.error("Refund failed for:", tx._id, err);
        }
      }),
    );
    await Registration.updateMany({ sessionId: id }, { isActive: false });
    const studentIds = registrations.map((r) => r.studentId);
    // Notify each registered student
    const notifPromises = studentIds.map((studentId) =>
      Notification.create({
        userId: studentId,
        type: "session_cancelled",
        message: `The session "${session.title}" has been cancelled by the host. We're sorry for the inconvenience.`,
        meta: { sessionId: session._id, sessionTitle: session.title },
      }),
    );
    const studentNotifs = await Promise.all(notifPromises);

    // Deactivate the group and post a system message
    const group = await GroupChat.findOne({ sessionId: id, isActive: true });
    if (group) {
      // Post system message before deactivating
      const cancelMsg = await Message.create({
        senderId: req.user.userId,
        groupId: group._id,
        type: "group",
        content: `This session has been cancelled by the host. This group is now closed.`,
        isSystem: true,
        readBy: [],
      });

      // Deactivate the group
      await GroupChat.findByIdAndUpdate(group._id, { isActive: false });

      // Broadcast to all group members via socket
      const io = req.app.get("io");
      if (io) {
        const populatedMsg = await cancelMsg.populate("senderId", "name role");
        io.to(`group:${group._id}`).emit("group:receive", populatedMsg);
        io.to(`group:${group._id}`).emit("group:deactivated", {
          groupId: group._id,
        });
      }
    }

    // Push live notifications to online students
    const io = req.app.get("io");
    studentNotifs.forEach((notif, i) => {
      if (io) io.to(`user:${studentIds[i]}`).emit("notification:new", notif);
    });

    await Session.findByIdAndDelete(id);

    const keys = await redis.keys("student:*:explore-sessions");

    if (keys.length > 0) {
      await redis.del(keys);
    }

    res
      .status(200)
      .json({ success: true, message: "Session deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting session",
      error: error.message,
    });
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
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });
    }

    const sessions = await Session.find({
      alumniId: alumni._id,
      status: "scheduled",
    }).sort({ startTime: 1 });

    const reviews = await Review.find({ alumniId: alumni.userId })
      .populate("studentId", "name")
      .populate("sessionId", "title")
      .sort({ createdAt: -1 });

    res.json({ success: true, alumni, user: alumni.userId, sessions, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.searchAlumni = async (req, res) => {
  try {
    const limit = 10;
    const cursor = req.query.cursor;
    const { name, college, company, jobTitle, skills, sort } = req.query;
    const hasFilters = name || college || company || jobTitle || skills;

    const alumniQuery = {};

    // Handle name and college filters (fields on User model) via two-step lookup
    if (name || college) {
      const userQuery = {};
      if (name) userQuery.name = { $regex: name, $options: "i" };
      if (college) userQuery.college = { $regex: college, $options: "i" };
      const matchingUsers = await User.find(userQuery).select("_id").lean();
      const matchingUserIds = matchingUsers.map((u) => u._id);
      alumniQuery.userId = { $in: matchingUserIds };
    }

    // Handle direct AlumniProfile field filters
    if (company) alumniQuery.company = { $regex: company, $options: "i" };
    if (jobTitle) alumniQuery.jobTitle = { $regex: jobTitle, $options: "i" };
    if (skills)
      alumniQuery.skills = { $elemMatch: { $regex: skills, $options: "i" } };

    // Default: no filters provided — apply college filter from authenticated user
    if (!hasFilters && req.user) {
      const studentUser = await User.findById(req.user.userId).select(
        "college",
      );
      if (studentUser && studentUser.college) {
        const sameCollegeUsers = await User.find({
          college: studentUser.college,
        }).select("_id");
        const sameCollegeUserIds = sameCollegeUsers.map((u) => u._id);
        alumniQuery.userId = { $in: sameCollegeUserIds };
      }
    }
    // If no filters and no req.user, alumniQuery stays empty → returns all alumni

    // Build sort option
    let sortOption = {};
    if (sort === "rating") sortOption = { rating: -1 };
    else if (sort === "sessions") sortOption = { totalSessions: -1 };

    let cursorFilter = {};
    if (cursor) {
      cursorFilter._id = { $lt: cursor };
    }

    const alumni = await Alumni.find({ ...alumniQuery, ...cursorFilter })
      .sort({
        ...sortOption,
        _id: -1,
      })
      .limit(limit)
      .select("company jobTitle skills rating totalSessions userId")
      .populate({
        path: "userId",
        select: "name college",
      })
      .lean();

    const nextCursor = alumni.length > 0 ? alumni[alumni.length - 1]._id : null;

    res.json({
      success: true,
      count: alumni.length,
      nextCursor,
      hasMore: alumni.length === limit,
      alumni,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getSessionParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const alumni = await Alumni.findOne({ userId: req.user.userId });
    if (!alumni)
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });

    const session = await Session.findById(id);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    if (session.alumniId.toString() !== alumni._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const registrations = await Registration.find({
      sessionId: id,
      isActive: true,
    })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });
    // 🔥 Fetch transactions
    const transactions = await Transaction.find({ sessionId: id });
    const txMap = new Map(
      transactions.map((tx) => [tx.userId.toString(), tx.status]),
    );

    // 🔥 Fetch profiles in one go
    const studentIds = registrations.map((r) => r.studentId._id);
    const profiles = await StudentProfile.find({
      userId: { $in: studentIds },
    });
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    // 🔥 Map
    const participants = registrations.map((reg) => {
      const profile = profileMap.get(reg.studentId._id.toString());

      return {
        _id: reg._id,
        registeredAt: reg.createdAt,
        attended: reg.attended,
        paymentStatus: txMap.get(reg.studentId._id.toString()) || "free",

        student: {
          _id: reg.studentId._id,
          name: reg.studentId.name,
          email: reg.studentId.email,
          department: profile?.department || null,
          batchYear: profile?.batchYear || null,
          profileImage: profile?.profileImage || null,
        },
      };
    });

    res.json({ success: true, participants, total: participants.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Alumni should never see group_invite notifications — those are student-only
    const notifications = await Notification.find({
      userId,
      type: { $ne: "group_invite" },
    })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
      type: { $ne: "group_invite" },
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: "Notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.startSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { meetLink } = req.body;
    const alumni = await Alumni.findOne({ userId: req.user.userId });
    if (!alumni)
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });

    const session = await Session.findById(id);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    if (session.alumniId.toString() !== alumni._id.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });
    if (session.status !== "scheduled")
      return res.status(400).json({
        success: false,
        message: `Session is already ${session.status}`,
      });
    if (!meetLink || !meetLink.trim())
      return res.status(400).json({
        success: false,
        message: "Meet link is required to start the session",
      });

    // Allow starting within ±60 minutes of scheduled start time
    const now = new Date();
    const diff = Math.abs(now - new Date(session.startTime)) / 60000;
    if (diff > 60)
      return res.status(400).json({
        success: false,
        message:
          "You can only start the session within 60 minutes of the scheduled start time",
      });

    const updated = await Session.findByIdAndUpdate(
      id,
      { status: "live", meetLink: meetLink.trim(), actualStartTime: now },
      { new: true },
    );

    // Notify all registered students that the session is live
    const registrations = await Registration.find({ sessionId: id }).select(
      "studentId",
    );
    const io = req.app.get("io");
    await Promise.all(
      registrations.map(async (reg) => {
        const notif = await Notification.create({
          userId: reg.studentId,
          type: "session_live",
          message: `"${session.title}" is now live! Click to join.`,
          meta: { sessionId: session._id, sessionTitle: session.title },
        });
        if (io) io.to(`user:${reg.studentId}`).emit("notification:new", notif);
      }),
    );

    res.json({ success: true, message: "Session started", session: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const alumni = await Alumni.findOne({ userId: req.user.userId });
    if (!alumni)
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });

    const session = await Session.findById(id);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    if (session.alumniId.toString() !== alumni._id.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });
    if (session.status !== "live")
      return res
        .status(400)
        .json({ success: false, message: "Session is not currently live" });

    // Must have run for at least 50% of scheduled duration
    const now = new Date();
    const elapsed = (now - new Date(session.actualStartTime)) / 60000;
    const minDuration = session.duration * 0.5;
    if (elapsed < minDuration)
      return res.status(400).json({
        success: false,
        message: `Session must run for at least ${Math.ceil(minDuration)} minutes before ending`,
      });

    const updated = await Session.findByIdAndUpdate(
      id,
      { status: "completed", meetLink: null, actualEndTime: now },
      { new: true },
    );

    // Notify registered students that session is complete
    const registrations = await Registration.find({ sessionId: id }).select(
      "studentId",
    );
    const io = req.app.get("io");
    await Promise.all(
      registrations.map(async (reg) => {
        const notif = await Notification.create({
          userId: reg.studentId,
          type: "session_completed",
          message: `"${session.title}" has ended. You can now leave a review!`,
          meta: { sessionId: session._id, sessionTitle: session.title },
        });
        if (io) io.to(`user:${reg.studentId}`).emit("notification:new", notif);
      }),
    );

    res.json({ success: true, message: "Session ended", session: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

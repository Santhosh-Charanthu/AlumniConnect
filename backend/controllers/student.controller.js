const razorpay = require("../config/razorpay");
const StudentProfile = require("../models/Student");
const Transaction = require("../models/Transaction");
const Registration = require("../models/Registration");
const Session = require("../models/Session");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const registerStudent = require("../utils/registerStudent");
const redis = require("../utils/redisClient");

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const transactions = await Transaction.find({ userId })
      .populate(
        "sessionId",
        "title startTime duration category coverImage status isPaid price",
      )
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, bookings: transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    let profile = await StudentProfile.findOneAndUpdate(
      { userId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true },
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
    if (batchYear !== undefined && batchYear !== "")
      updateData.batchYear = Number(batchYear);

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
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // Update User.name if provided
    let user = await User.findById(userId).select("name email");
    if (name) {
      user = await User.findByIdAndUpdate(
        userId,
        { name },
        { new: true },
      ).select("name email");
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

    const registrations = await Registration.find({
      studentId: userId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "sessionId",
        populate: {
          path: "alumniId",
          populate: {
            path: "userId",
            select: "name",
          },
        },
      })
      .lean();

    const sessions = registrations.map((reg) => {
      const session = reg.sessionId;

      return {
        ...reg,
        sessionId: {
          ...session,
          alumni: session?.alumniId
            ? {
                _id: session.alumniId._id,
                name: session.alumniId.userId?.name || null,
                jobTitle: session.alumniId.jobTitle || null,
                profileImage: session.alumniId.profileImage || null,
              }
            : null,
        },
      };
    });

    res.json({ success: true, sessions });
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

    const registrations = await Registration.find({
      studentId: userId,
    }).populate("sessionId");

    const total = registrations.length;
    const upcomingRegs = registrations.filter(
      (r) => r.sessionId && r.sessionId.startTime > now,
    );
    const completed = registrations.filter(
      (r) => !r.sessionId || r.sessionId.startTime <= now,
    ).length;
    const upcoming = upcomingRegs.length;

    // Build upcomingSessions with alumni name
    const upcomingSessions = await Promise.all(
      upcomingRegs.map(async (reg) => {
        const session = reg.sessionId;
        let alumniName = null;
        if (session && session.alumniId) {
          const alumniUser = await User.findById(session.alumniId).select(
            "name",
          );
          alumniName = alumniUser ? alumniUser.name : null;
        }
        return {
          title: session ? session.title : null,
          alumniName,
          date: session ? session.startTime : null,
          time: session ? session.startTime : null,
          status: session ? session.status : null,
        };
      }),
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

exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const Alumni = require("../models/Alumni");
    let session = null;
    const cached = await redis.get(`session:${id}`);
    if (cached) {
      console.log("CACHE HIT");
      session = JSON.parse(cached);
    } else {
      console.log("CACHE MISS");
      session = await Session.findById(id).lean();
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found",
        });
      }
      await redis.set(`session:${id}`, JSON.stringify(session), {
        EX: 60,
      });
    }
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    const s = session.toObject ? session.toObject() : session;

    // Enrich with alumni info
    const alumniProfile = await Alumni.findById(s.alumniId).populate(
      "userId",
      "name",
    );
    s.alumni = alumniProfile
      ? {
          _id: alumniProfile._id,
          name: alumniProfile.userId?.name || null,
          jobTitle: alumniProfile.jobTitle || null,
          profileImage: alumniProfile.profileImage || null,
        }
      : null;

    // Check if this student is already registered
    const registration = await Registration.findOne({
      sessionId: id,
      studentId: userId,
      isActive: true,
    });
    console.log("UserId: ", userId);
    s.isRegistered = registration ? true : false;
    const transaction = await Transaction.findOne({
      userId,
      sessionId: id,
    });

    s.paymentStatus = transaction?.status || null;
    res.json({ success: true, session: s, userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUpcomingSessions = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user.userId;
    const cachedKey = `student:${userId}:explore-sessions`;

    const cachedData = await redis.get(cachedKey);
    if (cachedData) {
      console.log("Cache HIT");
      return res.json(JSON.parse(cachedData));
    }

    console.log("Cache MISS");

    const sessions = await Session.find({
      status: "scheduled",
      startTime: { $gt: now },
    }).sort({ startTime: 1 });

    // Get all session IDs this student has already registered for
    const myRegistrations = await Registration.find({
      studentId: userId,
    }).select("sessionId");
    const registeredIds = new Set(
      myRegistrations.map((r) => r.sessionId.toString()),
    );

    const Alumni = require("../models/Alumni");
    const populated = await Promise.all(
      sessions.map(async (session) => {
        const s = session.toObject();
        const alumniProfile = await Alumni.findById(s.alumniId).populate(
          "userId",
          "name",
        );
        s.alumni = alumniProfile
          ? {
              _id: alumniProfile._id,
              name: alumniProfile.userId?.name || null,
              jobTitle: alumniProfile.jobTitle || null,
              profileImage: alumniProfile.profileImage || null,
            }
          : null;
        s.isRegistered = registeredIds.has(s._id.toString());
        return s;
      }),
    );

    await redis.set(
      cachedKey,
      JSON.stringify({
        success: true,
        sessions: populated,
      }),
      {
        EX: 3600,
      },
    );

    res.json({ success: true, sessions: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// exports.registerSession = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { sessionId } = req.params;

//     const session = await Session.findById(sessionId);
//     if (!session) return res.status(404).json({ success: false, message: "Session not found" });

//     if (session.status !== "scheduled") {
//       return res.status(400).json({ success: false, message: "Session is not available for booking" });
//     }

//     const now = new Date();
//     if (session.deadline && now > session.deadline) {
//       return res.status(400).json({ success: false, message: "Registration deadline has passed" });
//     }

//     const existing = await Registration.findOne({ sessionId, studentId: userId });
//     if (existing) return res.status(400).json({ success: false, message: "Already registered for this session" });

//     await Registration.create({ sessionId, studentId: userId });

//     await Session.findByIdAndUpdate(sessionId, {
//       $inc: { currentSeats: 1 },
//       $addToSet: { bookedStudents: userId },
//     });

//     const Notification = require("../models/Notification");
//     const Alumni = require("../models/Alumni");
//     const GroupChat = require("../models/GroupChat");
//     const studentUser = await User.findById(userId).select("name");

//     // Notify the alumni about the new registration
//     const alumniProfile = await Alumni.findById(session.alumniId).select("userId");
//     if (alumniProfile) {
//       await Notification.create({
//         userId: alumniProfile.userId,
//         type: "session_booking",
//         message: `${studentUser?.name || "A student"} registered for your session "${session.title}"`,
//         meta: { sessionId: session._id, sessionTitle: session.title, studentId: userId, studentName: studentUser?.name },
//       });
//     }

//     // Find the group for this session and notify the student to join
//     const group = await GroupChat.findOne({ sessionId, isActive: true });
//     if (group) {
//       // Remove student from group if they were previously a member (e.g. re-registration after unregister)
//       const wasMember = group.members.some((m) => m.user.toString() === userId.toString());
//       if (wasMember) {
//         group.members = group.members.filter((m) => m.user.toString() !== userId.toString());
//         await group.save();
//       }

//       // Delete any old group_invite notification for this group so a fresh unread one is created
//       await Notification.deleteMany({ userId, type: "group_invite", "meta.groupId": group._id });

//       const studentNotif = await Notification.create({
//         userId,
//         type: "group_invite",
//         message: `You registered for "${session.title}". Join the group chat to stay updated!`,
//         meta: {
//           groupId: group._id,
//           groupName: group.name,
//           sessionId: session._id,
//           sessionTitle: session.title,
//         },
//       });
//       // Push live notification to student
//       const { onlineUsers } = require("../socket/socket");
//       const studentSocket = onlineUsers.get(userId.toString());
//       if (studentSocket) {
//         const io = req.app.get("io");
//         if (io) io.to(studentSocket).emit("notification:new", studentNotif);
//       }
//     }

//     // Push live notification to alumni
//     if (alumniProfile) {
//       const alumniNotif = await Notification.findOne({ userId: alumniProfile.userId, type: "session_booking" }).sort({ createdAt: -1 });
//       const { onlineUsers } = require("../socket/socket");
//       const alumniSocket = onlineUsers.get(alumniProfile.userId.toString());
//       if (alumniSocket && alumniNotif) {
//         const io = req.app.get("io");
//         if (io) io.to(alumniSocket).emit("notification:new", alumniNotif);
//       }
//     }

//     res.json({ success: true, message: "Successfully registered for the session" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

exports.registerSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }
    if (session.isPaid) {
      return res.status(400).json({
        success: false,
        message: "This session requires payment",
      });
    }

    // ✅ Status check
    if (session.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Session is not available for registration",
      });
    }

    // ✅ Deadline check
    if (session.deadline && new Date() > session.deadline) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline has passed",
      });
    }

    await registerStudent({ userId, sessionId, req });

    await redis.del(`student:${userId}:explore-sessions`);

    res.json({
      success: true,
      message: "Successfully registered for the session",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const Notification = require("../models/Notification");
    const GroupChat = require("../models/GroupChat");

    // Students see group_invite, session_cancelled, and new_session — never session_booking
    const notifications = await Notification.find({
      userId,
      type: {
        $in: [
          "group_invite",
          "session_cancelled",
          "new_session",
          "session_live",
          "session_completed",
        ],
      },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // For group_invite notifications, check if student already joined
    const enriched = await Promise.all(
      notifications.map(async (n) => {
        const obj = n.toObject();
        if (obj.type === "group_invite" && obj.meta?.groupId) {
          const group = await GroupChat.findOne({
            _id: obj.meta.groupId,
            "members.user": userId,
          });
          obj.meta.alreadyJoined = !!group;
        }
        return obj;
      }),
    );

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.json({ success: true, notifications: enriched, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const Notification = require("../models/Notification");
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.unregisterSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;
    const Notification = require("../models/Notification");
    const Alumni = require("../models/Alumni");
    const GroupChat = require("../models/GroupChat");
    const Message = require("../models/Message");

    const session = await Session.findById(sessionId);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    // Must be at least 1 hour before start time
    const now = new Date();
    const oneHourBefore = new Date(
      session.startTime.getTime() - 60 * 60 * 1000,
    );
    if (now >= oneHourBefore) {
      return res.status(400).json({
        success: false,
        message: "Cannot unregister within 1 hour of the session start time",
      });
    }

    const registration = await Registration.findOne({
      sessionId,
      studentId: userId,
      isActive: true,
    });

    const transaction = await Transaction.findOne({
      userId,
      sessionId,
    });
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: "You are not registered for this session",
      });
    }

    // 💳 REFUND LOGIC
    if (transaction && transaction.status === "paid") {
      if (!transaction.razorpayPaymentId) {
        return res.status(400).json({
          success: false,
          message: "No payment found",
        });
      }

      registration.isActive = false;
      await registration.save();

      // 🟡 STEP 1: mark pending
      transaction.status = "refund_pending";
      await transaction.save();

      try {
        await razorpay.payments.refund(transaction.razorpayPaymentId, {
          amount: session.price * 100, // in paise
        });
        // webhook will update to "refunded"
      } catch (err) {
        transaction.status = "paid"; // rollback
        await transaction.save();
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Refund failed. Please try again.",
        });
      }

      // Decrement seats and remove from group even for refund_pending
    } else {
      registration.isActive = false;
      await registration.save();
    }

    await Session.findByIdAndUpdate(sessionId, {
      $inc: { currentSeats: -1 },
      $pull: { bookedStudents: userId },
    });

    const studentUser = await User.findById(userId).select("name");
    const studentName = studentUser?.name || "A student";

    // Remove student from the session group and post a system message
    const group = await GroupChat.findOne({ sessionId, isActive: true });
    if (group) {
      const wasMember = group.members.some(
        (m) => m.user.toString() === userId.toString(),
      );
      if (wasMember) {
        group.members = group.members.filter(
          (m) => m.user.toString() !== userId.toString(),
        );
        await group.save();

        // Post system message in the group
        const leaveMsg = await Message.create({
          senderId: userId,
          groupId: group._id,
          type: "group",
          content: `${studentName} left the group`,
          isSystem: true,
          readBy: [],
        });
        const populatedLeave = await leaveMsg.populate("senderId", "name role");
        const io = req.app.get("io");
        if (io)
          io.to(`group:${group._id}`).emit("group:receive", populatedLeave);
      }

      // Remove group_invite notifications for this student
      await Notification.deleteMany({
        userId,
        type: "group_invite",
        "meta.groupId": group._id,
      });
    }

    // Notify alumni about unregistration
    const alumniProfile = await Alumni.findOne({
      userId: session.alumniId,
    }).select("userId");
    if (alumniProfile) {
      const alumniNotif = await Notification.create({
        userId: alumniProfile.userId,
        type: "session_booking",
        message: `${studentName} unregistered from your session "${session.title}"`,
        meta: {
          sessionId: session._id,
          sessionTitle: session.title,
          studentId: userId,
          studentName,
        },
      });
      const io = req.app.get("io");
      if (io)
        io.to(`user:${alumniProfile.userId}`).emit(
          "notification:new",
          alumniNotif,
        );
    }

    res.json({
      success: true,
      message:
        transaction?.status === "refund_pending"
          ? "Unregistered successfully. Refund will be processed within 5–7 working days."
          : "Successfully unregistered from the session",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const GroupChat = require("../models/GroupChat");
    const Notification = require("../models/Notification");
    const Message = require("../models/Message");

    const group = await GroupChat.findOne({ _id: groupId, isActive: true });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    const alreadyMember = group.members.some(
      (m) => m.user.toString() === userId,
    );
    if (alreadyMember) {
      return res.json({ success: true, message: "Already a member", group });
    }

    group.members.push({ user: userId, role: "member" });
    await group.save();

    // Mark the group_invite notification as read
    await Notification.updateMany(
      { userId, type: "group_invite", "meta.groupId": groupId },
      { isRead: true },
    );

    // Post system message: "X joined the group"
    const studentUser = await User.findById(userId).select("name");
    const joinMsg = await Message.create({
      senderId: userId,
      groupId: group._id,
      type: "group",
      content: `${studentUser?.name || "A student"} joined the group by registering for the session`,
      isSystem: true,
      readBy: [],
    });
    const populatedJoin = await joinMsg.populate("senderId", "name role");
    const io = req.app.get("io");
    if (io) {
      io.to(`group:${group._id}`).emit("group:receive", populatedJoin);
      // Make the joining student's socket join the room immediately
      io.in(`user:${userId}`).socketsJoin(`group:${group._id}`);
    }

    await group.populate("members.user", "name role");
    res.json({
      success: true,
      message: `You joined "${group.name}" successfully`,
      group,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    if (session.status !== "live")
      return res
        .status(400)
        .json({ success: false, message: "Session is not currently live" });

    const registration = await Registration.findOne({
      sessionId,
      studentId: userId,
    });
    if (!registration)
      return res.status(403).json({
        success: false,
        message: "You are not registered for this session",
      });
    if (registration.attended)
      return res
        .status(400)
        .json({ success: false, message: "Attendance already marked" });

    // Only allow marking within first 30 minutes of actual start
    const now = new Date();
    const elapsed = (now - new Date(session.actualStartTime)) / 60000;
    if (elapsed > 30)
      return res.status(400).json({
        success: false,
        message: "Attendance window has closed (first 30 minutes only)",
      });

    await Registration.findByIdAndUpdate(registration._id, { attended: true });

    res.json({ success: true, message: "Attendance marked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getSessionMeetLink = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    if (session.status !== "live")
      return res
        .status(400)
        .json({ success: false, message: "Session is not live yet" });

    const registration = await Registration.findOne({
      sessionId,
      studentId: userId,
      isActive: true,
    });
    if (!registration)
      return res.status(403).json({
        success: false,
        message: "You are not registered for this session",
      });

    res.json({ success: true, meetLink: session.meetLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;
    const { rating, comment } = req.body;
    const Review = require("../models/Review");
    const Alumni = require("../models/Alumni");

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const session = await Session.findById(sessionId);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    if (session.status !== "completed")
      return res.status(400).json({
        success: false,
        message: "Reviews are only allowed after the session is completed",
      });

    const registration = await Registration.findOne({
      sessionId,
      studentId: userId,
      isActive: true,
    });
    if (!registration)
      return res.status(403).json({
        success: false,
        message: "You are not registered for this session",
      });

    // One review per student per session
    const existing = await Review.findOne({ sessionId, studentId: userId });
    if (existing)
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this session",
      });

    // alumniId on Session is Alumni profile _id; we need User _id for Review
    const alumniProfile = await Alumni.findById(session.alumniId);
    if (!alumniProfile)
      return res
        .status(404)
        .json({ success: false, message: "Alumni not found" });

    const review = await Review.create({
      sessionId,
      studentId: userId,
      alumniId: alumniProfile.userId,
      rating: Number(rating),
      comment: comment?.trim() || "",
    });

    // Update alumni aggregate rating
    const allReviews = await Review.find({ alumniId: alumniProfile.userId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Alumni.findByIdAndUpdate(session.alumniId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewsCount: allReviews.length,
    });

    // Populate student name for response
    const populated = await review.populate("studentId", "name");

    res
      .status(201)
      .json({ success: true, message: "Review submitted", review: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getSessionReviews = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const Review = require("../models/Review");

    const reviews = await Review.find({ sessionId })
      .populate("studentId", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const Review = require("../models/Review");
    const Alumni = require("../models/Alumni");

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const review = await Review.findById(reviewId);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    if (review.studentId.toString() !== userId)
      return res
        .status(403)
        .json({ success: false, message: "Not your review" });

    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment.trim();
    await review.save();

    // Recalculate alumni aggregate rating
    const allReviews = await Review.find({ alumniId: review.alumniId });
    const avgRating =
      allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Alumni.findOneAndUpdate(
      { userId: review.alumniId },
      {
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: allReviews.length,
      },
    );

    const populated = await review.populate("studentId", "name");
    res.json({ success: true, message: "Review updated", review: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const Review = require("../models/Review");
    const Alumni = require("../models/Alumni");

    const review = await Review.findById(reviewId);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    if (review.studentId.toString() !== userId)
      return res
        .status(403)
        .json({ success: false, message: "Not your review" });

    const alumniId = review.alumniId;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate alumni aggregate rating
    const allReviews = await Review.find({ alumniId });
    const avgRating = allReviews.length
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : 0;
    await Alumni.findOneAndUpdate(
      { userId: alumniId },
      {
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: allReviews.length,
      },
    );

    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

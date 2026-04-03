const Registration = require("../models/Registration");
const Transaction = require("../models/Transaction");
const Session = require("../models/Session");
const Notification = require("../models/Notification");
const Alumni = require("../models/Alumni");
const GroupChat = require("../models/GroupChat");
const User = require("../models/User");
const { onlineUsers } = require("../socket/socket");

const registerStudent = async ({
  userId,
  sessionId,
  req,
  razorpayPaymentId,
}) => {
  const session = await Session.findById(sessionId);
  if (!session) throw new Error("Session not found");

  if (session.status !== "scheduled") {
    throw new Error("Session is not available for booking");
  }

  const now = new Date();
  if (session.deadline && now > session.deadline) {
    throw new Error("Registration deadline has passed");
  }

  const existing = await Registration.findOne({ sessionId, studentId: userId });
  if (existing && existing.isActive) {
    throw new Error("Already registered for this session");
  }

  if (existing && !existing.isActive) {
    existing.isActive = true;
    await existing.save();
  } else {
    await Registration.create({
      sessionId,
      studentId: userId,
      isActive: true,
    });
  }

  await Session.findByIdAndUpdate(sessionId, {
    $inc: { currentSeats: 1 },
    $addToSet: { bookedStudents: userId },
  });

  const studentUser = await User.findById(userId).select("name");

  // Notify the alumni about the new registration
  const alumniProfile = await Alumni.findById(session.alumniId).select(
    "userId",
  );
  if (alumniProfile) {
    await Notification.create({
      userId: alumniProfile.userId,
      type: "session_booking",
      message: `${studentUser?.name || "A student"} registered for your session "${session.title}"`,
      meta: {
        sessionId: session._id,
        sessionTitle: session.title,
        studentId: userId,
        studentName: studentUser?.name,
      },
    });
  }

  // Find the group for this session and notify the student to join
  const group = await GroupChat.findOne({ sessionId, isActive: true });
  if (group) {
    // Remove student from group if they were previously a member (e.g. re-registration after unregister)
    const wasMember = group.members.some(
      (m) => m.user.toString() === userId.toString(),
    );
    if (wasMember) {
      group.members = group.members.filter(
        (m) => m.user.toString() !== userId.toString(),
      );
      await group.save();
    }

    // Delete any old group_invite notification for this group so a fresh unread one is created
    await Notification.deleteMany({
      userId,
      type: "group_invite",
      "meta.groupId": group._id,
    });

    const studentNotif = await Notification.create({
      userId,
      type: "group_invite",
      message: `You registered for "${session.title}". Join the group chat to stay updated!`,
      meta: {
        groupId: group._id,
        groupName: group.name,
        sessionId: session._id,
        sessionTitle: session.title,
      },
    });
    // Push live notification to student
    const studentSocket = onlineUsers.get(userId.toString());
    if (studentSocket) {
      const io = req.app.get("io");
      if (io) {
        io.to(studentSocket).emit("notification:new", studentNotif);
        // Make the student's socket join the group room immediately
        // so they receive real-time messages without needing to reconnect
        io.in(studentSocket).socketsJoin(`group:${group._id}`);
      }
    }
  }

  // Push live notification to alumni
  if (alumniProfile) {
    const alumniNotif = await Notification.findOne({
      userId: alumniProfile.userId,
      type: "session_booking",
    }).sort({ createdAt: -1 });

    const alumniSocket = onlineUsers.get(alumniProfile.userId.toString());
    if (alumniSocket && alumniNotif) {
      const io = req.app.get("io");
      if (io) io.to(alumniSocket).emit("notification:new", alumniNotif);
    }
  }

  return true;
};

module.exports = registerStudent;

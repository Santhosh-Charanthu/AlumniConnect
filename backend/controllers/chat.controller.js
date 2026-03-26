const Message = require("../models/Message");
const GroupChat = require("../models/GroupChat");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");

// ── Direct Messages ──────────────────────────────────────────────────────────

exports.getDMHistory = async (req, res) => {
  try {
    const me = req.user.userId;
    const other = req.params.userId;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      type: "direct",
      $or: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("senderId", "name role");

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDMConversations = async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          type: "direct",
          $or: [{ senderId: me }, { receiverId: me }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$senderId", me] }, "$receiverId", "$senderId"] },
          lastMessage: { $first: "$$ROOT" },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiverId", me] }, { $eq: ["$isRead", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { "user.password": 0 } },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Group Chats ──────────────────────────────────────────────────────────────

exports.createGroup = async (req, res) => {
  try {
    const { name, description, memberIds, sessionId } = req.body;
    const me = req.user.userId;

    const members = [
      { user: me, role: "admin" },
      ...(memberIds || []).filter((id) => id !== me).map((id) => ({ user: id, role: "member" })),
    ];

    const group = await GroupChat.create({
      name,
      description,
      createdBy: me,
      members,
      sessionId: sessionId || null,
    });

    await group.populate("members.user", "name role");
    res.status(201).json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.userId);

    const groups = await GroupChat.find({ "members.user": me })
      .populate("members.user", "name role")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    // Count unread per group in one query
    const groupIds = groups.map((g) => g._id);
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          type: "group",
          groupId: { $in: groupIds },
          senderId: { $ne: me },
          readBy: { $nin: [me] },
        },
      },
      { $group: { _id: "$groupId", count: { $sum: 1 } } },
    ]);
    const unreadMap = {};
    unreadAgg.forEach((r) => { unreadMap[String(r._id)] = r.count; });

    const result = groups.map((g) => ({
      ...g.toObject(),
      unread: unreadMap[String(g._id)] || 0,
    }));

    res.json({ success: true, groups: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGroupHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const group = await GroupChat.findOne({ _id: groupId, "members.user": req.user.userId });
    if (!group) return res.status(403).json({ success: false, message: "Not a member" });

    const messages = await Message.find({ groupId, type: "group" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("senderId", "name role");

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const me = req.user.userId;

    const group = await GroupChat.findOne({ _id: groupId, "members.user": me });
    if (!group) return res.status(403).json({ success: false, message: "Not a member" });

    const isAdmin = group.members.find((m) => m.user.toString() === me && m.role === "admin");
    if (!isAdmin) return res.status(403).json({ success: false, message: "Admins only" });

    const existing = group.members.map((m) => m.user.toString());
    const toAdd = memberIds.filter((id) => !existing.includes(id));
    toAdd.forEach((id) => group.members.push({ user: id, role: "member" }));

    await group.save();
    await group.populate("members.user", "name role");
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    await GroupChat.findByIdAndUpdate(groupId, {
      $pull: { members: { user: req.user.userId } },
    });
    res.json({ success: true, message: "Left group" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.userId);

    // Unread DMs
    const unreadDMs = await Message.countDocuments({
      type: "direct",
      receiverId: me,
      isRead: false,
    });

    // Unread group messages (not sent by me, not in my readBy)
    const myGroups = await GroupChat.find({ "members.user": me }).select("_id");
    const groupIds = myGroups.map((g) => g._id);

    const unreadGroups = await Message.countDocuments({
      type: "group",
      groupId: { $in: groupIds },
      senderId: { $ne: me },
      readBy: { $nin: [me] },
    });

    res.json({
      success: true,
      unreadCount: unreadDMs + unreadGroups,
      unreadDMs,
      unreadGroups,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Upload chat media ────────────────────────────────────────────────────────

exports.uploadChatMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const mime = req.file.mimetype.toLowerCase();
    let mediaType = "image";
    let resourceType = "image";

    if (mime.startsWith("video/")) {
      mediaType = "video";
      resourceType = "video";
    } else if (mime === "application/pdf") {
      mediaType = "pdf";
      resourceType = "image";
    }

    const baseName = req.file.originalname.replace(/\s+/g, "_").replace(/\.[^/.]+$/, "");
    const publicId = `${Date.now()}-${baseName}`;

    // Upload buffer directly to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "alumniconnect/chat",
          resource_type: resourceType,
          public_id: publicId,
          use_filename: false,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({
      success: true,
      url: result.secure_url,
      mediaType,
      mediaName: req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Proxy download for chat media (avoids CORS on Cloudinary raw files) ──────

exports.proxyDownload = async (req, res) => {
  try {
    const { url, name } = req.query;
    if (!url) return res.status(400).json({ success: false, message: "Missing url" });

    const filename = name || "document.pdf";
    const axios = require("axios");
    const upstream = await axios.get(url, { responseType: "stream", maxRedirects: 5 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    if (upstream.headers["content-length"]) {
      res.setHeader("Content-Length", upstream.headers["content-length"]);
    }
    upstream.data.pipe(res);
  } catch (err) {
    const msg = err.response?.status
      ? `Upstream ${err.response.status}: ${err.response.statusText}`
      : err.message;
    console.error("proxyDownload error:", msg);
    if (!res.headersSent) res.status(500).json({ success: false, message: msg });
  }
};

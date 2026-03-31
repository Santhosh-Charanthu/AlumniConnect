const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const GroupChat = require("../models/GroupChat");

// Map userId -> socketId for online presence
const onlineUsers = new Map();

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3001",
      credentials: true,
    },
  });

  // ── Auth middleware ──────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // ── Connection ───────────────────────────────────────────────
  io.on("connection", async (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    // Broadcast online status
    io.emit("user:online", { userId });

    // Auto-join all group rooms this user belongs to (including inactive, to receive deactivation events)
    try {
      const groups = await GroupChat.find({ "members.user": userId }).select(
        "_id",
      );
      groups.forEach((g) => socket.join(`group:${g._id}`));
    } catch (err) {
      console.error("Socket join groups error:", err.message);
    }

    // ── Join a specific group room on demand ───────────────────
    // Called by the frontend when navigating to a group chat
    // to ensure the socket is in the room even if it was created after initial connect
    socket.on("group:join_room", async ({ groupId }) => {
      try {
        const group = await GroupChat.findOne({
          _id: groupId,
          "members.user": userId,
        }).select("_id");
        if (group) socket.join(`group:${group._id}`);
      } catch (err) {
        console.error("group:join_room error:", err.message);
      }
    });

    // ── Direct message ─────────────────────────────────────────
    socket.on(
      "dm:send",
      async ({ to, content, mediaUrl, mediaType, mediaName }, ack) => {
        try {
          if (!content?.trim() && !mediaUrl) {
            if (ack) ack({ success: false, error: "Empty message" });
            return;
          }
          const msg = await Message.create({
            senderId: userId,
            receiverId: to,
            type: "direct",
            content: content?.trim() || "",
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            mediaName: mediaName || null,
          });

          const populated = await msg.populate("senderId", "name role");

          // Deliver to recipient if online
          const recipientSocket = onlineUsers.get(to);
          if (recipientSocket) {
            io.to(recipientSocket).emit("dm:receive", populated);
          }

          // Echo back to sender
          socket.emit("dm:receive", populated);

          if (ack) ack({ success: true, message: populated });
        } catch (err) {
          if (ack) ack({ success: false, error: err.message });
        }
      },
    );

    // ── Group message ──────────────────────────────────────────
    socket.on(
      "group:send",
      async ({ groupId, content, mediaUrl, mediaType, mediaName }, ack) => {
        try {
          // Verify sender is a member
          const group = await GroupChat.findOne({
            _id: groupId,
            "members.user": userId,
            isActive: true,
          });
          if (!group) {
            if (ack)
              ack({ success: false, error: "Not a member of this group" });
            return;
          }

          if (!content?.trim() && !mediaUrl) {
            if (ack) ack({ success: false, error: "Empty message" });
            return;
          }

          const msg = await Message.create({
            senderId: userId,
            groupId,
            type: "group",
            content: content?.trim() || "",
            readBy: [userId],
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            mediaName: mediaName || null,
          });

          // Update group's lastMessage
          await GroupChat.findByIdAndUpdate(groupId, {
            lastMessage: msg._id,
            lastMessageAt: msg.createdAt,
          });

          const populated = await msg.populate("senderId", "name role");

          // Broadcast to everyone in the room (including sender)
          io.to(`group:${groupId}`).emit("group:receive", populated);

          if (ack) ack({ success: true, message: populated });
        } catch (err) {
          if (ack) ack({ success: false, error: err.message });
        }
      },
    );

    // ── Mark DMs as read ───────────────────────────────────────
    socket.on("dm:read", async ({ from }) => {
      await Message.updateMany(
        { senderId: from, receiverId: userId, isRead: false },
        { isRead: true },
      );
      const senderSocket = onlineUsers.get(from);
      if (senderSocket) {
        io.to(senderSocket).emit("dm:read_ack", { by: userId });
      }
    });

    // ── Mark group messages as read ────────────────────────────
    socket.on("group:read", async ({ groupId }) => {
      try {
        // Find messages not yet read by this user
        const unread = await Message.find({
          groupId,
          type: "group",
          readBy: { $ne: userId },
        }).select("_id senderId readBy");

        if (unread.length === 0) return;

        await Message.updateMany(
          { groupId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } },
        );

        // Get total member count for this group
        const group = await GroupChat.findById(groupId).select("members");
        const totalMembers = group?.members?.length || 0;

        // Notify senders whose messages are now fully read
        const senderIds = [
          ...new Set(unread.map((m) => m.senderId.toString())),
        ];
        for (const senderId of senderIds) {
          const senderSocket = onlineUsers.get(senderId);
          if (senderSocket) {
            io.to(senderSocket).emit("group:read_ack", {
              groupId,
              readBy: userId,
              totalMembers,
            });
          }
        }
      } catch (err) {
        console.error("group:read error:", err.message);
      }
    });

    // ── Edit message ───────────────────────────────────────────
    socket.on("message:edit", async ({ messageId, content }, ack) => {
      try {
        const msg = await Message.findOne({ _id: messageId, senderId: userId });
        if (!msg) {
          if (ack)
            ack({ success: false, error: "Message not found or not yours" });
          return;
        }
        msg.content = content.trim();
        msg.edited = true;
        await msg.save();

        const populated = await msg.populate("senderId", "name role");
        const event = msg.type === "group" ? "group:receive" : "dm:receive";

        if (msg.type === "group") {
          io.to(`group:${msg.groupId}`).emit("message:edited", populated);
        } else {
          const recipientSocket = onlineUsers.get(msg.receiverId.toString());
          if (recipientSocket)
            io.to(recipientSocket).emit("message:edited", populated);
          socket.emit("message:edited", populated);
        }

        if (ack) ack({ success: true, message: populated });
      } catch (err) {
        if (ack) ack({ success: false, error: err.message });
      }
    });

    // ── Delete message ─────────────────────────────────────────
    socket.on("message:delete", async ({ messageId }, ack) => {
      try {
        const msg = await Message.findOne({ _id: messageId, senderId: userId });
        if (!msg) {
          if (ack)
            ack({ success: false, error: "Message not found or not yours" });
          return;
        }

        const groupId = msg.groupId;
        const receiverId = msg.receiverId;
        await Message.findByIdAndDelete(messageId);

        if (groupId) {
          io.to(`group:${groupId}`).emit("message:deleted", { messageId });
        } else {
          const recipientSocket = onlineUsers.get(receiverId?.toString());
          if (recipientSocket)
            io.to(recipientSocket).emit("message:deleted", { messageId });
          socket.emit("message:deleted", { messageId });
        }

        if (ack) ack({ success: true });
      } catch (err) {
        if (ack) ack({ success: false, error: err.message });
      }
    });

    // ── Typing indicators ──────────────────────────────────────
    socket.on("typing:start", ({ to, groupId }) => {
      if (groupId) {
        socket.to(`group:${groupId}`).emit("typing:start", { userId, groupId });
      } else if (to) {
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket)
          io.to(recipientSocket).emit("typing:start", { userId });
      }
    });

    socket.on("typing:stop", ({ to, groupId }) => {
      if (groupId) {
        socket.to(`group:${groupId}`).emit("typing:stop", { userId, groupId });
      } else if (to) {
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket)
          io.to(recipientSocket).emit("typing:stop", { userId });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("user:offline", { userId });
    });
  });

  return io;
}

module.exports = { initSocket, onlineUsers };

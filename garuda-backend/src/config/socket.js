const GroupMessage = require("../models/GroupMessage");


let io;

// ✅ store live ride info in memory
const groupLive = {};

const initSocket = (server) => {
  io = require("socket.io")(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    /* =========================
       JOIN GROUP
    ========================= */
    socket.on("join-group", ({ groupId, userId, userName, role }) => {
  if (!groupId || !userId) return;

  socket.join(groupId);

  socket.groupId = groupId;
  socket.userId = userId;
  socket.userName = userName;

  if (!groupLive[groupId]) {
    groupLive[groupId] = { leader: null, members: {} };
  }

  // ✅ differentiate created vs joined
  if (role === "leader") {
    groupLive[groupId].leader = { userId, name: userName };
    console.log(`👑 ${userName} created group ${groupId}`);
  } else {
    console.log(`✅ ${userName} joined group ${groupId}`);
  }

  socket.to(groupId).emit("member-joined", { userId, userName });

  socket.emit("live-state", {
    leader: groupLive[groupId].leader,
    members: groupLive[groupId].members,
  });
});



    /* =========================
       MEMBER LOCATION
    ========================= */
    socket.on("member-location", ({ groupId, userId, userName, lat, lng, heading }) => {
      if (!groupId || !userId || lat == null || lng == null) return;

      if (!groupLive[groupId]) groupLive[groupId] = { leader: null, members: {} };

      groupLive[groupId].members[userId] = {
        userId,
        name: userName || "User",
        lat,
        lng,
        heading: heading || 0,
        updatedAt: Date.now(),
      };

      // broadcast to group
      io.to(groupId).emit("member-location-update", groupLive[groupId].members[userId]);
    });

    /* =========================
       LE Fletcher—leader location
    ========================= */
    socket.on("leader-location", ({ groupId, userId, userName, lat, lng, heading }) => {
      if (!groupId || !userId || lat == null || lng == null) return;

      if (!groupLive[groupId]) groupLive[groupId] = { leader: null, members: {} };

      groupLive[groupId].leader = {
        userId,
        name: userName || "Leader",
        lat,
        lng,
        heading: heading || 0,
        updatedAt: Date.now(),
      };

      io.to(groupId).emit("leader-location-update", groupLive[groupId].leader);
    });

    /* =========================
       GROUP CHAT MESSAGE
    ========================= */


    /* =========================
   GROUP CHAT MESSAGE (SAVE + EMIT)
========================= */
socket.on("group-message", async ({ groupId, text, senderId, senderName, type }) => {
  try {
    if (!groupId || !text) return;

    const saved = await GroupMessage.create({
      groupId,
      senderId: senderId || socket.userId || null,
      senderName: senderName || socket.userName || "User",
      text,
      type: type || "user",
    });

    io.to(groupId).emit("group-message", {
      _id: saved._id,
      text: saved.text,
      senderId: saved.senderId ? String(saved.senderId) : null,
      senderName: saved.senderName,
      type: saved.type,
      poll: saved.poll || null,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.log("❌ group-message error:", err.message);
  }
});


    /* =========================
       DISCONNECT
    ========================= */
    socket.on("disconnect", () => {
      const groupId = socket.groupId;
      const userId = socket.userId;

      console.log(`❌ Socket disconnected: ${socket.id}`);

      if (groupId && userId && groupLive[groupId]) {
        // remove member from live members map
        delete groupLive[groupId].members[userId];

        socket.to(groupId).emit("member-left", { userId });

        // optional cleanup group
        const hasLeader = !!groupLive[groupId].leader;
        const membersCount = Object.keys(groupLive[groupId].members).length;

        if (!hasLeader && membersCount === 0) {
          delete groupLive[groupId];
        }
      }
    });
    /* =========================
   GROUP SETUP UPDATED
========================= */
socket.on("group-setup-updated", ({ groupId, setup, updatedBy }) => {
  if (!groupId || !setup) return;
  socket.to(groupId).emit("group-setup-updated", { setup, updatedBy });
});

socket.on("create-poll", async ({ groupId, poll }) => {
  try {
    if (!groupId || !poll) return;

    const saved = await GroupMessage.create({
      groupId,
      senderId: socket.userId,                 // ✅ MUST NOT BE NULL
      senderName: socket.userName || "Leader", // ✅
      text: `📊 Poll: ${poll.question}`,
      type: "poll",
      poll,
    });

    io.to(groupId).emit("group-message", {
      _id: saved._id,
      text: saved.text,
      senderId: String(saved.senderId),   // ✅ send as string
      senderName: saved.senderName,
      type: "poll",
      poll: saved.poll,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.log("❌ create-poll error:", err.message);
  }
});




  });
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };

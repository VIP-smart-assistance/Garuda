const express = require("express");
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const auth = require("../middleware/auth");
const { getIO } = require("../config/socket");

const router = express.Router();

/* =========================
   GENERATE 4-DIGIT GROUP ID
========================= */
const generateGroupId = async () => {
  let id;
  let exists = true;

  while (exists) {
    id = Math.floor(1000 + Math.random() * 9000).toString();
    const group = await Group.findOne({ groupId: id });
    exists = !!group;
  }

  return id;
};

/* =========================
   CREATE GROUP
========================= */
router.post("/create", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Group name required" });

    const groupId = await generateGroupId();

    const group = await Group.create({
      groupId,
      name,
      leader: req.user.id,
      members: [req.user.id],
      destination: null,
      destinationSet: false,
    });

    /* 🔥 SYSTEM MESSAGE: GROUP CREATED */
    const message = await GroupMessage.create({
      groupId,
      senderId: req.user.id,
      senderName: req.user.name,
      text: `${req.user.name} created the ride`,
      type: "system",
    });

    /* 🔥 REAL-TIME EMIT */
    getIO().to(groupId).emit("group-message", {
      _id: message._id,
      text: message.text,
      senderId: null,
      senderName: "System",
      type: "system",
      createdAt: message.createdAt,
    });

    res.json({
      groupId,
      name: group.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   JOIN GROUP
========================= */
router.post("/join", auth, async (req, res) => {
  try {
    const { groupId } = req.body;

    const group = await Group.findOne({ groupId });
    if (!group)
      return res.status(404).json({ message: "Group not found" });

    const alreadyJoined = group.members.some(
      (id) => id.toString() === req.user.id
    );

    if (!alreadyJoined) {
      group.members.push(req.user.id);
      await group.save();

      /* 🔥 SYSTEM MESSAGE: USER JOINED */
      const message = await GroupMessage.create({
        groupId,
        senderId: req.user.id,
        senderName: req.user.name,
        text: `${req.user.name} joined the ride`,
        type: "system",
      });

      /* 🔥 REAL-TIME EMIT */
      getIO().to(groupId).emit("group-message", {
        _id: message._id,
        text: message.text,
        senderId: null,
        senderName: "System",
        type: "system",
        createdAt: message.createdAt,
      });
    }

  res.json({
  message: "Joined group successfully",
  group: {
    groupId: group.groupId,
    name: group.name,
    leaderId: group.leader,
    membersCount: group.members.length,
    destinationSet: group.destinationSet,
    destination: group.destination,
    isActive: group.isActive,
  }
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET MY GROUPS  (⚠️ MUST BE BEFORE :groupId)
========================= */
router.get("/my", auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .select("groupId name destination destinationSet isActive rideStarted members leader")
      .sort({ updatedAt: -1 });

    res.json(
      groups.map((g) => ({
        groupId: g.groupId,
        name: g.name,
        destination: g.destination,
        destinationSet: g.destinationSet,
        isActive: g.isActive,
        rideStarted: g.rideStarted || false,
        membersCount: g.members?.length || 1,

        leaderId: g.leader ? g.leader.toString() : null,
        isLeader: g.leader ? g.leader.toString() === req.user.id : false,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* =========================
   GET GROUP INFO
========================= */
router.get("/:groupId", auth, async (req, res) => {
  const group = await Group.findOne({ groupId: req.params.groupId })
    .populate("leader", "name")
    .populate("members", "name");

  if (!group)
    return res.status(404).json({ message: "Group not found" });

  res.json({
    groupId: group.groupId,
    name: group.name,
    leader: group.leader,
    members: group.members,
    destination: group.destination,
    destinationSet: group.destinationSet,
    isActive: group.isActive,
  });
});

/* =========================
   SET DESTINATION
========================= */
router.post("/set-destination", auth, async (req, res) => {
  try {
    const { groupId, destination } = req.body;

    if (!groupId || !destination)
      return res.status(400).json({ message: "Missing data" });

    const group = await Group.findOne({ groupId });
    if (!group)
      return res.status(404).json({ message: "Group not found" });

    if (group.leader.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Only leader can set destination" });

    group.destination = destination;
    group.destinationSet = true;
    await group.save();

    getIO().to(groupId).emit("destination-update", { destination });

    res.json({ message: "Destination set", destination });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   DELETE GROUP
========================= */
router.delete("/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.findOne({ groupId: req.params.groupId });
    if (!group)
      return res.status(404).json({ message: "Group not found" });

    if (group.leader.toString() !== req.user.id)
      return res.status(403).json({ message: "Not allowed" });

    await group.deleteOne();

    res.json({ message: "Group deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET GROUP CHAT HISTORY
========================= */
router.get("/:groupId/messages", auth, async (req, res) => {
  const messages = await GroupMessage.find({
    groupId: req.params.groupId,
  }).sort({ createdAt: 1 });

  res.json(messages);
});

module.exports = router;

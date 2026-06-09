// models/GroupMessage.js
const mongoose = require("mongoose");

const GroupMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: String,
      required: true,
      index: true, // 🔥 fast chat loading
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // 🔥 system messages
    },

    senderName: {
      type: String,
      default: "System",
    },

    text: {
      type: String,
      required: true,
    },

    type: {
      type: String,
        enum: ["system", "user", "poll"],
      default: "user",
    },
    poll: {
  type: Object,
  default: null,
},

  },
  { timestamps: true }
);

module.exports = mongoose.model("GroupMessage", GroupMessageSchema);

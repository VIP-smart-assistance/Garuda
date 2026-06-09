const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
  {
    groupId: {
      type: String,
      unique: true,
      required: true,
    },

    // 🔥 REQUIRED FOR MESSAGES + UI
    name: {
      type: String,
      required: true,
      trim: true,
    },

    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    destination: {
      lat: Number,
      lng: Number,
    },

    destinationSet: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    rideStarted: { type: Boolean, default: false }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", GroupSchema);

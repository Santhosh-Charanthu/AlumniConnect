const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    alumniId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    coverImage: {
      url: String,
      filename: String,
    },

    description: String,

    startTime: {
      type: Date,
      required: true,
    },

    deadline: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number, // minutes
      required: true,
    },

    price: {
      type: Number,
      default: 0,
    },
    
    isPaid: {
      type: Boolean,
      default: false,
    },

    maxSeats: Number,

    bookedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    currentSeats: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
    },

    rating: {
      type: Number,
      default: 0,
    },

    reviewsCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
    },

    meetLink: {
      type: String,
      default: null,
    },

    actualStartTime: {
      type: Date,
      default: null,
    },

    actualEndTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Session", sessionSchema);

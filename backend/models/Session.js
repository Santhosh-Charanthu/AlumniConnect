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

    duration: {
      type: Number, // minutes
      required: true,
    },

    price: {
      type: Number,
      default: 0,
    },

    meetLink: {
      type: String,
      required: true,
      select: false,
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
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Session", sessionSchema);

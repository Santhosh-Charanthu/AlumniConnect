const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return false;
          const parts = v.split("@");
          if (parts.length !== 2) return false;
          const domain = parts[1] ? parts[1].toLowerCase() : "";
          return domain.includes(".edu");
        },
        message: (props) =>
          `${props.value} is not a valid student email (domain must contain '.edu')`,
      },
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "alumni", "admin"],
      required: true,
    },

    college: {
      type: String,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },

    otpExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

const rateLimit = require("express-rate-limit");

module.exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 5,

  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

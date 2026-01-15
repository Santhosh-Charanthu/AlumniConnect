const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const { register, login } = require("../controllers/auth.controller");

router.post("/register", upload.single("profileImage"), register);
router.post("/login", login);

module.exports = router;

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const StudentProfile = require("../models/Student");
const AlumniProfile = require("../models/Alumni");
const cloudinary = require("../config/cloudinary");

// module.exports.register = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       password,
//       role,
//       college,
//       department,
//       batchYear,

//       // alumni fields
//       company,
//       jobTitle,
//       bio,
//       hourlyRate,
//       availability,
//       skills,

//       // student fields
//       interests,
//     } = req.body;

//     // 🔴 BASIC VALIDATION
//     if (!name || !email || !password || !role || !college) {
//       return res
//         .status(400)
//         .json({ message: "All required fields must be filled" });
//     }

//     // 🔴 ROLE VALIDATION
//     if (!["student", "alumni"].includes(role)) {
//       return res.status(400).json({ message: "Invalid role" });
//     }

//     // 🔴 IMAGE REQUIRED
//     if (!req.file) {
//       return res.status(400).json({ message: "Profile image is required" });
//     }

//     // 🔴 CHECK DUPLICATE USER
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({ message: "User already exists" });
//     }

//     // 🔐 HASH PASSWORD
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // 🖼️ IMAGE DATA
//     const profileImage = {
//       url: req.file.path,
//       filename: req.file.filename,
//     };

//     // 1️⃣ CREATE USER
//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//       college,
//     });

//     const savedUser = await newUser.save();

//     // 2️⃣ ROLE-SPECIFIC PROFILE CREATION
//     if (role === "student") {
//       const parsedInterests = interests ? JSON.parse(interests) : [];

//       const studentProfile = new StudentProfile({
//         userId: savedUser._id,
//         department,
//         batchYear,
//         interests: parsedInterests,
//         profileImage,
//       });

//       await studentProfile.save();
//     }

//     if (role === "alumni") {
//       const parsedSkills = skills ? JSON.parse(skills) : [];

//       const alumniProfile = new AlumniProfile({
//         userId: savedUser._id,
//         department,
//         batchYear,
//         company,
//         jobTitle,
//         bio,
//         hourlyRate,
//         availability,
//         skills: parsedSkills,
//         profileImage,
//       });

//       await alumniProfile.save();
//     }

//     // 3️⃣ CREATE JWT
//     const token = jwt.sign(
//       { userId: savedUser._id, role: savedUser.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // ✅ SUCCESS RESPONSE
//     res.status(201).json({
//       message: "Registration successful",
//       token,
//       user: {
//         id: savedUser._id,
//         name: savedUser.name,
//         role: savedUser.role,
//       },
//     });
//   } catch (err) {
//     console.error(err);

//     // 🧹 CLEANUP IMAGE IF ERROR AFTER UPLOAD
//     if (req.file?.filename) {
//       await cloudinary.uploader.destroy(req.file.filename);
//     }

//     res.status(500).json({ message: "Signup failed. Try again." });
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

module.exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      college,
      department,
      batchYear,

      company,
      jobTitle,
      bio,
      hourlyRate,
      availability,
      skills,

      interests,
    } = req.body;

    // 🔴 BASIC VALIDATION
    if (!name || !email || !password || !role || !college) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // 🔴 ROLE VALIDATION
    if (!["student", "alumni"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected",
      });
    }

    // 🔴 IMAGE REQUIRED
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    // 🔴 CHECK DUPLICATE USER
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🖼️ IMAGE DATA
    const profileImage = {
      url: req.file.path,
      filename: req.file.filename,
    };

    // 1️⃣ CREATE USER
    const savedUser = await new User({
      name,
      email,
      password: hashedPassword,
      role,
      college,
    }).save();

    // 2️⃣ ROLE-SPECIFIC PROFILE
    if (role === "student") {
      const parsedInterests = interests ? JSON.parse(interests) : [];

      await new StudentProfile({
        userId: savedUser._id,
        department,
        batchYear,
        interests: parsedInterests,
        profileImage,
      }).save();
    }

    if (role === "alumni") {
      const parsedSkills = skills ? JSON.parse(skills) : [];

      await new AlumniProfile({
        userId: savedUser._id,
        department,
        batchYear,
        company,
        jobTitle,
        bio,
        hourlyRate,
        availability,
        skills: parsedSkills,
        profileImage,
      }).save();
    }

    // 3️⃣ CREATE JWT
    const token = jwt.sign(
      { userId: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ SUCCESS FLASH MESSAGE
    return res.status(201).json({
      success: true,
      message: "Registration successful 🎉",
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        role: savedUser.role,
      },
    });
  } catch (err) {
    console.error(err);

    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message: firstError });
    }

    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }

    return res.status(500).json({
      success: false,
      message: "Signup failed. Please try again.",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful ✅",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

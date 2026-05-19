const Alumni = require("../models/Alumni");
const User = require("../models/User");
const Student = require("../models/Student");
const axios = require("axios");

exports.getMatchedAlumni = async (req, res) => {
  try {
    console.log("Backend Controller Hit");

    const userId = req.user.userId;

    // FETCH SINGLE STUDENT
    const student = await Student.findOne({
      userId: userId,
    }).select("interests");

    // FETCH ALL ALUMNI
    const alumni = await Alumni.find();

    // CLEAN INTERESTS ARRAY
    const formattedInterests = student.interests;

    // CLEAN ALUMNI SKILLS
    const formattedAlumni = alumni.map((a) => ({
      id: a._id,

      skills: a.skills,
    }));

    // FINAL PAYLOAD
    const payload = {
      studentInterests: formattedInterests,
      alumni: formattedAlumni,
    };

    // console.log(payload);

    // SEND TO PYTHON
    const response = await axios.post(
      `${process.env.AI_SERVICES_URL}/recommend`,
      payload,
    );

    const recommendations = response.data;
    console.log(recommendations);

    formattedRecommendations = await Promise.all(
      recommendations.map(async (r) => {
        const alumni = await Alumni.findById(r.alumniId).populate("userId");
        return {
          alumniId: alumni._id,
          name: alumni.userId.name,
          skills: alumni.skills,
          image: alumni.profileImage,
          company: alumni.company,
          jobTitle: alumni.jobTitle,
          score: r.matchPercentage,
        };
      }),
    );

    res.json({
      success: true,
      recommendations: formattedRecommendations,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

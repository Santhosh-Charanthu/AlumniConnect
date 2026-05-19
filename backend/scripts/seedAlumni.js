/**
 * Seed script: inserts 200 alumni profiles directly into MongoDB.
 * Run from the backend folder:
 *   node scripts/seedAlumni.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const AlumniProfile = require("../models/Alumni");

// ── Data pools ────────────────────────────────────────────────────────────────

const firstNames = [
  "Aarav",
  "Aditya",
  "Akash",
  "Amit",
  "Ananya",
  "Anjali",
  "Arjun",
  "Aryan",
  "Ayesha",
  "Bhavya",
  "Chetan",
  "Deepa",
  "Divya",
  "Farhan",
  "Gaurav",
  "Harini",
  "Ishaan",
  "Jaya",
  "Karan",
  "Kavya",
  "Keerthi",
  "Kunal",
  "Lakshmi",
  "Manish",
  "Meera",
  "Mihir",
  "Nandini",
  "Nikhil",
  "Nisha",
  "Pooja",
  "Pradeep",
  "Pranav",
  "Priya",
  "Rahul",
  "Rajesh",
  "Ravi",
  "Rohit",
  "Sachin",
  "Sahana",
  "Sanjay",
  "Sanya",
  "Shreya",
  "Siddharth",
  "Sneha",
  "Suresh",
  "Tanvi",
  "Tejas",
  "Uday",
  "Varun",
  "Vidya",
];

const lastNames = [
  "Agarwal",
  "Bhat",
  "Chakraborty",
  "Chandra",
  "Desai",
  "Deshpande",
  "Ghosh",
  "Gupta",
  "Iyer",
  "Jain",
  "Joshi",
  "Kapoor",
  "Kaur",
  "Khan",
  "Kumar",
  "Malhotra",
  "Mehta",
  "Mishra",
  "Nair",
  "Patel",
  "Pillai",
  "Rao",
  "Reddy",
  "Sharma",
  "Singh",
  "Sinha",
  "Srinivasan",
  "Tiwari",
  "Verma",
  "Yadav",
];

const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Data Science",
  "Biotechnology",
  "Chemical Engineering",
  "MBA",
];

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Infosys",
  "TCS",
  "Wipro",
  "Accenture",
  "Cognizant",
  "IBM",
  "Oracle",
  "Flipkart",
  "Swiggy",
  "Zomato",
  "Razorpay",
  "CRED",
  "Freshworks",
  "Zoho",
  "Byju's",
  "Ola",
  "Paytm",
  "PhonePe",
  "Meesho",
  "Nykaa",
  "Zepto",
  "Groww",
];

const jobTitles = [
  "Software Engineer",
  "Senior Software Engineer",
  "Full Stack Developer",
  "Backend Engineer",
  "Frontend Engineer",
  "Data Scientist",
  "ML Engineer",
  "DevOps Engineer",
  "Cloud Architect",
  "Product Manager",
  "Engineering Manager",
  "Tech Lead",
  "Solutions Architect",
  "QA Engineer",
  "Mobile Developer",
];

const skillSets = [
  ["JavaScript", "React", "Node.js", "MongoDB"],
  ["Python", "Django", "PostgreSQL", "Docker"],
  ["Java", "Spring Boot", "Microservices", "Kubernetes"],
  ["C++", "Algorithms", "System Design", "Linux"],
  ["Data Science", "Machine Learning", "TensorFlow", "Python"],
  ["AWS", "Terraform", "CI/CD", "DevOps"],
  ["React Native", "Flutter", "iOS", "Android"],
  ["SQL", "Power BI", "Tableau", "Data Analytics"],
  ["Go", "gRPC", "Distributed Systems", "Redis"],
  ["TypeScript", "Next.js", "GraphQL", "REST APIs"],
];

const availabilities = ["weekdays", "weekends", "evenings", "flexible"];

const colleges = ["Vishnu Institute of Technology"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  await connectDB();

  const hashedPassword = await bcrypt.hash("Alumni@123", 10);
  const TOTAL = 200;
  let created = 0;

  console.log(`\nSeeding ${TOTAL} alumni profiles...\n`);

  for (let i = 0; i < TOTAL; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const name = `${firstName} ${lastName}`;

    // Unique .edu email
    const tag = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`;
    const email = `${tag}@vishnu.edu.in`;

    const college = "Vishnu Institute of Technology";
    const department = pick(departments);
    const batchYear = rand(2010, 2022);
    const company = pick(companies);
    const jobTitle = pick(jobTitles);
    const skills = pick(skillSets);
    const hourlyRate = rand(200, 2000);
    const availability = pick(availabilities);
    const bio = `${name} is a ${jobTitle} at ${company} with expertise in ${skills.slice(0, 2).join(" and ")}.`;

    try {
      // Skip if email already exists
      const exists = await User.findOne({ email });
      if (exists) continue;

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "alumni",
        college,
        isVerified: true,
      });

      await AlumniProfile.create({
        userId: user._id,
        department,
        batchYear,
        company,
        jobTitle,
        bio,
        skills,
        hourlyRate,
        availability,
        profileImage: {
          url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          filename: `avatar_${user._id}`,
        },
        rating: 0,
        totalSessions: rand(0, 40),
        about: bio,
      });

      created++;
      if (created % 20 === 0) console.log(`  ✅ ${created} alumni created...`);
    } catch (err) {
      console.error(`  ⚠️  Skipped ${email}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Done! ${created} alumni profiles inserted.\n`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

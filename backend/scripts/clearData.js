require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const collections = [
  "sessions",
  "notifications",
  "messages",
  "groupchats",
  "payments",
  "registrations",
  "reviews",
  "bookings",
  "transactions",
];

async function clearData() {
  await mongoose.connect(process.env.DB_URL);
  console.log("Connected to MongoDB");

  for (const col of collections) {
    try {
      const result = await mongoose.connection.db
        .collection(col)
        .deleteMany({});
      console.log(`✓ Cleared ${col}: ${result.deletedCount} documents removed`);
    } catch (err) {
      console.log(`⚠ Skipped ${col}: ${err.message}`);
    }
  }

  console.log("\nDone. Users (students + alumni) are preserved.");
  await mongoose.disconnect();
}

clearData().catch(console.error);

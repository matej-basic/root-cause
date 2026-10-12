// Run once by entrypoint.sh, before server.js starts, once mongod is up.
//
// Seeds the `fleetchat` database with two accounts: an admin account whose
// password is random and never shared, and a demo dispatcher account a
// student can use to exercise a normal login. server.js never reads this
// file or its connection logic for the flag; the flag lives at FLAG_PATH and
// is only reachable by logging in as the seeded admin.

const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";

async function connectWithRetry(maxTries = 30, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i < maxTries; i++) {
    try {
      return await MongoClient.connect(MONGO_URL);
    } catch (err) {
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

async function main() {
  const client = await connectWithRetry();
  try {
    const db = client.db("fleetchat");
    const users = db.collection("users");
    await users.deleteMany({});
    await users.insertMany([
      {
        user: "admin",
        pass: crypto.randomBytes(18).toString("base64"),
        role: "admin",
      },
      {
        user: "dispatcher",
        pass: "ChangeMe2024!",
        role: "dispatcher",
      },
    ]);
    console.log("Seeded fleetchat.users (admin + dispatcher).");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

/**
 * One-time migration: add `username` to existing User documents that don't have one.
 * Generates a slug from fullName + numeric suffix for uniqueness.
 *
 * Run: node backend/src/seeds/migrate-add-usernames.js
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import User from "../models/user.model.js";

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const usersWithoutUsername = await User.find({
    $or: [{ username: { $exists: false } }, { username: null }, { username: "" }],
  });

  console.log(`Found ${usersWithoutUsername.length} users without username`);

  for (const user of usersWithoutUsername) {
    const base = user.fullName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 16);

    let candidate = base;
    let suffix = 0;
    while (true) {
      const existing = await User.findOne({ username: candidate });
      if (!existing || existing._id.toString() === user._id.toString()) break;
      suffix++;
      candidate = `${base}_${suffix}`;
    }

    user.username = candidate;
    await user.save();
    console.log(`  ${user.fullName} → @${candidate}`);
  }

  console.log("Migration complete");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

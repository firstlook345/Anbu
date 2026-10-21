import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import LoginDetail from "./models/LoginDetail.js";

async function checkLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const logs = await LoginDetail.find().sort({ timestamp: -1 });
    console.log(`\n=== 🔒 VERIFIED LOGS IN MONGODB (${logs.length} RECORDS) ===`);
    logs.forEach((l, i) => {
      console.log(`Log #${i + 1}:`);
      console.log(`  - Status:           ${l.status}`);
      console.log(`  - Account Email:    ${l.email}`);
      console.log(`  - Client IP:        ${l.ipAddress}`);
      console.log(`  - Hashed IP:        ${l.hashedIP}`);
      console.log(`  - SHA-256 Signature:${l.hashedDetails}`);
      console.log(`  - Timestamp:        ${l.timestamp}`);
      console.log("---------------------------------------------------------");
    });
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

checkLogs();

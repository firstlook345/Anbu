import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import LoginDetail from "../models/LoginDetail.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "127.0.0.1";
}

function createLoginHashes(email, ip, userAgent, timestamp, status) {
  const isoTime = timestamp.toISOString();
  const rawDetails = `EMAIL:${email}|IP:${ip}|UA:${userAgent}|TIME:${isoTime}|STATUS:${status}`;
  const hashedDetails = crypto.createHash("sha256").update(rawDetails).digest("hex");
  const hashedIP = crypto.createHash("sha256").update(ip || "127.0.0.1").digest("hex");
  return { hashedDetails, hashedIP };
}

async function recordLoginDetail({ userId, email, status, req }) {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "Unknown Browser/Client";
    const timestamp = new Date();
    const { hashedDetails, hashedIP } = createLoginHashes(
      email || "unknown",
      ipAddress,
      userAgent,
      timestamp,
      status
    );

    await LoginDetail.create({
      userId: userId || null,
      email: email ? email.toLowerCase() : "unknown",
      status,
      ipAddress,
      hashedIP,
      userAgent,
      hashedDetails,
      timestamp,
    });
  } catch (err) {
    console.error("Failed to record login detail:", err.message);
  }
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required." });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      await recordLoginDetail({ userId: existing._id, email, status: "FAILED", req });
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      lastLogin: new Date(),
    });

    // Record hashed login details for successful registration
    await recordLoginDetail({ userId: user._id, email: user.email, status: "SUCCESS", req });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, isAdmin: user.isAdmin },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || "").trim();
    const cleanPassword = (password || "").trim();
    if (!cleanEmail || !cleanPassword) {
      if (cleanEmail) {
        await recordLoginDetail({ email: cleanEmail, status: "FAILED", req });
      }
      return res.status(400).json({ message: "Email and password required." });
    }

    const user = await User.findOne({ email: cleanEmail.toLowerCase() });
    if (!user) {
      await recordLoginDetail({ email: cleanEmail, status: "FAILED", req });
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!valid) {
      await recordLoginDetail({ userId: user._id, email: user.email, status: "FAILED", req });
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Record hashed login details for successful login
    await recordLoginDetail({ userId: user._id, email: user.email, status: "SUCCESS", req });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, email: user.email, isAdmin: user.isAdmin },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: { id: user._id, email: user.email, isAdmin: user.isAdmin, lastLogin: user.lastLogin } });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/auth/login-history (for logged-in user)
router.get("/login-history", requireAuth, async (req, res) => {
  try {
    const logs = await LoginDetail.find({ email: req.user.email.toLowerCase() })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/auth/admin/login-logs (for admins)
router.get("/admin/login-logs", requireAdmin, async (req, res) => {
  try {
    const logs = await LoginDetail.find({})
      .populate("userId", "email isAdmin")
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

export default router;

import mongoose from "mongoose";

const loginDetailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    required: true,
  },
  ipAddress: {
    type: String,
    default: "unknown",
  },
  hashedIP: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    default: "unknown",
  },
  hashedDetails: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("LoginDetail", loginDetailSchema);

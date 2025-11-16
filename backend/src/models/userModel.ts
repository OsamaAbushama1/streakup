import mongoose, { Schema } from "mongoose";
import { FIXED_TRACKS } from "../constants";

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/,
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isOnline: { type: Boolean, default: false }, // أضف هذا الحقل
  lastActive: { type: Date, default: Date.now },
  track: {
    type: String,
    required: true,
    validate: {
      validator: async function (value: string) {
        const track = await mongoose.model("Track").findOne({ name: value });
        return FIXED_TRACKS.includes(value) || !!track;
      },
      message: "Invalid track",
    },
  },
  skillLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced"] },
  profilePicture: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  role: {
    type: String,
    enum: ["User", "Admin", "SuperAdmin"],
    default: "User",
  },
  streak: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  completedChallenges: { type: Number, default: 0 },
  rank: {
    type: String,
    enum: ["Bronze", "Silver", "Gold", "Platinum"],
    default: "Bronze",
  },
  badges: [{ type: String }],
  challenges: [{ type: Schema.Types.ObjectId, ref: "Challenge" }],
  startedChallenges: [{ type: Schema.Types.ObjectId, ref: "Challenge" }],
  completedProjects: { type: Number, default: 0 },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  banUntil: { type: Date, default: null },
  emailNotifications: { type: Boolean, default: true },
  streakSavers: { type: Number, default: 0 },
  challengeBoosts: { type: Number, default: 0 },

  // أضف هذا الحقل
  certificates: [
    {
      rank: { type: String, enum: ["Silver", "Gold", "Platinum"] },
      unlocked: { type: Boolean, default: false },
      progress: { type: Number, default: 0 }, // 0-100%
      paid: { type: Boolean, default: false },
      certificateId: String,
      issuedAt: Date,
    },
  ],
});
userSchema.index({ completedProjects: 1 });

export default mongoose.model("User", userSchema);

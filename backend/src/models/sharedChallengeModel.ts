import mongoose, { Schema } from "mongoose";

const sharedChallengeSchema = new Schema({
  sharedChallengeId: { type: String, required: true, unique: true },
  challenge: { type: Schema.Types.ObjectId, ref: "Challenge", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  description: { type: String, required: true },
  images: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  viewedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  highlighted: { type: Boolean, default: false },
  highlightExpiresAt: { type: Date },
});

export default mongoose.model("SharedChallenge", sharedChallengeSchema);

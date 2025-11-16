import mongoose, { Schema } from "mongoose";

const challengeSchema = new Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
  },
  challengeId: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  duration: { type: Number, required: true, min: 1 },
  points: { type: Number, required: true, min: 0 },
  participants: { type: Number, default: 0 },
  overview: { type: String, required: true },
  challengeDetails: { type: String, required: true },
  challengeSteps: { type: String, required: true },
  requirements: { type: String, required: true },
  previewImages: { type: [String], default: [] },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  viewedBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  shared: { type: Boolean, default: false },
  project: { type: Schema.Types.ObjectId, ref: "Project", default: null },
});
challengeSchema.index({ category: 1, challengeId: 1 }, { unique: true });

export default mongoose.model("Challenge", challengeSchema);

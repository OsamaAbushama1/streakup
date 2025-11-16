import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema({
  name: { type: String, required: true },
  track: {
    type: String,

    required: true,
  },
  projectType: {
    type: String,
    enum: ["Mobile App", "Website", "Graphic Design", "Other"],
    required: true,
  },
  points: { type: Number, required: true, min: 0 },
  challengeCount: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

projectSchema.index({ name: 1, track: 1 }, { unique: true });

export default mongoose.model("Project", projectSchema);

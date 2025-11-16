import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
  sharedChallenge: {
    type: Schema.Types.ObjectId,
    ref: "SharedChallenge",
    required: true,
  },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  reports: [{ type: Schema.Types.ObjectId, ref: "User" }],
  status: {
    type: String,
    enum: ["pending", "resolved", "banned"],
    default: "pending",
  },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Comment", commentSchema);

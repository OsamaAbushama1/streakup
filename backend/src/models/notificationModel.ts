import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["like", "comment"],
    required: true,
  },
  sharedChallenge: {
    type: Schema.Types.ObjectId,
    ref: "SharedChallenge",
    required: true,
  },
  comment: {
    // جديد: ref للكومنت إذا كان الإشعار متعلق بكومنت
    type: Schema.Types.ObjectId,
    ref: "Comment", // غير الاسم لو مدل الكومنت عندك مختلف (مثل Reply أو SharedChallengeComment)
    default: null,
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
notificationSchema.index({ recipient: 1, createdAt: -1 }); // لتحسين الأداء

export default mongoose.model("Notification", notificationSchema);

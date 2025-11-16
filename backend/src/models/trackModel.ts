import mongoose, { Schema } from "mongoose";

const trackSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  icon: {
    type: String, // حقل لتخزين مسار الصورة
    required: false, // اختياري لأن الـ Tracks الثابتة لن تستخدمه
  },
  description: {
    type: String,
    required: false, // اختياري
    trim: true,
    maxlength: 150, // حد أقصى للوصف
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Track", trackSchema);

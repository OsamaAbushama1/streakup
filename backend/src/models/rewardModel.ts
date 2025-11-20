import mongoose, { Schema } from "mongoose";

const rewardSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        required: true,
        min: 0,
    },
    isAvailable: {
        type: Boolean,
        default: false, // Coming Soon by default
    },
    icon: {
        type: String,
        default: "🎁",
    },
    category: {
        type: String,
        enum: ["boost", "cosmetic", "utility", "special"],
        default: "utility",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update timestamp on save
rewardSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model("Reward", rewardSchema);

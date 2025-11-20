"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../constants");
const userSchema = new mongoose_1.Schema({
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
            validator: async function (value) {
                const track = await mongoose_1.default.model("Track").findOne({ name: value });
                return constants_1.FIXED_TRACKS.includes(value) || !!track;
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
    challenges: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Challenge" }],
    startedChallenges: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Challenge" }],
    completedProjects: { type: Number, default: 0 },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    banUntil: { type: Date, default: null },
    emailNotifications: { type: Boolean, default: true },
    streakSavers: { type: Number, default: 0 },
    challengeBoosts: { type: Number, default: 0 },
    // Enhanced badge tracking for pop-ups and display
    unlockedBadges: [
        {
            name: { type: String, required: true },
            unlockedAt: { type: Date, default: Date.now },
            seen: { type: Boolean, default: false }, // For pop-up tracking
        },
    ],
    // Badges unlocked but not yet shown in pop-up
    newBadges: [{ type: String }],
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
exports.default = mongoose_1.default.model("User", userSchema);

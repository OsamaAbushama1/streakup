"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const rewardSettingsModel_1 = __importDefault(require("../models/rewardSettingsModel"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seedRewards = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI || "");
        console.log("Connected to MongoDB");
        const rewards = [
            {
                rewardName: "Highlight Shared Challenge",
                isLocked: true,
                description: "Highlight your shared challenge for 24 hours",
                points: 400,
            },
            {
                rewardName: "Streak Saver",
                isLocked: true,
                description: "Restore your streak if you miss a challenge",
                points: 200,
            },
            {
                rewardName: "Challenge Boost",
                isLocked: true,
                description: "Double the points for a challenge (×2)",
                points: 700,
            },
        ];
        for (const reward of rewards) {
            await rewardSettingsModel_1.default.findOneAndUpdate({ rewardName: reward.rewardName }, reward, { upsert: true, new: true });
        }
        console.log("Rewards seeded successfully!");
        process.exit(0);
    }
    catch (error) {
        console.error("Error seeding rewards:", error);
        process.exit(1);
    }
};
seedRewards();

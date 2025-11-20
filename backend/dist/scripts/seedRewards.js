"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const rewardModel_1 = __importDefault(require("../models/rewardModel"));
const db_1 = __importDefault(require("../config/db"));
dotenv_1.default.config();
const initialRewards = [
    {
        name: "Highlight Shared Challenge",
        description: "Highlight your shared challenge for 24 hours to get more visibility",
        points: 400,
        isAvailable: true,
        icon: "✨",
        category: "boost",
    },
    {
        name: "Streak Saver",
        description: "Save your streak when you miss a day",
        points: 200,
        isAvailable: true,
        icon: "🛡️",
        category: "utility",
    },
    {
        name: "Challenge Boost",
        description: "Instantly complete a challenge and earn its points",
        points: 700,
        isAvailable: true,
        icon: "🚀",
        category: "boost",
    },
];
const seedRewards = async () => {
    try {
        await (0, db_1.default)();
        console.log("🌱 Seeding rewards...");
        // Clear existing rewards
        await rewardModel_1.default.deleteMany({});
        console.log("✅ Cleared existing rewards");
        // Insert new rewards
        const createdRewards = await rewardModel_1.default.insertMany(initialRewards);
        console.log(`✅ Created ${createdRewards.length} rewards:`);
        createdRewards.forEach((reward) => {
            console.log(`   - ${reward.icon} ${reward.name} (${reward.points} points)`);
        });
        console.log("\n✨ Seeding completed successfully!");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error seeding rewards:", error);
        process.exit(1);
    }
};
seedRewards();

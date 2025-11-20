// Script to seed initial rewards into the database
import mongoose from "mongoose";
import dotenv from "dotenv";
import Reward from "../models/rewardModel";
import connectDB from "../config/db";

dotenv.config();

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
        await connectDB();

        console.log("🌱 Seeding rewards...");

        // Clear existing rewards
        await Reward.deleteMany({});
        console.log("✅ Cleared existing rewards");

        // Insert new rewards
        const createdRewards = await Reward.insertMany(initialRewards);
        console.log(`✅ Created ${createdRewards.length} rewards:`);
        createdRewards.forEach((reward) => {
            console.log(`   - ${reward.icon} ${reward.name} (${reward.points} points)`);
        });

        console.log("\n✨ Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding rewards:", error);
        process.exit(1);
    }
};

seedRewards();

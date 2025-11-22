"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReward = exports.updateReward = exports.getAllRewardsAdmin = exports.createReward = exports.syncSystemRewards = void 0;
const rewardModel_1 = __importDefault(require("../models/rewardModel"));
const SYSTEM_REWARDS = [
    {
        name: "Highlight Shared Challenge",
        description: "Highlight your shared challenge at the top of the Shared Challenges list for 24 hours.",
        points: 400,
        isSystem: true,
        isAvailable: true, // Default to true, but admin can change
    },
    {
        name: "Streak Saver",
        description: "Protect your streak if you miss a day without completing a challenge.",
        points: 200,
        isSystem: true,
        isAvailable: true,
    },
    {
        name: "Challenge Boost",
        description: "Complete a challenge instantly and earn its points.",
        points: 500,
        isSystem: true,
        isAvailable: true,
    },
];
// Helper to ensure system rewards exist
const syncSystemRewards = async () => {
    for (const reward of SYSTEM_REWARDS) {
        const existing = await rewardModel_1.default.findOne({ name: reward.name });
        if (!existing) {
            await rewardModel_1.default.create(reward);
        }
    }
};
exports.syncSystemRewards = syncSystemRewards;
// Admin: Create a new reward
const createReward = async (req, res) => {
    try {
        const { name, description, points, icon } = req.body;
        if (!name || !description || !points) {
            return res.status(400).json({ message: "Name, description, and points are required" });
        }
        const existing = await rewardModel_1.default.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: "Reward with this name already exists" });
        }
        const reward = await rewardModel_1.default.create({
            name,
            description,
            points,
            icon,
            isAvailable: false, // Default locked
            isSystem: false,
        });
        res.status(201).json({ message: "Reward created successfully", reward });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.createReward = createReward;
// Admin: Get all rewards (including locked)
const getAllRewardsAdmin = async (req, res) => {
    try {
        await (0, exports.syncSystemRewards)(); // Ensure system rewards exist
        const rewards = await rewardModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ rewards });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getAllRewardsAdmin = getAllRewardsAdmin;
// Admin: Update reward (including lock/unlock)
const updateReward = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, points, icon, isAvailable } = req.body;
        const reward = await rewardModel_1.default.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }
        // Prevent changing name of system rewards to avoid breaking hardcoded logic
        if (reward.isSystem && name && name !== reward.name) {
            return res.status(400).json({ message: "Cannot change name of system rewards" });
        }
        if (name)
            reward.name = name;
        if (description)
            reward.description = description;
        if (points !== undefined)
            reward.points = points;
        if (icon)
            reward.icon = icon;
        if (isAvailable !== undefined)
            reward.isAvailable = isAvailable;
        await reward.save();
        res.status(200).json({ message: "Reward updated successfully", reward });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.updateReward = updateReward;
// Admin: Delete reward
const deleteReward = async (req, res) => {
    try {
        const { id } = req.params;
        const reward = await rewardModel_1.default.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }
        if (reward.isSystem) {
            return res.status(403).json({ message: "Cannot delete system rewards" });
        }
        await rewardModel_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: "Reward deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.deleteReward = deleteReward;

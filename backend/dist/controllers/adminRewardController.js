"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleRewardAvailability = exports.deleteReward = exports.updateReward = exports.createReward = exports.getAllRewards = void 0;
const rewardModel_1 = __importDefault(require("../models/rewardModel"));
/**
 * Get all rewards (admin only)
 */
const getAllRewards = async (req, res) => {
    try {
        const rewards = await rewardModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            rewards,
            total: rewards.length,
        });
    }
    catch (error) {
        console.error("Error in getAllRewards:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getAllRewards = getAllRewards;
/**
 * Create new reward (admin only)
 */
const createReward = async (req, res) => {
    try {
        const { name, description, points, isAvailable, icon, category } = req.body;
        // Validation
        if (!name || !description || !points) {
            return res.status(400).json({
                message: "Name, description, and points are required",
            });
        }
        // Check if reward with same name already exists
        const existingReward = await rewardModel_1.default.findOne({ name });
        if (existingReward) {
            return res.status(400).json({
                message: "Reward with this name already exists",
            });
        }
        const reward = await rewardModel_1.default.create({
            name,
            description,
            points,
            isAvailable: isAvailable || false,
            icon: icon || "🎁",
            category: category || "utility",
        });
        res.status(201).json({
            message: "Reward created successfully",
            reward,
        });
    }
    catch (error) {
        console.error("Error in createReward:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.createReward = createReward;
/**
 * Update reward (admin only)
 */
const updateReward = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, points, isAvailable, icon, category } = req.body;
        const reward = await rewardModel_1.default.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }
        // Update fields
        if (name !== undefined)
            reward.name = name;
        if (description !== undefined)
            reward.description = description;
        if (points !== undefined)
            reward.points = points;
        if (isAvailable !== undefined)
            reward.isAvailable = isAvailable;
        if (icon !== undefined)
            reward.icon = icon;
        if (category !== undefined)
            reward.category = category;
        await reward.save();
        res.status(200).json({
            message: "Reward updated successfully",
            reward,
        });
    }
    catch (error) {
        console.error("Error in updateReward:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.updateReward = updateReward;
/**
 * Delete reward (admin only)
 */
const deleteReward = async (req, res) => {
    try {
        const { id } = req.params;
        const reward = await rewardModel_1.default.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }
        await reward.deleteOne();
        res.status(200).json({
            message: "Reward deleted successfully",
        });
    }
    catch (error) {
        console.error("Error in deleteReward:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.deleteReward = deleteReward;
/**
 * Toggle reward availability (admin only)
 */
const toggleRewardAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const reward = await rewardModel_1.default.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }
        reward.isAvailable = !reward.isAvailable;
        await reward.save();
        res.status(200).json({
            message: `Reward ${reward.isAvailable ? "enabled" : "disabled"} successfully`,
            reward,
        });
    }
    catch (error) {
        console.error("Error in toggleRewardAvailability:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.toggleRewardAvailability = toggleRewardAvailability;

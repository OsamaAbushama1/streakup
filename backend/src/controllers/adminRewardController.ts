import { Request, Response } from "express";
import Reward from "../models/rewardModel";

interface AuthRequest extends Request {
    user?: { id: string; role?: string };
}

/**
 * Get all rewards (admin only)
 */
export const getAllRewards = async (req: AuthRequest, res: Response) => {
    try {
        const rewards = await Reward.find().sort({ createdAt: -1 });

        res.status(200).json({
            rewards,
            total: rewards.length,
        });
    } catch (error: any) {
        console.error("Error in getAllRewards:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Create new reward (admin only)
 */
export const createReward = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, points, isAvailable, icon, category } = req.body;

        // Validation
        if (!name || !description || !points) {
            return res.status(400).json({
                message: "Name, description, and points are required",
            });
        }

        // Check if reward with same name already exists
        const existingReward = await Reward.findOne({ name });
        if (existingReward) {
            return res.status(400).json({
                message: "Reward with this name already exists",
            });
        }

        const reward = await Reward.create({
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
    } catch (error: any) {
        console.error("Error in createReward:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Update reward (admin only)
 */
export const updateReward = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, points, isAvailable, icon, category } = req.body;

        const reward = await Reward.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }

        // Update fields
        if (name !== undefined) reward.name = name;
        if (description !== undefined) reward.description = description;
        if (points !== undefined) reward.points = points;
        if (isAvailable !== undefined) reward.isAvailable = isAvailable;
        if (icon !== undefined) reward.icon = icon;
        if (category !== undefined) reward.category = category;

        await reward.save();

        res.status(200).json({
            message: "Reward updated successfully",
            reward,
        });
    } catch (error: any) {
        console.error("Error in updateReward:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Delete reward (admin only)
 */
export const deleteReward = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const reward = await Reward.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }

        await reward.deleteOne();

        res.status(200).json({
            message: "Reward deleted successfully",
        });
    } catch (error: any) {
        console.error("Error in deleteReward:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Toggle reward availability (admin only)
 */
export const toggleRewardAvailability = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const reward = await Reward.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }

        reward.isAvailable = !reward.isAvailable;
        await reward.save();

        res.status(200).json({
            message: `Reward ${reward.isAvailable ? "enabled" : "disabled"} successfully`,
            reward,
        });
    } catch (error: any) {
        console.error("Error in toggleRewardAvailability:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

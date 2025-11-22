import { Request, Response } from "express";
import Reward from "../models/rewardModel";
import User from "../models/userModel";

interface AuthRequest extends Request {
    user?: { id: string; role?: string };
}

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
export const syncSystemRewards = async () => {
    for (const reward of SYSTEM_REWARDS) {
        const existing = await Reward.findOne({ name: reward.name });
        if (!existing) {
            await Reward.create(reward);
        }
    }
};

// Admin: Create a new reward
export const createReward = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, points, icon } = req.body;

        if (!name || !description || !points) {
            return res.status(400).json({ message: "Name, description, and points are required" });
        }

        const existing = await Reward.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: "Reward with this name already exists" });
        }

        const reward = await Reward.create({
            name,
            description,
            points,
            icon,
            isAvailable: false, // Default locked
            isSystem: false,
        });

        res.status(201).json({ message: "Reward created successfully", reward });
    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Admin: Get all rewards (including locked)
export const getAllRewardsAdmin = async (req: AuthRequest, res: Response) => {
    try {
        await syncSystemRewards(); // Ensure system rewards exist
        const rewards = await Reward.find().sort({ createdAt: -1 });
        res.status(200).json({ rewards });
    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Admin: Update reward (including lock/unlock)
export const updateReward = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, points, icon, isAvailable } = req.body;

        const reward = await Reward.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }

        // Prevent changing name of system rewards to avoid breaking hardcoded logic
        if (reward.isSystem && name && name !== reward.name) {
            return res.status(400).json({ message: "Cannot change name of system rewards" });
        }

        if (name) reward.name = name;
        if (description) reward.description = description;
        if (points !== undefined) reward.points = points;
        if (icon) reward.icon = icon;
        if (isAvailable !== undefined) reward.isAvailable = isAvailable;

        await reward.save();

        res.status(200).json({ message: "Reward updated successfully", reward });
    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Admin: Delete reward
export const deleteReward = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const reward = await Reward.findById(id);

        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }

        if (reward.isSystem) {
            return res.status(403).json({ message: "Cannot delete system rewards" });
        }

        await Reward.findByIdAndDelete(id);
        res.status(200).json({ message: "Reward deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

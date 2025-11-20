import { Request, Response } from "express";
import Reward from "../models/rewardModel";

export const getAllRewards = async (req: Request, res: Response) => {
    try {
        const rewards = await Reward.find({});
        res.status(200).json({ rewards });
    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const toggleRewardLock = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reward = await Reward.findById(id);
        if (!reward) {
            return res.status(404).json({ message: "Reward not found" });
        }
        reward.isLocked = !reward.isLocked;
        await reward.save();
        res.status(200).json({ message: "Reward updated", reward });
    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

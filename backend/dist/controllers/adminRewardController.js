"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleRewardAvailability = exports.getRewardSettings = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const rewardSettingsModel_1 = __importDefault(require("../models/rewardSettingsModel"));
const mongoose_1 = __importDefault(require("mongoose"));
// Get reward settings
const getRewardSettings = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user || user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        let settings = await rewardSettingsModel_1.default.findOne();
        // Create default settings if none exist
        if (!settings) {
            settings = await rewardSettingsModel_1.default.create({
                highlightSharedChallenge: false,
                streakSaver: false,
                challengeBoost: false,
            });
        }
        res.status(200).json({ settings });
    }
    catch (error) {
        console.error("Error in getRewardSettings:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getRewardSettings = getRewardSettings;
// Toggle reward availability
const toggleRewardAvailability = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user || user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const { rewardName, isAvailable } = req.body;
        if (!rewardName || typeof isAvailable !== "boolean") {
            return res.status(400).json({ message: "Invalid request data" });
        }
        const validRewards = [
            "highlightSharedChallenge",
            "streakSaver",
            "challengeBoost",
        ];
        if (!validRewards.includes(rewardName)) {
            return res.status(400).json({ message: "Invalid reward name" });
        }
        let settings = await rewardSettingsModel_1.default.findOne();
        if (!settings) {
            settings = await rewardSettingsModel_1.default.create({
                highlightSharedChallenge: false,
                streakSaver: false,
                challengeBoost: false,
            });
        }
        // Update the specific reward field
        if (rewardName === "highlightSharedChallenge") {
            settings.highlightSharedChallenge = isAvailable;
        }
        else if (rewardName === "streakSaver") {
            settings.streakSaver = isAvailable;
        }
        else if (rewardName === "challengeBoost") {
            settings.challengeBoost = isAvailable;
        }
        settings.lastUpdatedBy = new mongoose_1.default.Types.ObjectId(req.user?.id);
        settings.lastUpdatedAt = new Date();
        await settings.save();
        res.status(200).json({
            message: `Reward ${isAvailable ? "enabled" : "disabled"} successfully`,
            settings,
        });
    }
    catch (error) {
        console.error("Error in toggleRewardAvailability:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.toggleRewardAvailability = toggleRewardAvailability;

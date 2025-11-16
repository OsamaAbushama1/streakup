"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedChallengesByUsername = exports.getUsernameBySharedChallengeId = exports.checkLikeStatus = exports.likeSharedChallenge = exports.incrementSharedChallengeViews = exports.getMyNonHighlightedSharedChallenges = exports.getMySharedChallenges = exports.getSharedChallenges = exports.getSharedChallengeByUsernameAndId = exports.getSharedChallengeById = void 0;
const sharedChallengeModel_1 = __importDefault(require("../models/sharedChallengeModel"));
const challengeModel_1 = __importDefault(require("../models/challengeModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const commentModel_1 = __importDefault(require("../models/commentModel"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const getSharedChallengeById = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const challenge = await challengeModel_1.default.findOne({ challengeId });
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }
        const sharedChallenge = await sharedChallengeModel_1.default.findOne({
            challenge: challenge._id,
        })
            .populate({
            path: "challenge",
            select: "name category views likes challengeId duration points project",
            populate: { path: "project", select: "_id name" },
        })
            .populate({
            path: "user",
            select: "firstName lastName profilePicture username ",
        });
        if (!sharedChallenge) {
            return res.status(404).json({ message: "Shared challenge not found" });
        }
        res.status(200).json({
            sharedChallenge: {
                ...sharedChallenge.toObject(),
                views: sharedChallenge.views,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getSharedChallengeById = getSharedChallengeById;
const getSharedChallengeByUsernameAndId = async (req, res) => {
    try {
        const { username, challengeId } = req.params;
        // 1. جلب اليوزر من الـ username
        const user = await userModel_1.default.findOne({ username }).select("_id");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        // 2. جلب التحدي
        const challenge = await challengeModel_1.default.findOne({ challengeId });
        if (!challenge)
            return res.status(404).json({ message: "Challenge not found" });
        // 3. جلب الـ SharedChallenge الخاص باليوزر + التحدي
        const sharedChallenge = await sharedChallengeModel_1.default.findOne({
            user: user._id,
            challenge: challenge._id,
        })
            .populate({
            path: "challenge",
            select: "name category views likes challengeId duration points project",
            populate: { path: "project", select: "_id name" },
        })
            .populate({
            path: "user",
            select: "firstName lastName profilePicture username",
        });
        if (!sharedChallenge)
            return res.status(404).json({ message: "Shared challenge not found" });
        res.status(200).json({ sharedChallenge: sharedChallenge.toObject() });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getSharedChallengeByUsernameAndId = getSharedChallengeByUsernameAndId;
const getSharedChallenges = async (req, res) => {
    try {
        const { tab = "recent", page = "1", limit = "6" } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.max(1, parseInt(limit, 10));
        const skip = (pageNum - 1) * limitNum;
        if (tab === "trending") {
            return res.json({
                sharedChallenges: [],
                total: 0,
                totalPages: 0,
                currentPage: pageNum,
            });
        }
        let sortOption = { createdAt: -1 };
        if (tab === "trending") {
            sortOption = { likes: -1, views: -1 };
        }
        const sharedChallenges = await sharedChallengeModel_1.default.find()
            .populate({
            path: "challenge",
            select: "name category views likes challengeId duration points",
            populate: { path: "project", select: "_id name" },
        })
            .populate({
            path: "user",
            select: "firstName lastName profilePicture username",
        })
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit));
        const totalChallenges = await sharedChallengeModel_1.default.countDocuments();
        const totalPages = Math.ceil(totalChallenges / limitNum);
        res.status(200).json({
            sharedChallenges,
            totalPages,
            currentPage: pageNum,
        });
    }
    catch (error) {
        console.error("Error in getSharedChallenges:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getSharedChallenges = getSharedChallenges;
const getMySharedChallenges = async (req, res) => {
    try {
        const sharedChallenges = await sharedChallengeModel_1.default.find({ user: req.user?.id })
            .populate({
            path: "challenge",
            select: "name category views likes challengeId",
            populate: { path: "project", select: "_id name" },
        })
            .populate({
            path: "user",
            select: "firstName lastName profilePicture",
        })
            .sort({ createdAt: -1 });
        const sharedWithComments = await Promise.all(sharedChallenges.map(async (shared) => {
            const commentsCount = await commentModel_1.default.countDocuments({
                sharedChallenge: shared._id,
            });
            return { ...shared.toObject(), comments: commentsCount };
        }));
        res.status(200).json({
            sharedChallenges: sharedWithComments,
            total: sharedWithComments.length,
        });
    }
    catch (error) {
        console.error("Error fetching my shared challenges:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getMySharedChallenges = getMySharedChallenges;
const getMyNonHighlightedSharedChallenges = async (req, res) => {
    try {
        const sharedChallenges = await sharedChallengeModel_1.default.find({
            user: req.user?.id,
            highlighted: false,
        })
            .populate({
            path: "challenge",
            select: "name category views likes",
        })
            .populate({
            path: "user",
            select: "firstName lastName profilePicture",
        })
            .sort({ createdAt: -1 });
        const sharedWithComments = await Promise.all(sharedChallenges.map(async (shared) => {
            const commentsCount = await commentModel_1.default.countDocuments({
                sharedChallenge: shared._id,
            });
            return { ...shared.toObject(), comments: commentsCount };
        }));
        res.status(200).json({
            sharedChallenges: sharedWithComments,
            total: sharedWithComments.length,
        });
    }
    catch (error) {
        console.error("Error fetching my non-highlighted shared challenges:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getMyNonHighlightedSharedChallenges = getMyNonHighlightedSharedChallenges;
const incrementSharedChallengeViews = async (req, res) => {
    try {
        const { challengeId } = req.params;
        console.log(`[incrementSharedChallengeViews] Received challengeId: ${challengeId}`);
        const challenge = await challengeModel_1.default.findOne({ challengeId });
        if (!challenge) {
            console.log(`[incrementSharedChallengeViews] Challenge not found for challengeId: ${challengeId}`);
            return res.status(404).json({ message: "Challenge not found" });
        }
        console.log(`[incrementSharedChallengeViews] Found challenge: ${challenge._id}`);
        const sharedChallenge = await sharedChallengeModel_1.default.findOne({
            challenge: challenge._id,
        });
        if (!sharedChallenge) {
            console.log(`[incrementSharedChallengeViews] SharedChallenge not found for challenge: ${challenge._id}`);
            return res.status(404).json({ message: "Shared challenge not found" });
        }
        console.log(`[incrementSharedChallengeViews] Found sharedChallenge: ${sharedChallenge._id}`);
        const userId = req.user?.id
            ? new mongoose_1.default.Types.ObjectId(req.user.id)
            : null;
        if (!userId) {
            console.log(`[incrementSharedChallengeViews] No userId provided, view not counted`);
            return res.status(200).json({
                message: "View not counted for unauthenticated user",
                views: sharedChallenge.views,
            });
        }
        if (!sharedChallenge.viewedBy.some((viewedId) => viewedId.equals(userId))) {
            sharedChallenge.viewedBy.push(userId);
            sharedChallenge.views = sharedChallenge.viewedBy.length;
            await sharedChallenge.save();
            console.log(`[incrementSharedChallengeViews] View added for SharedChallenge ${sharedChallenge._id} by user ${userId}`, {
                views: sharedChallenge.views,
                viewedBy: sharedChallenge.viewedBy.map((id) => id.toString()),
            });
        }
        else {
            console.log(`[incrementSharedChallengeViews] User ${userId} already viewed SharedChallenge ${sharedChallenge._id}`);
        }
        res.status(200).json({
            message: "View count incremented if unique",
            views: sharedChallenge.views,
        });
    }
    catch (error) {
        console.error("[incrementSharedChallengeViews] Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.incrementSharedChallengeViews = incrementSharedChallengeViews;
const likeSharedChallenge = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const challenge = await challengeModel_1.default.findOne({ challengeId });
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }
        const sharedChallenge = await sharedChallengeModel_1.default.findOne({
            challenge: challenge._id,
        });
        if (!sharedChallenge) {
            return res.status(404).json({ message: "Shared challenge not found" });
        }
        const userId = new mongoose_1.default.Types.ObjectId(req.user?.id);
        const isLiked = sharedChallenge.likedBy.includes(userId);
        if (isLiked) {
            sharedChallenge.likedBy = sharedChallenge.likedBy.filter((id) => !id.equals(userId));
            await notificationModel_1.default.deleteOne({
                recipient: sharedChallenge.user._id,
                sender: req.user?.id,
                type: "like",
                sharedChallenge: sharedChallenge._id,
            });
        }
        else {
            sharedChallenge.likedBy.push(userId);
            if (sharedChallenge.user._id.toString() !== req.user?.id) {
                const sender = await userModel_1.default.findById(req.user?.id).select("firstName lastName profilePicture");
                await notificationModel_1.default.create({
                    recipient: sharedChallenge.user._id,
                    sender: req.user?.id,
                    type: "like",
                    sharedChallenge: sharedChallenge._id,
                    message: `${sender?.firstName} ${sender?.lastName} liked your challenge`,
                });
            }
        }
        sharedChallenge.likes = sharedChallenge.likedBy.length;
        await sharedChallenge.save();
        res.status(200).json({
            message: isLiked ? "Like removed" : "Like added",
            likes: sharedChallenge.likes,
            isLiked: !isLiked,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.likeSharedChallenge = likeSharedChallenge;
const checkLikeStatus = async (req, res) => {
    const { challengeId } = req.params;
    try {
        console.log(`[checkLikeStatus] Received challengeId: ${challengeId}`);
        if (!challengeId ||
            typeof challengeId !== "string" ||
            challengeId.trim() === "") {
            console.log(`[checkLikeStatus] Invalid challengeId: ${challengeId}`);
            return res.status(400).json({ message: "Invalid challenge ID" });
        }
        let sharedChallenge;
        if (mongoose_1.default.Types.ObjectId.isValid(challengeId)) {
            sharedChallenge = await sharedChallengeModel_1.default.findById(challengeId);
        }
        if (!sharedChallenge) {
            const challenge = await challengeModel_1.default.findOne({
                challengeId: challengeId.trim(),
            });
            if (!challenge) {
                console.log(`[checkLikeStatus] Challenge not found for challengeId: ${challengeId}`);
                return res.status(404).json({ message: "Challenge not found" });
            }
            console.log(`[checkLikeStatus] Found challenge: ${challenge._id}`);
            sharedChallenge = await sharedChallengeModel_1.default.findOne({
                challenge: challenge._id,
            });
        }
        if (!sharedChallenge) {
            console.log(`[checkLikeStatus] SharedChallenge not found for challengeId: ${challengeId}`);
            return res.status(404).json({ message: "Shared challenge not found" });
        }
        console.log(`[checkLikeStatus] Found sharedChallenge: ${sharedChallenge._id}`);
        const userId = req.user?.id
            ? new mongoose_1.default.Types.ObjectId(req.user.id)
            : null;
        if (!userId) {
            console.log(`[checkLikeStatus] No userId provided`);
            return res.status(401).json({ message: "User not authenticated" });
        }
        const isLiked = sharedChallenge.likedBy.some((id) => id.equals(userId));
        res.status(200).json({ isLiked });
    }
    catch (error) {
        console.error(`[checkLikeStatus] Error for challengeId ${challengeId}:`, error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.checkLikeStatus = checkLikeStatus;
const getUsernameBySharedChallengeId = async (req, res) => {
    try {
        const { challengeId } = req.params;
        // 1. جلب التحدي من challengeId
        const challenge = await challengeModel_1.default.findOne({ challengeId });
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }
        // 2. جلب أي SharedChallenge متعلق بالتحدي ده
        const sharedChallenge = await sharedChallengeModel_1.default.findOne({
            challenge: challenge._id,
        }).populate({
            path: "user",
            select: "username",
        });
        if (!sharedChallenge || !sharedChallenge.user) {
            return res
                .status(404)
                .json({ message: "Shared challenge or user not found" });
        }
        res.status(200).json({
            username: sharedChallenge.user.username,
        });
    }
    catch (error) {
        console.error("[getUsernameBySharedChallengeId] Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getUsernameBySharedChallengeId = getUsernameBySharedChallengeId;
const getSharedChallengesByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await userModel_1.default.findOne({ username }).select("_id");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const sharedChallenges = await sharedChallengeModel_1.default.find({ user: user._id })
            .populate({
            path: "user",
            select: "firstName lastName profilePicture",
        })
            .populate({
            path: "challenge",
            select: "name category challengeId",
        })
            .lean();
        const sharedChallengesWithComments = await Promise.all(sharedChallenges.map(async (shared) => {
            const commentsCount = await commentModel_1.default.countDocuments({
                sharedChallenge: shared._id,
                deletedAt: null,
            });
            return {
                ...shared,
                comments: commentsCount,
            };
        }));
        res.status(200).json({ sharedChallenges: sharedChallengesWithComments });
    }
    catch (error) {
        console.error("Error fetching shared challenges by username:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getSharedChallengesByUsername = getSharedChallengesByUsername;

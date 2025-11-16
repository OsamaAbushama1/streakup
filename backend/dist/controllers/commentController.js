"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportComment = exports.likeComment = exports.addComment = exports.getComments = void 0;
const sharedChallengeModel_1 = __importDefault(require("../models/sharedChallengeModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const commentModel_1 = __importDefault(require("../models/commentModel"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const getComments = async (req, res) => {
    try {
        const { sharedChallengeId } = req.params; // غيرنا من challengeId
        if (!mongoose_1.default.Types.ObjectId.isValid(sharedChallengeId)) {
            return res.status(400).json({ message: "Invalid shared challenge ID" });
        }
        const sharedChallenge = await sharedChallengeModel_1.default.findById(sharedChallengeId)
            .populate("user")
            .populate({
            path: "challenge",
            select: "name challengeId",
        });
        if (!sharedChallenge) {
            return res.status(404).json({ message: "Shared challenge not found" });
        }
        const comments = await commentModel_1.default.find({
            sharedChallenge: sharedChallenge._id,
            deletedAt: null,
        })
            .populate({
            path: "user",
            select: "firstName lastName profilePicture username",
        })
            .lean();
        const userId = req.user?.id
            ? new mongoose_1.default.Types.ObjectId(req.user.id)
            : null;
        const isOwner = sharedChallenge.user?._id.equals(userId);
        const commentsWithLikesAndReports = comments.map((comment) => ({
            ...comment,
            isLiked: userId
                ? comment.likedBy.some((id) => id.equals(userId))
                : false,
            isReported: userId
                ? comment.reports.some((id) => id.equals(userId))
                : false,
        }));
        res.status(200).json({
            comments: commentsWithLikesAndReports,
            isOwner,
            currentUserId: userId?.toString() || null,
        });
    }
    catch (error) {
        console.error("[getComments] Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getComments = getComments;
const addComment = async (req, res) => {
    const { sharedChallengeId } = req.params; // غيرنا من challengeId
    try {
        const { content } = req.body;
        if (!content?.trim()) {
            return res.status(400).json({ message: "Comment content is required" });
        }
        if (content.length > 500) {
            return res
                .status(400)
                .json({ message: "Comment must not exceed 500 characters" });
        }
        const sharedChallenge = await sharedChallengeModel_1.default.findById(sharedChallengeId);
        if (!sharedChallenge) {
            return res.status(404).json({ message: "Shared challenge not found" });
        }
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.banUntil && new Date() < user.banUntil) {
            return res
                .status(403)
                .json({ message: "You are banned from commenting" });
        }
        if (sharedChallenge.user.toString() === req.user?.id) {
            return res
                .status(403)
                .json({ message: "Owners cannot comment on their own challenges" });
        }
        const comment = await commentModel_1.default.create({
            sharedChallenge: sharedChallenge._id,
            user: req.user?.id,
            content,
        });
        await comment.populate({
            path: "user",
            select: "firstName lastName profilePicture",
        });
        // إشعار
        if (sharedChallenge.user.toString() !== req.user?.id) {
            const sender = await userModel_1.default.findById(req.user?.id);
            await notificationModel_1.default.create({
                recipient: sharedChallenge.user,
                sender: req.user?.id,
                type: "comment",
                sharedChallenge: sharedChallenge._id,
                comment: comment._id,
                message: `${sender?.firstName} ${sender?.lastName} commented on your challenge`,
            });
        }
        res.status(201).json({ comment });
    }
    catch (error) {
        console.error("[addComment] Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.addComment = addComment;
const likeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid comment ID" });
        }
        const comment = await commentModel_1.default.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        const userId = new mongoose_1.default.Types.ObjectId(req.user?.id);
        const isLiked = comment.likedBy.some((id) => id.equals(userId));
        if (isLiked) {
            comment.likedBy = comment.likedBy.filter((id) => !id.equals(userId));
            await notificationModel_1.default.deleteOne({
                recipient: comment.user,
                sender: req.user?.id,
                type: "like",
                sharedChallenge: comment.sharedChallenge._id,
                comment: comment._id,
            });
        }
        else {
            comment.likedBy.push(userId);
            if (comment.user.toString() !== req.user?.id) {
                const sender = await userModel_1.default.findById(req.user?.id).select("firstName lastName profilePicture");
                const sharedChallenge = await sharedChallengeModel_1.default.findById(comment.sharedChallenge).populate({
                    path: "challenge",
                    select: "name",
                });
                const commentPreview = comment.content.length > 30
                    ? comment.content.trim().substring(0, 30) + "..."
                    : comment.content.trim();
                await notificationModel_1.default.create({
                    recipient: comment.user,
                    sender: req.user?.id,
                    type: "like",
                    sharedChallenge: comment.sharedChallenge._id,
                    comment: comment._id, // مهم: ربط الكومنت
                    challengeLinkId: sharedChallenge?.sharedChallengeId || null, // مهم للرابط
                    message: `${sender?.firstName} ${sender?.lastName} liked your comment on "${commentPreview}"`,
                });
            }
        }
        comment.likes = comment.likedBy.length;
        await comment.save();
        console.log(`Comment ${commentId} updated:`, {
            likes: comment.likes,
            likedBy: comment.likedBy.map((id) => id.toString()),
        });
        res.status(200).json({
            message: isLiked ? "Like removed from comment" : "Like added to comment",
            likes: comment.likes,
            isLiked: !isLiked,
        });
    }
    catch (error) {
        console.error("Error in likeComment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.likeComment = likeComment;
const reportComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid comment ID" });
        }
        const comment = await commentModel_1.default.findById(commentId).populate("sharedChallenge");
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        const userId = new mongoose_1.default.Types.ObjectId(req.user?.id);
        if (comment.reports.some((id) => id.equals(userId))) {
            return res
                .status(400)
                .json({ message: "You have already reported this comment" });
        }
        comment.reports.push(userId);
        comment.status = "pending";
        await comment.save();
        console.log(`Comment ${commentId} reported by user ${userId}:`, {
            reports: comment.reports.map((id) => id.toString()),
        });
        res.status(200).json({ message: "Comment reported successfully" });
    }
    catch (error) {
        console.error("Error in reportComment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.reportComment = reportComment;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletedProjects = exports.getNonCompletedChallenges = exports.incrementChallengeViews = exports.recordView = exports.shareChallenge = exports.startChallenge = exports.likeChallenge = exports.getChallengesByProject = exports.getChallengeById = exports.getAllChallenges = void 0;
const challengeModel_1 = __importDefault(require("../models/challengeModel"));
const sharedChallengeModel_1 = __importDefault(require("../models/sharedChallengeModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const generateCertificate_1 = require("../utils/generateCertificate");
const generateSharedChallengeId = async (challengeId, challengeObjectId) => {
    const count = await sharedChallengeModel_1.default.countDocuments({
        challenge: challengeObjectId,
    });
    return `${challengeId}-${count + 1}`;
};
const updateUserRank = (completedProjects) => {
    if (completedProjects >= 6)
        return "Platinum";
    if (completedProjects >= 4)
        return "Gold";
    if (completedProjects >= 2)
        return "Silver";
    return "Bronze";
};
const getAllChallenges = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.banUntil && new Date() < user.banUntil) {
            return res.status(403).json({
                message: "You are banned from viewing challenges for 2 days.",
                challenges: [],
            });
        }
        let challenges;
        if (user.role === "Admin") {
            challenges = await challengeModel_1.default.find()
                .sort({ createdAt: 1 })
                .populate("createdBy", "firstName lastName")
                .populate("project", "name track");
        }
        else {
            challenges = await challengeModel_1.default.find({ category: user.track })
                .sort({ createdAt: 1 })
                .populate("createdBy", "firstName lastName")
                .populate("project", "name track");
        }
        const currentDate = new Date();
        const challengesWithStatus = challenges.map((challenge) => {
            const createdAt = new Date(challenge.createdAt);
            const durationInMs = challenge.duration * 24 * 60 * 60 * 1000;
            const endDate = new Date(createdAt.getTime() + durationInMs);
            let status;
            if (user.challenges.some((challengeId) => challengeId.equals(challenge._id))) {
                status = "Completed";
            }
            else if (currentDate <= endDate) {
                status = "Active";
            }
            else {
                status = "Missed";
            }
            return {
                ...challenge.toObject(),
                status,
            };
        });
        res.status(200).json({ challenges: challengesWithStatus });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getAllChallenges = getAllChallenges;
const getChallengeById = async (req, res) => {
    try {
        const challenge = await challengeModel_1.default.findOne({
            challengeId: req.params.id,
        })
            .populate("createdBy", "firstName lastName")
            .populate("project", "name track");
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role !== "Admin" && challenge.category !== user.track) {
            return res.status(403).json({ message: "Access denied" });
        }
        const currentDate = new Date();
        const createdAt = new Date(challenge.createdAt);
        const durationInMs = challenge.duration * 24 * 60 * 60 * 1000;
        const endDate = new Date(createdAt.getTime() + durationInMs);
        let status;
        if (user.challenges.some((challengeId) => challengeId.equals(challenge._id))) {
            status = "Completed";
        }
        else if (user.startedChallenges.some((challengeId) => challengeId.equals(challenge._id))) {
            status = "Started";
        }
        else if (currentDate <= endDate) {
            status = "Active";
        }
        else {
            status = "Missed";
        }
        res.status(200).json({ challenge: { ...challenge.toObject(), status } });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getChallengeById = getChallengeById;
const getChallengesByProject = async (req, res) => {
    const { project } = req.query;
    if (!project ||
        typeof project !== "string" ||
        !mongoose_1.default.isValidObjectId(project)) {
        return res.status(400).json({ message: "Invalid or missing project ID" });
    }
    try {
        const challenges = await challengeModel_1.default.find({ project })
            .populate("createdBy", "firstName lastName")
            .populate("project", "name track");
        res.status(200).json({ challenges });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getChallengesByProject = getChallengesByProject;
const likeChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.banUntil && new Date() < user.banUntil) {
            return res
                .status(403)
                .json({ message: "You are banned from liking challenges" });
        }
        const challenge = await challengeModel_1.default.findOne({ challengeId: id }).populate("project", "_id name track points");
        if (!challenge)
            return res.status(404).json({ message: "Challenge not found" });
        if (challenge.category !== user.track)
            return res
                .status(403)
                .json({ message: "Challenge does not match your track" });
        const oldRank = user.rank;
        if (!user.challenges.some((c) => c.equals(challenge._id))) {
            let totalCompletedPoints = 0;
            if (challenge.project) {
                const project = await mongoose_1.default
                    .model("Project")
                    .findById(challenge.project._id);
                if (!project)
                    return res.status(404).json({ message: "Project not found" });
                const userCompleted = await challengeModel_1.default.find({
                    _id: { $in: user.challenges },
                    project: challenge.project._id,
                });
                totalCompletedPoints = userCompleted.reduce((sum, ch) => sum + (ch.points || 50), 0);
            }
            user.challenges.push(challenge._id);
            user.completedChallenges += 1;
            user.streak += 1;
            user.points += challenge.points || 50;
            if (challenge.project) {
                totalCompletedPoints += challenge.points || 50;
                const project = await mongoose_1.default
                    .model("Project")
                    .findById(challenge.project._id);
                if (project && totalCompletedPoints >= project.points) {
                    user.completedProjects += 1;
                }
            }
            user.rank = updateUserRank(user.completedProjects);
            challenge.likes += 1;
            await Promise.all([user.save(), challenge.save()]);
            // إرسال الشهادة
            if (user.rank !== oldRank && user.rank !== "Bronze") {
                try {
                    const certificateBuffer = await (0, generateCertificate_1.generateCertificate)({
                        name: `${user.firstName} ${user.lastName}`,
                        rank: user.rank,
                    });
                    await (0, generateCertificate_1.sendCertificateEmail)(user.email, `${user.firstName} ${user.lastName}`, user.rank, certificateBuffer);
                    console.log(`Certificate sent to ${user.email} for ${user.rank} rank`);
                }
                catch (emailErr) {
                    console.error("Failed to send certificate email:", emailErr);
                }
            }
        }
        res.status(200).json({ message: "Challenge completed successfully" });
    }
    catch (error) {
        console.error("Error in likeChallenge:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.likeChallenge = likeChallenge;
const startChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const challenge = await challengeModel_1.default.findOne({ challengeId: id });
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }
        if (challenge.category !== user.track) {
            return res
                .status(403)
                .json({ message: "Challenge does not match your track" });
        }
        if (!user.startedChallenges.some((challengeId) => challengeId.equals(challenge._id)) &&
            !user.challenges.some((challengeId) => challengeId.equals(challenge._id))) {
            user.startedChallenges.push(challenge._id);
            await user.save();
        }
        res.status(200).json({ message: "Challenge started successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.startChallenge = startChallenge;
const shareChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.banUntil && new Date() < user.banUntil) {
            return res
                .status(403)
                .json({ message: "You are banned from sharing challenges" });
        }
        const challenge = await challengeModel_1.default.findOne({ challengeId: id }).populate("project", "_id name track points");
        if (!challenge)
            return res.status(404).json({ message: "Challenge not found" });
        if (challenge.category !== user.track)
            return res
                .status(403)
                .json({ message: "Challenge does not match your track" });
        const { description } = req.body;
        if (!description?.trim())
            return res.status(400).json({ message: "Description is required" });
        const files = Array.isArray(req.files) ? req.files : [];
        const images = files.map((f) => `uploads/${f.filename}`);
        const sharedChallengeId = await generateSharedChallengeId(id, challenge._id);
        const sharedChallenge = await sharedChallengeModel_1.default.create({
            sharedChallengeId,
            challenge: challenge._id,
            user: req.user?.id,
            description,
            images,
        });
        const oldRank = user.rank;
        if (!user.challenges.some((c) => c.equals(challenge._id))) {
            let totalCompletedPoints = 0;
            if (challenge.project) {
                const project = await mongoose_1.default
                    .model("Project")
                    .findById(challenge.project._id);
                if (!project)
                    return res.status(404).json({ message: "Project not found" });
                const userCompleted = await challengeModel_1.default.find({
                    _id: { $in: user.challenges },
                    project: challenge.project._id,
                });
                totalCompletedPoints = userCompleted.reduce((sum, ch) => sum + (ch.points || 50), 0);
            }
            user.challenges.push(challenge._id);
            user.completedChallenges += 1;
            user.streak += 1;
            user.points += challenge.points || 50;
            if (challenge.project) {
                totalCompletedPoints += challenge.points || 50;
                const project = await mongoose_1.default
                    .model("Project")
                    .findById(challenge.project._id);
                if (project && totalCompletedPoints >= project.points) {
                    user.completedProjects += 1;
                }
            }
            user.rank = updateUserRank(user.completedProjects);
            await user.save();
            // إرسال الشهادة
            if (user.rank !== oldRank && user.rank !== "Bronze") {
                try {
                    const certificateBuffer = await (0, generateCertificate_1.generateCertificate)({
                        name: `${user.firstName} ${user.lastName}`,
                        rank: user.rank,
                    });
                    await (0, generateCertificate_1.sendCertificateEmail)(user.email, `${user.firstName} ${user.lastName}`, user.rank, certificateBuffer);
                    console.log(`Certificate sent to ${user.email} for ${user.rank} rank`);
                }
                catch (emailErr) {
                    console.error("Failed to send certificate email:", emailErr);
                }
            }
        }
        await challengeModel_1.default.updateOne({ _id: challenge._id }, { $set: { shared: true } });
        const populated = await sharedChallengeModel_1.default.findById(sharedChallenge._id)
            .populate({
            path: "challenge",
            select: "name category views likes challengeId duration points project",
            populate: { path: "project", select: "_id name" },
        })
            .populate({
            path: "user",
            select: "firstName lastName profilePicture username",
        });
        res.status(200).json({
            message: "Challenge shared successfully",
            sharedChallenge: populated,
        });
    }
    catch (error) {
        console.error("Error in shareChallenge:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.shareChallenge = shareChallenge;
const recordView = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid challenge ID" });
        }
        const challenge = await challengeModel_1.default.findById(id);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }
        challenge.views += 1;
        await challenge.save();
        res.status(200).json({ message: "View recorded successfully", challenge });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.recordView = recordView;
const incrementChallengeViews = async (req, res) => {
    try {
        const { challengeId } = req.params;
        console.log(`[incrementChallengeViews] Received challengeId: ${challengeId}`);
        const challenge = await challengeModel_1.default.findOne({ challengeId });
        if (!challenge) {
            console.log(`[incrementChallengeViews] Challenge not found for challengeId: ${challengeId}`);
            return res.status(404).json({ message: "Challenge not found" });
        }
        console.log(`[incrementChallengeViews] Found challenge: ${challenge._id}`);
        const userId = req.user?.id
            ? new mongoose_1.default.Types.ObjectId(req.user.id)
            : null;
        if (!userId) {
            console.log(`[incrementChallengeViews] No userId provided, view not counted`);
            return res.status(200).json({
                message: "View not counted for unauthenticated user",
                views: challenge.views,
            });
        }
        if (!challenge.viewedBy.some((viewedId) => viewedId.equals(userId))) {
            challenge.viewedBy.push(userId);
            challenge.views = challenge.viewedBy.length;
            await challenge.save();
            console.log(`[incrementChallengeViews] View added for Challenge ${challenge._id} by user ${userId}`, {
                views: challenge.views,
                viewedBy: challenge.viewedBy.map((id) => id.toString()),
            });
        }
        else {
            console.log(`[incrementChallengeViews] User ${userId} already viewed Challenge ${challenge._id}`);
        }
        res.status(200).json({
            message: "View count incremented if unique",
            views: challenge.views,
        });
    }
    catch (error) {
        console.error("[incrementChallengeViews] Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.incrementChallengeViews = incrementChallengeViews;
const getNonCompletedChallenges = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.banUntil && new Date() < user.banUntil) {
            return res.status(403).json({
                message: "You are banned from viewing challenges for 2 days.",
                challenges: [],
            });
        }
        let challenges = await challengeModel_1.default.find({ category: user.track })
            .sort({ createdAt: 1 })
            .populate("createdBy", "firstName lastName");
        challenges = challenges.filter((challenge) => !user.challenges.some((id) => id.equals(challenge._id)));
        const viewsUpdates = challenges.map(async (challenge) => {
            challenge.views += 1;
            await challenge.save();
        });
        await Promise.all(viewsUpdates);
        const currentDate = new Date();
        const challengesWithStatus = challenges.map((challenge) => {
            const createdAt = new Date(challenge.createdAt);
            const durationInMs = challenge.duration * 24 * 60 * 60 * 1000;
            const endDate = new Date(createdAt.getTime() + durationInMs);
            let status = currentDate <= endDate ? "Active" : "Missed";
            return {
                ...challenge.toObject(),
                status,
            };
        });
        res.status(200).json({ challenges: challengesWithStatus });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getNonCompletedChallenges = getNonCompletedChallenges;
const getCompletedProjects = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id).populate("challenges");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const projects = await mongoose_1.default.model("Project").find({});
        const completedProjects = [];
        for (const project of projects) {
            const projectChallenges = await challengeModel_1.default.find({ project: project._id });
            const userCompletedChallenges = await challengeModel_1.default.find({
                _id: { $in: user.challenges },
                project: project._id,
            });
            const totalCompletedPoints = userCompletedChallenges.reduce((sum, ch) => sum + (ch.points || 50), 0);
            if (totalCompletedPoints >= project.points) {
                completedProjects.push({
                    projectId: project._id,
                    name: project.name,
                    track: project.track,
                    points: project.points,
                    completedPoints: totalCompletedPoints,
                });
            }
        }
        res.status(200).json({ completedProjects });
    }
    catch (error) {
        console.error("Error in getCompletedProjects:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getCompletedProjects = getCompletedProjects;

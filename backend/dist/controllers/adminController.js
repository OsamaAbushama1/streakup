"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRewardSettings = exports.getRewardSettings = exports.registerAdmin = exports.getDashboardStats = exports.changePassword = exports.getActivities = exports.banUser = exports.deleteCommentAdmin = exports.resolveReport = exports.getReports = exports.updateUser = exports.deleteUser = exports.getUserById = exports.getAllUsers = exports.deleteChallenge = exports.updateChallenge = exports.createChallenge = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const commentModel_1 = __importDefault(require("../models/commentModel"));
const challengeModel_1 = __importDefault(require("../models/challengeModel"));
const sharedChallengeModel_1 = __importDefault(require("../models/sharedChallengeModel"));
const trackModel_1 = __importDefault(require("../models/trackModel"));
const projectModel_1 = __importDefault(require("../models/projectModel"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const cloudinary_1 = require("../utils/cloudinary");
const systemSettingModel_1 = __importDefault(require("../models/systemSettingModel"));
const FIXED_TRACKS = ["UI/UX Design", "Graphic Design", "Frontend Development"];
const isValidTrack = async (trackName) => {
    if (FIXED_TRACKS.includes(trackName))
        return true;
    const track = await trackModel_1.default.findOne({ name: trackName });
    return !!track;
};
const generateChallengeId = async (category) => {
    const count = await challengeModel_1.default.countDocuments({ category });
    const prefix = category
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/\/+/g, "-");
    return `${prefix}-${String(count + 1).padStart(3, "0")}`;
};
const createChallenge = async (req, res) => {
    try {
        const { name, category, duration, points, overview, challengeDetails, challengeSteps, requirements, project, } = req.body;
        if (!name ||
            !category ||
            !duration ||
            !points ||
            !overview ||
            !challengeDetails ||
            !challengeSteps ||
            !requirements) {
            return res.status(400).json({ message: "Required fields are missing" });
        }
        if (!(await isValidTrack(category))) {
            return res.status(400).json({ message: "Invalid track" });
        }
        // التحقق من المشروع
        if (project) {
            const projectDoc = await projectModel_1.default.findById(project);
            if (!projectDoc) {
                return res.status(400).json({ message: "Project not found" });
            }
            if (projectDoc.track !== category) {
                return res.status(400).json({
                    message: "Project must belong to the same track as the challenge",
                });
            }
            const challengeCount = await challengeModel_1.default.countDocuments({
                project: projectDoc._id,
            });
            if (challengeCount >= 6) {
                return res
                    .status(400)
                    .json({ message: "Project cannot have more than 6 challenges" });
            }
            const projectChallenges = await challengeModel_1.default.find({
                project: projectDoc._id,
            });
            const currentPoints = projectChallenges.reduce((sum, challenge) => sum + challenge.points, 0);
            const totalPoints = currentPoints + parseInt(points);
            if (totalPoints > projectDoc.points) {
                return res.status(400).json({
                    message: `Total challenge points (${totalPoints}) exceed project points (${projectDoc.points})`,
                });
            }
        }
        let previewImages = [];
        if (Array.isArray(req.files) && req.files.length > 0) {
            try {
                previewImages = await (0, cloudinary_1.uploadMultipleToCloudinary)(req.files, 'streakup/challenges');
            }
            catch (error) {
                console.error('Error uploading to Cloudinary:', error);
                return res.status(500).json({ message: "Error uploading preview images" });
            }
        }
        const challengeId = await generateChallengeId(category);
        const challenge = await challengeModel_1.default.create({
            name,
            category,
            challengeId,
            duration,
            points,
            overview,
            challengeDetails,
            challengeSteps,
            requirements,
            previewImages,
            createdBy: req.user?.id,
            project: project || null,
        });
        // جلب التحدي مع بيانات المشروع باستخدام populate
        const populatedChallenge = await challengeModel_1.default.findById(challenge._id).populate("project", "_id name");
        // تحديث challengeCount في المشروع إذا كان موجودًا
        if (project) {
            await projectModel_1.default.findByIdAndUpdate(project, {
                $inc: { challengeCount: 1 },
            });
        }
        res.status(201).json({
            message: "Challenge created successfully",
            challenge: populatedChallenge,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.createChallenge = createChallenge;
const updateChallenge = async (req, res) => {
    try {
        const { name, category, duration, points, overview, challengeDetails, challengeSteps, requirements, existingImages, project, } = req.body;
        const challenge = await challengeModel_1.default.findById(req.params.id);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }
        if (category && !(await isValidTrack(category))) {
            return res.status(400).json({ message: "Invalid track" });
        }
        // التحقق من المشروع
        if (project) {
            const projectDoc = await projectModel_1.default.findById(project);
            if (!projectDoc) {
                return res.status(400).json({ message: "Project not found" });
            }
            if (projectDoc.track !== (category || challenge.category)) {
                return res.status(400).json({
                    message: "Project must belong to the same track as the challenge",
                });
            }
            const challengeCount = await challengeModel_1.default.countDocuments({
                project: projectDoc._id,
                _id: { $ne: challenge._id }, // استثناء التحدي الحالي
            });
            if (challengeCount >= 6) {
                return res
                    .status(400)
                    .json({ message: "Project cannot have more than 6 challenges" });
            }
            const projectChallenges = await challengeModel_1.default.find({
                project: projectDoc._id,
                _id: { $ne: challenge._id },
            });
            const currentPoints = projectChallenges.reduce((sum, challenge) => sum + challenge.points, 0);
            const totalPoints = currentPoints + parseInt(points || challenge.points);
            if (totalPoints > projectDoc.points) {
                return res.status(400).json({
                    message: `Total challenge points (${totalPoints}) exceed project points (${projectDoc.points})`,
                });
            }
        }
        const files = Array.isArray(req.files) ? req.files : [];
        let newImages = [];
        if (files.length > 0) {
            try {
                newImages = await (0, cloudinary_1.uploadMultipleToCloudinary)(files, 'streakup/challenges');
            }
            catch (error) {
                console.error('Error uploading to Cloudinary:', error);
                return res.status(500).json({ message: "Error uploading preview images" });
            }
        }
        const previewImages = [
            ...(existingImages
                ? Array.isArray(existingImages)
                    ? existingImages
                    : [existingImages]
                : challenge.previewImages || []),
            ...newImages,
        ];
        challenge.name = name || challenge.name;
        challenge.category = category || challenge.category;
        challenge.duration = duration || challenge.duration;
        challenge.points = points !== undefined ? points : challenge.points;
        challenge.overview = overview || challenge.overview;
        challenge.challengeDetails = challengeDetails || challenge.challengeDetails;
        challenge.challengeSteps = challengeSteps || challenge.challengeSteps;
        challenge.requirements = requirements || challenge.requirements;
        challenge.previewImages =
            previewImages.length > 0 ? previewImages : challenge.previewImages;
        challenge.project = project || challenge.project;
        if (challenge.project && challenge.project.toString() !== project) {
            await projectModel_1.default.findByIdAndUpdate(challenge.project, {
                $inc: { challengeCount: -1 },
            });
            if (project) {
                await projectModel_1.default.findByIdAndUpdate(project, {
                    $inc: { challengeCount: 1 },
                });
            }
        }
        const updatedChallenge = await challenge.save();
        res.status(200).json({
            message: "Challenge updated successfully",
            challenge: updatedChallenge,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.updateChallenge = updateChallenge;
const deleteChallenge = async (req, res) => {
    try {
        const challenge = await challengeModel_1.default.findByIdAndDelete(req.params.id);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }
        if (challenge.project) {
            await projectModel_1.default.findByIdAndUpdate(challenge.project, {
                $inc: { challengeCount: -1 },
            });
        }
        await challengeModel_1.default.deleteOne({ _id: challenge._id });
        await userModel_1.default.updateMany({ challenges: challenge._id }, { $pull: { challenges: challenge._id } });
        await sharedChallengeModel_1.default.deleteMany({ challenge: challenge._id });
        await commentModel_1.default.deleteMany({ sharedChallenge: { $exists: true } });
        res.status(200).json({ message: "Challenge deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.deleteChallenge = deleteChallenge;
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel_1.default.find().select("-password");
        res.status(200).json({ users });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel_1.default.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getUserById = getUserById;
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel_1.default.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.deleteUser = deleteUser;
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { firstName, lastName, email, track, skillLevel, role, streak, points, rank, completedChallenges, challengesViews, appreciations, feedback, } = req.body;
        const updatedData = {};
        if (firstName)
            updatedData.firstName = firstName;
        if (lastName)
            updatedData.lastName = lastName;
        if (email)
            updatedData.email = email;
        if (track)
            updatedData.track = track;
        if (skillLevel)
            updatedData.skillLevel = skillLevel;
        if (role)
            updatedData.role = role;
        if (streak)
            updatedData.streak = streak;
        if (points)
            updatedData.points = points;
        if (rank)
            updatedData.rank = rank;
        if (completedChallenges)
            updatedData.completedChallenges = completedChallenges;
        if (challengesViews)
            updatedData.challengesViews = challengesViews;
        if (appreciations)
            updatedData.appreciations = appreciations;
        if (feedback)
            updatedData.feedback = feedback;
        const user = await userModel_1.default.findByIdAndUpdate(userId, updatedData, {
            new: true,
            runValidators: true,
        }).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User updated successfully", user });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.updateUser = updateUser;
const getReports = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user || user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const reportedComments = await commentModel_1.default.find({
            "reports.0": { $exists: true },
        })
            .populate({
            path: "user",
            select: "firstName lastName email username",
        })
            .populate({
            path: "sharedChallenge",
            populate: [
                { path: "user", select: "username" },
                { path: "challenge", select: "challengeId" },
            ],
            select: "_id",
        })
            .populate({
            path: "reports",
            select: "email",
        })
            .sort({ createdAt: -1 })
            .lean();
        // تصفية التقارير اللي ليها sharedChallenge
        const validReports = reportedComments.filter((comment) => comment.sharedChallenge);
        const reports = validReports.map((comment) => ({
            _id: comment._id,
            content: comment.content,
            createdAt: comment.createdAt,
            status: comment.status,
            deletedAt: comment.deletedAt,
            user: {
                _id: comment.user._id,
                firstName: comment.user.firstName,
                lastName: comment.user.lastName,
                email: comment.user.email,
                username: comment.user.username,
            },
            sharedChallenge: {
                _id: comment.sharedChallenge._id,
                username: comment.sharedChallenge.user?.username, // مهم!
                challengeId: comment.sharedChallenge.challenge?.challengeId, // مهم!
            },
            reports: comment.reports.map((r) => r.email || "Unknown"),
        }));
        res.status(200).json({ reports });
    }
    catch (error) {
        console.error("Error in getReports:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getReports = getReports;
// حل التقرير
const resolveReport = async (req, res) => {
    try {
        const { id } = req.params; // Comment ID
        const comment = await commentModel_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        comment.status = "resolved";
        await comment.save();
        res.status(200).json({ message: "Report resolved" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.resolveReport = resolveReport;
// حذف التعليق فعليًا
const deleteCommentAdmin = async (req, res) => {
    try {
        const { id } = req.params; // Comment ID
        const comment = await commentModel_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        // تحديث الحالة إلى resolved وتسجيل وقت الحذف
        comment.status = "resolved";
        comment.deletedAt = new Date();
        await comment.save();
        res.status(200).json({ message: "Comment deleted and report resolved" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.deleteCommentAdmin = deleteCommentAdmin;
// حظر المستخدم
const banUser = async (req, res) => {
    try {
        const { id } = req.params; // User ID
        const user = await userModel_1.default.findById(id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        // إعادة تعيين تقدم المستخدم
        user.streak = 0;
        user.points = 0;
        user.completedChallenges = 0;
        user.challenges = [];
        user.startedChallenges = [];
        user.badges = [];
        user.rank = "Bronze";
        // حظر لمدة يومين
        const banDuration = 2 * 24 * 60 * 60 * 1000; // 2 days in ms
        user.banUntil = new Date(Date.now() + banDuration);
        await user.save();
        await commentModel_1.default.updateMany({ user: id, "reports.0": { $exists: true }, status: "pending" }, { $set: { status: "banned" } });
        const updatedComments = await commentModel_1.default.find({
            user: id,
            "reports.0": { $exists: true },
        })
            .populate("user", "firstName lastName email")
            .populate({
            path: "sharedChallenge",
            select: "_id",
            match: { _id: { $exists: true } },
        })
            .populate("reports", "email")
            .lean();
        const updatedReports = updatedComments
            .filter((comment) => comment.sharedChallenge && comment.sharedChallenge._id)
            .map((report) => ({
            ...report,
            reports: report.reports.map((reporter) => reporter.email || "Unknown"),
        }));
        res.status(200).json({
            message: "User banned for 2 days and related reports marked as banned",
            updatedReports, // إرجاع التقارير المحدثة
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.banUser = banUser;
const getActivities = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user || user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        // جلب التعليقات
        const comments = await commentModel_1.default.find({ deletedAt: null })
            .populate("user", "firstName lastName email")
            .populate("sharedChallenge", "challenge")
            .lean()
            .then((comments) => comments.map((comment) => ({
            _id: comment._id,
            userName: `${comment.user.firstName} ${comment.user.lastName}`,
            email: comment.user.email,
            activityType: "Comment",
            activityDetails: comment.content,
            activityId: comment._id,
            relatedId: comment.sharedChallenge?._id || "",
            createdAt: comment.createdAt,
        })));
        // جلب المشاركات
        const shares = await sharedChallengeModel_1.default.find()
            .populate("user", "firstName lastName email")
            .populate("challenge", "name")
            .lean()
            .then((shares) => shares.map((share) => ({
            _id: share._id,
            userName: `${share.user.firstName} ${share.user.lastName}`,
            email: share.user.email,
            activityType: "Share",
            activityDetails: share.description,
            activityId: share._id,
            relatedId: share.challenge?._id || "",
            createdAt: share.createdAt,
        })));
        // جلب الإعجابات
        const likes = await sharedChallengeModel_1.default.find({ "likedBy.0": { $exists: true } })
            .populate("user", "firstName lastName email")
            .populate("likedBy", "firstName lastName email")
            .lean()
            .then((sharedChallenges) => sharedChallenges.flatMap((share) => share.likedBy.map((liker) => ({
            _id: `${share._id}-${liker._id}`,
            userName: `${liker.firstName} ${liker.lastName}`,
            email: liker.email,
            activityType: "Like",
            activityDetails: `Liked shared challenge: ${share.description.substring(0, 50)}...`,
            activityId: share._id,
            relatedId: share.challenge?._id || "",
            createdAt: share.createdAt,
        }))));
        // دمج الأنشطة وترتيبها حسب تاريخ الإنشاء
        const activities = [...comments, ...shares, ...likes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.status(200).json({ activities });
    }
    catch (error) {
        console.error("Error in getActivities:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getActivities = getActivities;
const changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters" });
        }
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ message: "Password changed successfully" });
    }
    catch (error) {
        console.error("Error in changePassword:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.changePassword = changePassword;
const getDashboardStats = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user || user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        // === المستخدمين النشطين (Active Users) ===
        const activeUsers = await userModel_1.default.countDocuments({ isOnline: true });
        const totalUsers = await userModel_1.default.countDocuments();
        const lastMonthUsers = await userModel_1.default.countDocuments({
            createdAt: { $lte: lastMonth },
        });
        const usersChange = lastMonthUsers
            ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100
            : 0;
        const totalComments = await commentModel_1.default.countDocuments();
        const lastMonthComments = await commentModel_1.default.countDocuments({
            createdAt: { $lte: lastMonth },
        });
        const commentsChange = lastMonthComments
            ? ((totalComments - lastMonthComments) / lastMonthComments) * 100
            : 0;
        const challengeLikes = await challengeModel_1.default.aggregate([
            { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
        ]);
        const sharedChallengeLikes = await sharedChallengeModel_1.default.aggregate([
            { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
        ]);
        const totalLikes = (challengeLikes[0]?.totalLikes || 0) +
            (sharedChallengeLikes[0]?.totalLikes || 0);
        const lastMonthChallengeLikes = await challengeModel_1.default.aggregate([
            { $match: { createdAt: { $lte: lastMonth } } },
            { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
        ]);
        const lastMonthSharedChallengeLikes = await sharedChallengeModel_1.default.aggregate([
            { $match: { createdAt: { $lte: lastMonth } } },
            { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
        ]);
        const lastMonthLikes = (lastMonthChallengeLikes[0]?.totalLikes || 0) +
            (lastMonthSharedChallengeLikes[0]?.totalLikes || 0);
        const likesChange = lastMonthLikes
            ? ((totalLikes - lastMonthLikes) / lastMonthLikes) * 100
            : 0;
        const totalReportsResult = await commentModel_1.default.aggregate([
            { $group: { _id: null, totalReports: { $sum: { $size: "$reports" } } } },
        ]);
        const totalReports = totalReportsResult[0]?.totalReports || 0;
        const lastMonthReportsResult = await commentModel_1.default.aggregate([
            { $match: { createdAt: { $lte: lastMonth } } },
            { $group: { _id: null, totalReports: { $sum: { $size: "$reports" } } } },
        ]);
        const lastMonthReports = lastMonthReportsResult[0]?.totalReports || 0;
        const reportsChange = lastMonthReports
            ? ((totalReports - lastMonthReports) / lastMonthReports) * 100
            : 0;
        const yearQuery = req.query.year ? req.query.year : null;
        let matchFilter = {};
        let startDate, endDate;
        if (yearQuery && yearQuery !== "all") {
            const year = parseInt(yearQuery);
            if (isNaN(year)) {
                return res.status(400).json({ message: "Invalid year provided" });
            }
            startDate = new Date(year, 0, 1);
            endDate = new Date(year + 1, 0, 1);
            matchFilter = { createdAt: { $gte: startDate, $lt: endDate } };
        }
        else {
            matchFilter = {};
        }
        const tracksDistribution = await userModel_1.default.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: "$track",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    track: "$_id",
                    count: 1,
                    _id: 0,
                },
            },
        ]);
        const levelsDistribution = await userModel_1.default.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: "$skillLevel",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    level: "$_id",
                    count: 1,
                    _id: 0,
                },
            },
        ]);
        let signupMatch = matchFilter;
        if (!yearQuery) {
            const currentDate = new Date();
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
            signupMatch = { createdAt: { $gte: startDate, $lt: endDate } };
        }
        const newUserSignups = await userModel_1.default.aggregate([
            { $match: signupMatch },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { month: "$_id", count: 1, _id: 0 } },
        ]);
        const currentDate = new Date();
        const monthQuery = req.query.month
            ? parseInt(req.query.month)
            : currentDate.getMonth() + 1;
        let yearForTop = req.query.year && req.query.year !== "all"
            ? parseInt(req.query.year)
            : currentDate.getFullYear();
        if (isNaN(monthQuery) || monthQuery < 1 || monthQuery > 12) {
            return res.status(400).json({ message: "Invalid month provided" });
        }
        if (isNaN(yearForTop)) {
            return res.status(400).json({ message: "Invalid year provided" });
        }
        let top10Creatives = [];
        let monthName = currentDate.toLocaleString("default", { month: "long" });
        if (yearQuery !== "all") {
            const monthStart = new Date(yearForTop, monthQuery - 1, 1);
            const monthEnd = new Date(yearForTop, monthQuery, 0);
            if (isNaN(monthStart.getTime()) || isNaN(monthEnd.getTime())) {
                return res
                    .status(400)
                    .json({ message: "Invalid date range for top creatives" });
            }
            monthName = monthStart.toLocaleString("default", { month: "long" });
            top10Creatives = await userModel_1.default.find({
                lastLogin: {
                    $gte: monthStart,
                    $lte: monthEnd,
                    $exists: true,
                    $ne: null,
                },
            })
                .sort({ points: -1 })
                .limit(10)
                .select("firstName lastName streak points track");
        }
        else {
            top10Creatives = await userModel_1.default.find({
                points: { $exists: true, $ne: null },
            })
                .sort({ points: -1 })
                .limit(10)
                .select("firstName lastName streak points track");
            monthName = "All Time";
        }
        const availableYearsResult = await userModel_1.default.aggregate([
            { $group: { _id: { $year: "$createdAt" } } },
            { $sort: { _id: 1 } },
            { $project: { year: "$_id", _id: 0 } },
        ]);
        const availableYears = availableYearsResult.map((y) => y.year);
        res.status(200).json({
            totalUsers,
            usersChange,
            totalComments,
            commentsChange,
            totalLikes,
            likesChange,
            totalReports,
            reportsChange,
            activeUsers,
            tracksDistribution,
            levelsDistribution,
            newUserSignups,
            top10Creatives: top10Creatives.map((u) => ({
                name: `${u.firstName} ${u.lastName}`,
                streak: u.streak,
                points: u.points,
                track: u.track || "Unknown Track",
            })),
            monthName,
            availableYears,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
const registerAdmin = async (req, res) => {
    try {
        console.log("Starting registerAdmin");
        const currentUser = await userModel_1.default.findById(req.user?.id);
        console.log("Current user:", currentUser);
        if (!currentUser || currentUser.role !== "Admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const { firstName, lastName, email, password, role } = req.body;
        console.log("Received data:", {
            firstName,
            lastName,
            email,
            password,
            role,
        });
        if (!firstName || !lastName || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const userExists = await userModel_1.default.findOne({ email });
        console.log("User exists check:", userExists);
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        console.log("Password hashed");
        let profilePicture;
        if (req.file) {
            try {
                profilePicture = await (0, cloudinary_1.uploadToCloudinary)(req.file, 'streakup/users');
            }
            catch (error) {
                console.error('Error uploading to Cloudinary:', error);
                return res.status(500).json({ message: "Error uploading profile picture" });
            }
        }
        console.log("Profile picture:", profilePicture);
        const user = await userModel_1.default.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
            profilePicture,
            track: "Frontend Development",
            skillLevel: "Advanced",
        });
        console.log("User created:", user);
        res.status(201).json({
            message: "Admin created successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Error in registerAdmin:", error.stack);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.registerAdmin = registerAdmin;
const getRewardSettings = async (req, res) => {
    try {
        const setting = await systemSettingModel_1.default.findOne({ key: "activeRewards" });
        res.status(200).json({ activeRewards: setting ? setting.value : [] });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getRewardSettings = getRewardSettings;
const updateRewardSettings = async (req, res) => {
    try {
        const { activeRewards } = req.body; // Array of active rewards or empty array to lock all
        // Validate activeRewards is an array
        if (!Array.isArray(activeRewards)) {
            return res.status(400).json({ message: "activeRewards must be an array" });
        }
        // Validate each reward name
        const validRewards = ["Highlight Shared Challenge", "Streak Saver", "Challenge Boost"];
        for (const reward of activeRewards) {
            if (!validRewards.includes(reward)) {
                return res.status(400).json({ message: `Invalid reward name: ${reward}` });
            }
        }
        await systemSettingModel_1.default.findOneAndUpdate({ key: "activeRewards" }, { value: activeRewards }, { upsert: true, new: true });
        res.status(200).json({ message: "Reward settings updated", activeRewards });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.updateRewardSettings = updateRewardSettings;

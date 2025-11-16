"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationsAsRead = exports.getNotifications = void 0;
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const notifications = await notificationModel_1.default.find({ recipient: userId })
            .populate({
            path: "sender",
            select: "firstName lastName profilePicture",
        })
            .populate({
            path: "sharedChallenge",
            populate: [
                { path: "challenge", select: "name challengeId" },
                { path: "user", select: "username" }, // أضف ده
            ],
        })
            .populate({
            path: "comment", // جديد: populate للـ comment عشان نجيب الـ _id
            select: "_id",
        })
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();
        const formattedNotifications = notifications.map((notif) => ({
            _id: notif._id.toString(),
            sender: {
                _id: notif.sender._id.toString(),
                firstName: notif.sender.firstName,
                lastName: notif.sender.lastName,
                profilePicture: notif.sender.profilePicture || null,
            },
            type: notif.type,
            message: notif.message,
            createdAt: notif.createdAt,
            read: notif.read,
            challengeLinkId: notif.sharedChallenge?.challenge?.challengeId || null,
            username: notif.sharedChallenge?.user?.username || null,
            challenge: {
                name: notif.sharedChallenge?.challenge?.name || "Unknown Challenge",
            },
            commentId: notif.comment?._id?.toString() || null, // جديد: ID الكومنت (لو موجود)
        }));
        res.status(200).json({ notifications: formattedNotifications });
    }
    catch (error) {
        console.error("Error in getNotifications:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getNotifications = getNotifications;
const markNotificationsAsRead = async (req, res) => {
    await notificationModel_1.default.updateMany({ recipient: req.user?.id, read: false }, { read: true });
    res.status(200).json({ message: "Notifications marked as read" });
};
exports.markNotificationsAsRead = markNotificationsAsRead;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTrack = exports.addTrack = exports.getTracks = exports.getPublicTracks = void 0;
const trackModel_1 = __importDefault(require("../models/trackModel"));
const challengeModel_1 = __importDefault(require("../models/challengeModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const projectModel_1 = __importDefault(require("../models/projectModel"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// جلب كل الـ Tracks للعامة (اسم وأيقونة فقط)
const getPublicTracks = async (req, res) => {
    try {
        const tracks = await trackModel_1.default.find();
        res.status(200).json({
            tracks: tracks.map((track) => ({
                name: track.name,
                icon: track.icon || null,
                description: track.description || null,
                // points: track.points || 0,  ← احذف هذا
            })),
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getPublicTracks = getPublicTracks;
// جلب كل الـ Tracks للأدمن (اسم وأيقونة فقط)
const getTracks = async (req, res) => {
    try {
        if (req.user?.role !== "Admin" && req.user?.role !== "SuperAdmin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const tracks = await trackModel_1.default.find();
        res.status(200).json({
            tracks: tracks.map((track) => ({
                name: track.name,
                icon: track.icon || null,
                description: track.description || null,
                // points: track.points || 0,  ← احذف هذا
            })),
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getTracks = getTracks;
// إضافة Track جديد (اسم وأيقونة فقط)
const addTrack = async (req, res) => {
    try {
        if (req.user?.role !== "Admin" && req.user?.role !== "SuperAdmin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const { name, description } = req.body; // أضف description
        const iconFile = req.file;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Track name is required" });
        }
        const existingTrack = await trackModel_1.default.findOne({ name: name.trim() });
        if (existingTrack) {
            return res.status(400).json({ message: "Track already exists" });
        }
        let iconPath;
        if (iconFile) {
            iconPath = `/uploads/${iconFile.filename}`; // تأكد من المسار
        }
        const track = await trackModel_1.default.create({
            name: name.trim(),
            description: description?.trim() || null,
            icon: iconPath,
        });
        res.status(201).json({
            message: "Track added successfully",
            track: {
                name: track.name,
                icon: track.icon || null,
                description: track.description || null,
            },
        });
    }
    catch (error) {
        console.error("[addTrack] Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.addTrack = addTrack;
// حذف Track
const deleteTrack = async (req, res) => {
    try {
        if (req.user?.role !== "Admin" && req.user?.role !== "SuperAdmin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const { trackName } = req.params;
        const track = await trackModel_1.default.findOne({ name: trackName });
        if (!track) {
            return res.status(404).json({ message: "Track not found" });
        }
        const challengeCount = await challengeModel_1.default.countDocuments({
            category: trackName,
        });
        const userCount = await userModel_1.default.countDocuments({ track: trackName });
        const projectCount = await projectModel_1.default.countDocuments({ track: trackName });
        if (challengeCount > 0 || userCount > 0 || projectCount > 0) {
            return res.status(400).json({
                message: "Cannot delete track because it is used in challenges, users, or projects",
            });
        }
        if (track.icon) {
            const iconPath = path_1.default.join(__dirname, "../..", track.icon);
            if (fs_1.default.existsSync(iconPath)) {
                fs_1.default.unlinkSync(iconPath);
            }
        }
        await trackModel_1.default.deleteOne({ _id: track._id });
        res.status(200).json({ message: "Track deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.deleteTrack = deleteTrack;

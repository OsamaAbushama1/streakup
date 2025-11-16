import { Request, Response } from "express";
import Track from "../models/trackModel";
import Challenge from "../models/challengeModel";
import User from "../models/userModel";
import Project from "../models/projectModel";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";

interface AuthRequest extends Request {
  user?: { id: string; role?: string };
}

// جلب كل الـ Tracks للعامة (اسم وأيقونة فقط)
export const getPublicTracks = async (req: Request, res: Response) => {
  try {
    const tracks = await Track.find();
    res.status(200).json({
      tracks: tracks.map((track) => ({
        name: track.name,
        icon: track.icon || null,
        description: track.description || null,
        // points: track.points || 0,  ← احذف هذا
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// جلب كل الـ Tracks للأدمن (اسم وأيقونة فقط)
export const getTracks = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "Admin" && req.user?.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const tracks = await Track.find();
    res.status(200).json({
      tracks: tracks.map((track) => ({
        name: track.name,
        icon: track.icon || null,
        description: track.description || null,
        // points: track.points || 0,  ← احذف هذا
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// إضافة Track جديد (اسم وأيقونة فقط)
export const addTrack = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "Admin" && req.user?.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, description } = req.body; // أضف description
    const iconFile = req.file;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Track name is required" });
    }

    const existingTrack = await Track.findOne({ name: name.trim() });
    if (existingTrack) {
      return res.status(400).json({ message: "Track already exists" });
    }

    let iconPath: string | undefined;
    if (iconFile) {
      try {
        iconPath = await uploadToCloudinary(iconFile, 'streakup/tracks');
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ message: "Error uploading track icon" });
      }
    }

    const track = await Track.create({
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
  } catch (error: any) {
    console.error("[addTrack] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// حذف Track
export const deleteTrack = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "Admin" && req.user?.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const { trackName } = req.params;
    const track = await Track.findOne({ name: trackName });
    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    const challengeCount = await Challenge.countDocuments({
      category: trackName,
    });
    const userCount = await User.countDocuments({ track: trackName });
    const projectCount = await Project.countDocuments({ track: trackName });

    if (challengeCount > 0 || userCount > 0 || projectCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete track because it is used in challenges, users, or projects",
      });
    }

    // Delete icon from Cloudinary if it exists
    if (track.icon && track.icon.includes('cloudinary.com')) {
      try {
        await deleteFromCloudinary(track.icon);
      } catch (error) {
        console.error('Error deleting icon from Cloudinary:', error);
        // Continue with track deletion even if icon deletion fails
      }
    }

    await Track.deleteOne({ _id: track._id });
    res.status(200).json({ message: "Track deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

import { Request, Response } from "express";
import SharedChallenge from "../models/sharedChallengeModel";
import Challenge from "../models/challengeModel";
import User from "../models/userModel";
import Comment from "../models/commentModel";
import Notification from "../models/notificationModel";
import mongoose, { Types } from "mongoose";
import {
  generateCertificate,
  sendCertificateEmail,
} from "../utils/generateCertificate";

interface AuthRequest extends Request {
  user?: { id: string };
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notifications = await Notification.find({ recipient: userId })
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

    const formattedNotifications = notifications.map((notif: any) => ({
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
  } catch (error: any) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const markNotificationsAsRead = async (
  req: AuthRequest,
  res: Response
) => {
  await Notification.updateMany(
    { recipient: req.user?.id, read: false },
    { read: true }
  );
  res.status(200).json({ message: "Notifications marked as read" });
};

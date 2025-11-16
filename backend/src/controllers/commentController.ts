import { Request, Response } from "express";
import SharedChallenge from "../models/sharedChallengeModel";
import User from "../models/userModel";
import Comment from "../models/commentModel";
import Notification from "../models/notificationModel";
import mongoose, { Types } from "mongoose";

interface AuthRequest extends Request {
  user?: { id: string };
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { sharedChallengeId } = req.params; // غيرنا من challengeId

    if (!mongoose.Types.ObjectId.isValid(sharedChallengeId)) {
      return res.status(400).json({ message: "Invalid shared challenge ID" });
    }

    const sharedChallenge = await SharedChallenge.findById(sharedChallengeId)
      .populate("user")
      .populate({
        path: "challenge",
        select: "name challengeId",
      });

    if (!sharedChallenge) {
      return res.status(404).json({ message: "Shared challenge not found" });
    }

    const comments = await Comment.find({
      sharedChallenge: sharedChallenge._id,
      deletedAt: null,
    })
      .populate({
        path: "user",
        select: "firstName lastName profilePicture username",
      })
      .lean();

    const userId = req.user?.id
      ? new mongoose.Types.ObjectId(req.user.id)
      : null;
    const isOwner = sharedChallenge.user?._id.equals(userId);

    const commentsWithLikesAndReports = comments.map((comment: any) => ({
      ...comment,
      isLiked: userId
        ? comment.likedBy.some((id: Types.ObjectId) => id.equals(userId))
        : false,
      isReported: userId
        ? comment.reports.some((id: Types.ObjectId) => id.equals(userId))
        : false,
    }));

    res.status(200).json({
      comments: commentsWithLikesAndReports,
      isOwner,
      currentUserId: userId?.toString() || null,
    });
  } catch (error: any) {
    console.error("[getComments] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
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

    const sharedChallenge = await SharedChallenge.findById(sharedChallengeId);
    if (!sharedChallenge) {
      return res.status(404).json({ message: "Shared challenge not found" });
    }

    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });

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

    const comment = await Comment.create({
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
      const sender = await User.findById(req.user?.id);
      await Notification.create({
        recipient: sharedChallenge.user,
        sender: req.user?.id,
        type: "comment",
        sharedChallenge: sharedChallenge._id,
        comment: comment._id,
        message: `${sender?.firstName} ${sender?.lastName} commented on your challenge`,
      });
    }

    res.status(201).json({ comment });
  } catch (error: any) {
    console.error("[addComment] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const likeComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = new mongoose.Types.ObjectId(req.user?.id);
    const isLiked = comment.likedBy.some((id: Types.ObjectId) =>
      id.equals(userId)
    );

    if (isLiked) {
      comment.likedBy = comment.likedBy.filter(
        (id: Types.ObjectId) => !id.equals(userId)
      );
      await Notification.deleteOne({
        recipient: comment.user,
        sender: req.user?.id,
        type: "like",
        sharedChallenge: comment.sharedChallenge._id,
        comment: comment._id,
      });
    } else {
      comment.likedBy.push(userId);

      if (comment.user.toString() !== req.user?.id) {
        const sender = await User.findById(req.user?.id).select(
          "firstName lastName profilePicture"
        );
        const sharedChallenge = await SharedChallenge.findById(
          comment.sharedChallenge
        ).populate({
          path: "challenge",
          select: "name",
        });

        const commentPreview =
          comment.content.length > 30
            ? comment.content.trim().substring(0, 30) + "..."
            : comment.content.trim();

        await Notification.create({
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
  } catch (error: any) {
    console.error("Error in likeComment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const reportComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const comment = await Comment.findById(commentId).populate(
      "sharedChallenge"
    );
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = new mongoose.Types.ObjectId(req.user?.id);

    if (comment.reports.some((id: Types.ObjectId) => id.equals(userId))) {
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
  } catch (error: any) {
    console.error("Error in reportComment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

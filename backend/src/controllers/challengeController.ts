import { Request, Response } from "express";
import Challenge from "../models/challengeModel";
import SharedChallenge from "../models/sharedChallengeModel";
import Comment from "../models/commentModel";
import Track from "../models/trackModel";
import User from "../models/userModel";
import Project from "../models/projectModel";
import mongoose, { Types } from "mongoose";
import {
  generateCertificate,
  sendCertificateEmail,
} from "../utils/generateCertificate";
import { uploadMultipleToCloudinary } from "../utils/cloudinary";

interface AuthRequest extends Request {
  user?: { id: string; role?: string };
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

const generateSharedChallengeId = async (
  challengeId: string,
  challengeObjectId: mongoose.Types.ObjectId
) => {
  const count = await SharedChallenge.countDocuments({
    challenge: challengeObjectId,
  });
  return `${challengeId}-${count + 1}`;
};

const updateUserRank = (
  completedProjects: number
): "Platinum" | "Gold" | "Silver" | "Bronze" => {
  if (completedProjects >= 6) return "Platinum";
  if (completedProjects >= 4) return "Gold";
  if (completedProjects >= 2) return "Silver";
  return "Bronze";
};

export const getAllChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
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
      challenges = await Challenge.find()
        .sort({ createdAt: 1 })
        .populate("createdBy", "firstName lastName")
        .populate("project", "name track");
    } else {
      challenges = await Challenge.find({ category: user.track })
        .sort({ createdAt: 1 })
        .populate("createdBy", "firstName lastName")
        .populate("project", "name track");
    }

    const currentDate = new Date();
    const challengesWithStatus = challenges.map((challenge) => {
      const createdAt = new Date(challenge.createdAt);
      const durationInMs = challenge.duration * 24 * 60 * 60 * 1000;
      const endDate = new Date(createdAt.getTime() + durationInMs);
      let status: "Active" | "Completed" | "Missed";

      if (
        user.challenges.some((challengeId) => challengeId.equals(challenge._id))
      ) {
        status = "Completed";
      } else if (currentDate <= endDate) {
        status = "Active";
      } else {
        status = "Missed";
      }

      return {
        ...challenge.toObject(),
        status,
      };
    });

    res.status(200).json({ challenges: challengesWithStatus });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getChallengeById = async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await Challenge.findOne({
      challengeId: req.params.id,
    })
      .populate("createdBy", "firstName lastName")
      .populate("project", "name track");
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const user = await User.findById(req.user?.id);
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
    let status: "Active" | "Started" | "Completed" | "Missed";

    if (
      user.challenges.some((challengeId) => challengeId.equals(challenge._id))
    ) {
      status = "Completed";
    } else if (
      user.startedChallenges.some((challengeId) =>
        challengeId.equals(challenge._id)
      )
    ) {
      status = "Started";
    } else if (currentDate <= endDate) {
      status = "Active";
    } else {
      status = "Missed";
    }

    res.status(200).json({ challenge: { ...challenge.toObject(), status } });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getChallengesByProject = async (
  req: AuthRequest,
  res: Response
) => {
  const { project } = req.query;

  if (
    !project ||
    typeof project !== "string" ||
    !mongoose.isValidObjectId(project)
  ) {
    return res.status(400).json({ message: "Invalid or missing project ID" });
  }

  try {
    const challenges = await Challenge.find({ project })
      .populate("createdBy", "firstName lastName")
      .populate("project", "name track");

    res.status(200).json({ challenges });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const likeChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.banUntil && new Date() < user.banUntil) {
      return res
        .status(403)
        .json({ message: "You are banned from liking challenges" });
    }

    const challenge = await Challenge.findOne({ challengeId: id }).populate(
      "project",
      "_id name track points"
    );
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
        const project = await mongoose
          .model("Project")
          .findById(challenge.project._id);
        if (!project)
          return res.status(404).json({ message: "Project not found" });

        const userCompleted = await Challenge.find({
          _id: { $in: user.challenges },
          project: challenge.project._id,
        });
        totalCompletedPoints = userCompleted.reduce(
          (sum, ch) => sum + (ch.points || 50),
          0
        );
      }

      user.challenges.push(challenge._id);
      user.completedChallenges += 1;
      user.streak += 1;
      user.points += challenge.points || 50;

      if (challenge.project) {
        totalCompletedPoints += challenge.points || 50;
        const project = await mongoose
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
          const certificateBuffer = await generateCertificate({
            name: `${user.firstName} ${user.lastName}`,
            rank: user.rank as any,
          });
          await sendCertificateEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            user.rank,
            certificateBuffer
          );
          console.log(
            `Certificate sent to ${user.email} for ${user.rank} rank`
          );
        } catch (emailErr) {
          console.error("Failed to send certificate email:", emailErr);
        }
      }
    }

    res.status(200).json({ message: "Challenge completed successfully" });
  } catch (error: any) {
    console.error("Error in likeChallenge:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const startChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const challenge = await Challenge.findOne({ challengeId: id });
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    if (challenge.category !== user.track) {
      return res
        .status(403)
        .json({ message: "Challenge does not match your track" });
    }

    if (
      !user.startedChallenges.some((challengeId) =>
        challengeId.equals(challenge._id)
      ) &&
      !user.challenges.some((challengeId) => challengeId.equals(challenge._id))
    ) {
      user.startedChallenges.push(challenge._id);
      await user.save();
    }

    res.status(200).json({ message: "Challenge started successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const shareChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.banUntil && new Date() < user.banUntil) {
      return res
        .status(403)
        .json({ message: "You are banned from sharing challenges" });
    }

    const challenge = await Challenge.findOne({ challengeId: id }).populate(
      "project",
      "_id name track points"
    );
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
    let images: string[] = [];
    if (files.length > 0) {
      try {
        images = await uploadMultipleToCloudinary(files, 'streakup/shared-challenges');
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ message: "Error uploading images" });
      }
    }

    const sharedChallengeId = await generateSharedChallengeId(
      id,
      challenge._id
    );
    const sharedChallenge = await SharedChallenge.create({
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
        const project = await mongoose
          .model("Project")
          .findById(challenge.project._id);
        if (!project)
          return res.status(404).json({ message: "Project not found" });

        const userCompleted = await Challenge.find({
          _id: { $in: user.challenges },
          project: challenge.project._id,
        });
        totalCompletedPoints = userCompleted.reduce(
          (sum, ch) => sum + (ch.points || 50),
          0
        );
      }

      user.challenges.push(challenge._id);
      user.completedChallenges += 1;
      user.streak += 1;
      user.points += challenge.points || 50;

      if (challenge.project) {
        totalCompletedPoints += challenge.points || 50;
        const project = await mongoose
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
          const certificateBuffer = await generateCertificate({
            name: `${user.firstName} ${user.lastName}`,
            rank: user.rank as any,
          });
          await sendCertificateEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            user.rank,
            certificateBuffer
          );
          console.log(
            `Certificate sent to ${user.email} for ${user.rank} rank`
          );
        } catch (emailErr) {
          console.error("Failed to send certificate email:", emailErr);
        }
      }
    }

    await Challenge.updateOne(
      { _id: challenge._id },
      { $set: { shared: true } }
    );

    const populated = await SharedChallenge.findById(sharedChallenge._id)
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
  } catch (error: any) {
    console.error("Error in shareChallenge:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const recordView = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid challenge ID" });
    }
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    challenge.views += 1;
    await challenge.save();
    res.status(200).json({ message: "View recorded successfully", challenge });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const incrementChallengeViews = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { challengeId } = req.params;
    console.log(
      `[incrementChallengeViews] Received challengeId: ${challengeId}`
    );

    const challenge = await Challenge.findOne({ challengeId });
    if (!challenge) {
      console.log(
        `[incrementChallengeViews] Challenge not found for challengeId: ${challengeId}`
      );
      return res.status(404).json({ message: "Challenge not found" });
    }
    console.log(`[incrementChallengeViews] Found challenge: ${challenge._id}`);

    const userId = req.user?.id
      ? new mongoose.Types.ObjectId(req.user.id)
      : null;

    if (!userId) {
      console.log(
        `[incrementChallengeViews] No userId provided, view not counted`
      );
      return res.status(200).json({
        message: "View not counted for unauthenticated user",
        views: challenge.views,
      });
    }

    if (
      !challenge.viewedBy.some((viewedId: Types.ObjectId) =>
        viewedId.equals(userId)
      )
    ) {
      challenge.viewedBy.push(userId);
      challenge.views = challenge.viewedBy.length;
      await challenge.save();

      console.log(
        `[incrementChallengeViews] View added for Challenge ${challenge._id} by user ${userId}`,
        {
          views: challenge.views,
          viewedBy: challenge.viewedBy.map((id) => id.toString()),
        }
      );
    } else {
      console.log(
        `[incrementChallengeViews] User ${userId} already viewed Challenge ${challenge._id}`
      );
    }

    res.status(200).json({
      message: "View count incremented if unique",
      views: challenge.views,
    });
  } catch (error: any) {
    console.error("[incrementChallengeViews] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getNonCompletedChallenges = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.banUntil && new Date() < user.banUntil) {
      return res.status(403).json({
        message: "You are banned from viewing challenges for 2 days.",
        challenges: [],
      });
    }
    let challenges = await Challenge.find({ category: user.track })
      .sort({ createdAt: 1 })
      .populate("createdBy", "firstName lastName");

    challenges = challenges.filter(
      (challenge) => !user.challenges.some((id) => id.equals(challenge._id))
    );

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
      let status: "Active" | "Missed" =
        currentDate <= endDate ? "Active" : "Missed";

      return {
        ...challenge.toObject(),
        status,
      };
    });

    res.status(200).json({ challenges: challengesWithStatus });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCompletedProjects = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).populate("challenges");
    if (!user) return res.status(404).json({ message: "User not found" });

    const projects = await mongoose.model("Project").find({});
    const completedProjects = [];

    for (const project of projects) {
      const projectChallenges = await Challenge.find({ project: project._id });
      const userCompletedChallenges = await Challenge.find({
        _id: { $in: user.challenges },
        project: project._id,
      });

      const totalCompletedPoints = userCompletedChallenges.reduce(
        (sum, ch) => sum + (ch.points || 50),
        0
      );

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
  } catch (error: any) {
    console.error("Error in getCompletedProjects:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

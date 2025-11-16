import { Request, Response } from "express";
import User from "../models/userModel";
import Comment from "../models/commentModel";
import Challenge from "../models/challengeModel";
import SharedChallenge from "../models/sharedChallengeModel";
import Track from "../models/trackModel";
import Project from "../models/projectModel";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { uploadToCloudinary, uploadMultipleToCloudinary } from "../utils/cloudinary";

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthRequest extends Request {
  user?: { id: string; role?: string };
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

const FIXED_TRACKS = ["UI/UX Design", "Graphic Design", "Frontend Development"];

const isValidTrack = async (trackName: string): Promise<boolean> => {
  if (FIXED_TRACKS.includes(trackName)) return true;
  const track = await Track.findOne({ name: trackName });
  return !!track;
};
const generateChallengeId = async (category: string): Promise<string> => {
  const count = await Challenge.countDocuments({ category });
  const prefix = category
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\/+/g, "-");
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
};

export const createChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      category,
      duration,
      points,
      overview,
      challengeDetails,
      challengeSteps,
      requirements,
      project,
    } = req.body;

    if (
      !name ||
      !category ||
      !duration ||
      !points ||
      !overview ||
      !challengeDetails ||
      !challengeSteps ||
      !requirements
    ) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (!(await isValidTrack(category))) {
      return res.status(400).json({ message: "Invalid track" });
    }
    // التحقق من المشروع
    if (project) {
      const projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(400).json({ message: "Project not found" });
      }
      if (projectDoc.track !== category) {
        return res.status(400).json({
          message: "Project must belong to the same track as the challenge",
        });
      }
      const challengeCount = await Challenge.countDocuments({
        project: projectDoc._id,
      });
      if (challengeCount >= 6) {
        return res
          .status(400)
          .json({ message: "Project cannot have more than 6 challenges" });
      }
      const projectChallenges = await Challenge.find({
        project: projectDoc._id,
      });
      const currentPoints = projectChallenges.reduce(
        (sum, challenge) => sum + challenge.points,
        0
      );
      const totalPoints = currentPoints + parseInt(points);
      if (totalPoints > projectDoc.points) {
        return res.status(400).json({
          message: `Total challenge points (${totalPoints}) exceed project points (${projectDoc.points})`,
        });
      }
    }

    let previewImages: string[] = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      try {
        previewImages = await uploadMultipleToCloudinary(req.files, 'streakup/challenges');
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ message: "Error uploading preview images" });
      }
    }

    const challengeId = await generateChallengeId(category);

    const challenge = await Challenge.create({
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
    const populatedChallenge = await Challenge.findById(challenge._id).populate(
      "project",
      "_id name"
    );

    // تحديث challengeCount في المشروع إذا كان موجودًا
    if (project) {
      await Project.findByIdAndUpdate(project, {
        $inc: { challengeCount: 1 },
      });
    }

    res.status(201).json({
      message: "Challenge created successfully",
      challenge: populatedChallenge,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      category,
      duration,
      points,
      overview,
      challengeDetails,
      challengeSteps,
      requirements,
      existingImages,
      project,
    } = req.body;

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    if (category && !(await isValidTrack(category))) {
      return res.status(400).json({ message: "Invalid track" });
    }

    // التحقق من المشروع
    if (project) {
      const projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(400).json({ message: "Project not found" });
      }
      if (projectDoc.track !== (category || challenge.category)) {
        return res.status(400).json({
          message: "Project must belong to the same track as the challenge",
        });
      }
      const challengeCount = await Challenge.countDocuments({
        project: projectDoc._id,
        _id: { $ne: challenge._id }, // استثناء التحدي الحالي
      });
      if (challengeCount >= 6) {
        return res
          .status(400)
          .json({ message: "Project cannot have more than 6 challenges" });
      }
      const projectChallenges = await Challenge.find({
        project: projectDoc._id,
        _id: { $ne: challenge._id },
      });
      const currentPoints = projectChallenges.reduce(
        (sum, challenge) => sum + challenge.points,
        0
      );
      const totalPoints = currentPoints + parseInt(points || challenge.points);
      if (totalPoints > projectDoc.points) {
        return res.status(400).json({
          message: `Total challenge points (${totalPoints}) exceed project points (${projectDoc.points})`,
        });
      }
    }

    const files = Array.isArray(req.files) ? req.files : [];
    let newImages: string[] = [];
    if (files.length > 0) {
      try {
        newImages = await uploadMultipleToCloudinary(files, 'streakup/challenges');
      } catch (error) {
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
      await Project.findByIdAndUpdate(challenge.project, {
        $inc: { challengeCount: -1 },
      });
      if (project) {
        await Project.findByIdAndUpdate(project, {
          $inc: { challengeCount: 1 },
        });
      }
    }

    const updatedChallenge = await challenge.save();

    res.status(200).json({
      message: "Challenge updated successfully",
      challenge: updatedChallenge,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    if (challenge.project) {
      await Project.findByIdAndUpdate(challenge.project, {
        $inc: { challengeCount: -1 },
      });
    }

    await Challenge.deleteOne({ _id: challenge._id });
    await User.updateMany(
      { challenges: challenge._id },
      { $pull: { challenges: challenge._id } }
    );
    await SharedChallenge.deleteMany({ challenge: challenge._id });
    await Comment.deleteMany({ sharedChallenge: { $exists: true } });

    res.status(200).json({ message: "Challenge deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ users });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const {
      firstName,
      lastName,
      email,
      track,
      skillLevel,
      role,
      streak,
      points,
      rank,
      completedChallenges,
      challengesViews,
      appreciations,
      feedback,
    } = req.body;

    const updatedData: any = {};
    if (firstName) updatedData.firstName = firstName;
    if (lastName) updatedData.lastName = lastName;
    if (email) updatedData.email = email;
    if (track) updatedData.track = track;
    if (skillLevel) updatedData.skillLevel = skillLevel;
    if (role) updatedData.role = role;
    if (streak) updatedData.streak = streak;
    if (points) updatedData.points = points;
    if (rank) updatedData.rank = rank;
    if (completedChallenges)
      updatedData.completedChallenges = completedChallenges;
    if (challengesViews) updatedData.challengesViews = challengesViews;
    if (appreciations) updatedData.appreciations = appreciations;
    if (feedback) updatedData.feedback = feedback;

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reportedComments = await Comment.find({
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
    const validReports = reportedComments.filter(
      (comment) => comment.sharedChallenge
    );

    const reports = validReports.map((comment: any) => ({
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
      reports: comment.reports.map((r: any) => r.email || "Unknown"),
    }));

    res.status(200).json({ reports });
  } catch (error: any) {
    console.error("Error in getReports:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// حل التقرير
export const resolveReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Comment ID
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.status = "resolved";
    await comment.save();

    res.status(200).json({ message: "Report resolved" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// حذف التعليق فعليًا
export const deleteCommentAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Comment ID
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // تحديث الحالة إلى resolved وتسجيل وقت الحذف
    comment.status = "resolved";
    comment.deletedAt = new Date();
    await comment.save();

    res.status(200).json({ message: "Comment deleted and report resolved" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// حظر المستخدم
export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // User ID
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

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

    await Comment.updateMany(
      { user: id, "reports.0": { $exists: true }, status: "pending" },
      { $set: { status: "banned" } }
    );
    const updatedComments = await Comment.find({
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
      .filter(
        (comment) => comment.sharedChallenge && comment.sharedChallenge._id
      )
      .map((report) => ({
        ...report,
        reports: report.reports.map(
          (reporter: any) => reporter.email || "Unknown"
        ),
      }));

    res.status(200).json({
      message: "User banned for 2 days and related reports marked as banned",
      updatedReports, // إرجاع التقارير المحدثة
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // جلب التعليقات
    const comments = await Comment.find({ deletedAt: null })
      .populate<{ user: PopulatedUser }>("user", "firstName lastName email")
      .populate("sharedChallenge", "challenge")
      .lean()
      .then((comments) =>
        comments.map((comment) => ({
          _id: comment._id,
          userName: `${comment.user.firstName} ${comment.user.lastName}`,
          email: comment.user.email,
          activityType: "Comment" as const,
          activityDetails: comment.content,
          activityId: comment._id,
          relatedId: comment.sharedChallenge?._id || "",
          createdAt: comment.createdAt,
        }))
      );

    // جلب المشاركات
    const shares = await SharedChallenge.find()
      .populate<{ user: PopulatedUser }>("user", "firstName lastName email")
      .populate("challenge", "name")
      .lean()
      .then((shares) =>
        shares.map((share) => ({
          _id: share._id,
          userName: `${share.user.firstName} ${share.user.lastName}`,
          email: share.user.email,
          activityType: "Share" as const,
          activityDetails: share.description,
          activityId: share._id,
          relatedId: share.challenge?._id || "",
          createdAt: share.createdAt,
        }))
      );

    // جلب الإعجابات
    const likes = await SharedChallenge.find({ "likedBy.0": { $exists: true } })
      .populate<{ user: PopulatedUser }>("user", "firstName lastName email")
      .populate<{ likedBy: PopulatedUser[] }>(
        "likedBy",
        "firstName lastName email"
      )
      .lean()
      .then((sharedChallenges) =>
        sharedChallenges.flatMap((share) =>
          share.likedBy.map((liker) => ({
            _id: `${share._id}-${liker._id}`,
            userName: `${liker.firstName} ${liker.lastName}`,
            email: liker.email,
            activityType: "Like" as const,
            activityDetails: `Liked shared challenge: ${share.description.substring(
              0,
              50
            )}...`,
            activityId: share._id,
            relatedId: share.challenge?._id || "",
            createdAt: share.createdAt,
          }))
        )
      );

    // دمج الأنشطة وترتيبها حسب تاريخ الإنشاء
    const activities = [...comments, ...shares, ...likes].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json({ activities });
  } catch (error: any) {
    console.error("Error in getActivities:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // === المستخدمين النشطين (Active Users) ===
    const activeUsers = await User.countDocuments({ isOnline: true });
    const totalUsers = await User.countDocuments();
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $lte: lastMonth },
    });
    const usersChange = lastMonthUsers
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100
      : 0;

    const totalComments = await Comment.countDocuments();
    const lastMonthComments = await Comment.countDocuments({
      createdAt: { $lte: lastMonth },
    });
    const commentsChange = lastMonthComments
      ? ((totalComments - lastMonthComments) / lastMonthComments) * 100
      : 0;

    const challengeLikes = await Challenge.aggregate([
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
    ]);
    const sharedChallengeLikes = await SharedChallenge.aggregate([
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
    ]);
    const totalLikes =
      (challengeLikes[0]?.totalLikes || 0) +
      (sharedChallengeLikes[0]?.totalLikes || 0);

    const lastMonthChallengeLikes = await Challenge.aggregate([
      { $match: { createdAt: { $lte: lastMonth } } },
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
    ]);
    const lastMonthSharedChallengeLikes = await SharedChallenge.aggregate([
      { $match: { createdAt: { $lte: lastMonth } } },
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
    ]);
    const lastMonthLikes =
      (lastMonthChallengeLikes[0]?.totalLikes || 0) +
      (lastMonthSharedChallengeLikes[0]?.totalLikes || 0);
    const likesChange = lastMonthLikes
      ? ((totalLikes - lastMonthLikes) / lastMonthLikes) * 100
      : 0;

    const totalReportsResult = await Comment.aggregate([
      { $group: { _id: null, totalReports: { $sum: { $size: "$reports" } } } },
    ]);
    const totalReports = totalReportsResult[0]?.totalReports || 0;

    const lastMonthReportsResult = await Comment.aggregate([
      { $match: { createdAt: { $lte: lastMonth } } },
      { $group: { _id: null, totalReports: { $sum: { $size: "$reports" } } } },
    ]);
    const lastMonthReports = lastMonthReportsResult[0]?.totalReports || 0;
    const reportsChange = lastMonthReports
      ? ((totalReports - lastMonthReports) / lastMonthReports) * 100
      : 0;

    const yearQuery = req.query.year ? (req.query.year as string) : null;
    let matchFilter = {};
    let startDate: Date, endDate: Date;

    if (yearQuery && yearQuery !== "all") {
      const year = parseInt(yearQuery);
      if (isNaN(year)) {
        return res.status(400).json({ message: "Invalid year provided" });
      }
      startDate = new Date(year, 0, 1);
      endDate = new Date(year + 1, 0, 1);
      matchFilter = { createdAt: { $gte: startDate, $lt: endDate } };
    } else {
      matchFilter = {};
    }

    const tracksDistribution = await User.aggregate([
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

    const levelsDistribution = await User.aggregate([
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
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
      startDate = new Date(
        currentDate.getFullYear() - 1,
        currentDate.getMonth(),
        1
      );
      signupMatch = { createdAt: { $gte: startDate, $lt: endDate } };
    }
    const newUserSignups = await User.aggregate([
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
      ? parseInt(req.query.month as string)
      : currentDate.getMonth() + 1;
    let yearForTop =
      req.query.year && req.query.year !== "all"
        ? parseInt(req.query.year as string)
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

      top10Creatives = await User.find({
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
    } else {
      top10Creatives = await User.find({
        points: { $exists: true, $ne: null },
      })
        .sort({ points: -1 })
        .limit(10)
        .select("firstName lastName streak points track");
      monthName = "All Time";
    }

    const availableYearsResult = await User.aggregate([
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
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const registerAdmin = async (req: AuthRequest, res: Response) => {
  try {
    console.log("Starting registerAdmin");
    const currentUser = await User.findById(req.user?.id);
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

    const userExists = await User.findOne({ email });
    console.log("User exists check:", userExists);
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed");
    let profilePicture: string | undefined;
    if (req.file) {
      try {
        profilePicture = await uploadToCloudinary(req.file, 'streakup/users');
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ message: "Error uploading profile picture" });
      }
    }
    console.log("Profile picture:", profilePicture);

    const user = await User.create({
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
  } catch (error: any) {
    console.error("Error in registerAdmin:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

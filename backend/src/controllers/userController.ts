import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import Comment from "../models/commentModel";
import Project from "../models/projectModel"; // ← أضف هذا السطر في أعلى الملف
import nodemailer from "nodemailer";
import crypto from "crypto";
import Challenge from "../models/challengeModel";
import Notification from "../models/notificationModel";
import SharedChallenge from "../models/sharedChallengeModel";
import mongoose from "mongoose";
import {
  generateCertificate,
  sendCertificateEmail,
} from "../utils/generateCertificate";

interface AuthRequest extends Request {
  user?: { id: string };
}

interface RedeemRewardBody {
  rewardName: string;
  challengeId?: string;
  theme?: string;
}
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      id: string;
    };
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
export const checkAuth = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    res.status(200).json({ message: "Authenticated", userId: req.user.id });
  } catch (error: any) {
    console.error("[checkAuth] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const checkUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }
    return res.status(200).json({ message: "Username is available" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  const { firstName, lastName, username, email, password, track, skillLevel } =
    req.body;

  if (!firstName || !lastName || !email || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return res.status(400).json({
      message:
        existingUser.email === email
          ? "Email already exists"
          : "Username already taken",
    });
  }
  const profilePicture = req.file ? `uploads/${req.file.filename}` : undefined;

  console.log("Received data:", {
    firstName,
    lastName,
    username,
    email,
    password,
    track,
    skillLevel,
    profilePicture,
    lastLogin: new Date(),
  });

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      message: "First name, last name, email, and password are required",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      track,
      skillLevel,
      profilePicture,
      lastLogin: new Date(),
    });

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 3600000,
    });

    res.status(201).json({
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    user.isOnline = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,  
      sameSite: "none" ,
      maxAge: 3600000,
    });

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const challengesAggregate = await Challenge.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalAppreciations: { $sum: "$likes" },
          totalFeedback: { $sum: "$comments" },
        },
      },
    ]);

    const aggregates = challengesAggregate[0] || {
      totalViews: 0,
      totalAppreciations: 0,
      totalFeedback: 0,
    };

    res.status(200).json({
      user: {
        ...user.toObject(),
        completedProjects: user.completedProjects,
        challengesViews: aggregates.totalViews,
        appreciations: aggregates.totalAppreciations,
        feedback: aggregates.totalFeedback,
      },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
        id: string;
      };
      const user = await User.findById(decoded.id);
      if (user) {
        user.isOnline = false;
        await user.save();
      }
    } catch (err) {
      // إذا كان التوكن منتهي أو غير صالح، لا نفعل شيئًا
    }
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const heartbeat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    await User.findByIdAndUpdate(req.user.id, {
      lastActive: new Date(), // أضف حقل lastActive في الـ schema
      isOnline: true,
    });

    res.status(200).json({ message: "Heartbeat received" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error" });
  }
};

export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Click the link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, email, password, track, skillLevel } =
      req.body;
    const profilePicture = req.file
      ? `uploads/${req.file.filename}`
      : undefined;

    const updatedData: any = {};
    if (firstName) updatedData.firstName = firstName;
    if (lastName) updatedData.lastName = lastName;
    if (email) updatedData.email = email;
    if (password) updatedData.password = await bcrypt.hash(password, 10);
    if (track) updatedData.track = track;
    if (skillLevel) updatedData.skillLevel = skillLevel;
    if (profilePicture) updatedData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select(
      "streak completedChallenges"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const streak = user.streak || 0;
    const calendarDays = 7;
    const activeDayIndex = streak % calendarDays;
    const streakCalendar = Array.from({ length: calendarDays }, (_, i) => ({
      isActive:
        i < activeDayIndex || (streak >= calendarDays && i < calendarDays),
      number: i + 1,
      className:
        i < activeDayIndex || (streak >= calendarDays && i < calendarDays)
          ? "bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400"
          : "bg-gray-300",
    }));

    res.status(200).json({
      streakCalendar,
      progress1: user.streak * 5,
      progress2: user.completedChallenges * 10,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getRewards = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select(
      "points badges completedChallenges streak rank"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const sharedChallenges = await SharedChallenge.find({
      user: user._id,
    }).select("likes");
    const totalLikes = sharedChallenges.reduce(
      (sum, challenge) => sum + (challenge.likes || 0),
      0
    );

    const totalComments = await Comment.countDocuments({ user: user._id });

    const defaultBadges = [
      {
        name: "First Challenge",
        isUnlocked: (user.completedChallenges || 0) >= 1,
        description: "Complete your first challenge",
      },
      {
        name: "7 Day Streak",
        isUnlocked: (user.streak || 0) >= 7,
        description: "Maintain a streak of 7 days",
      },
      {
        name: "Community Helper",
        isUnlocked: totalComments >= 20,
        description: "Write 20 comments on shared challenges",
      },
      {
        name: "Social Star",
        isUnlocked: totalLikes >= 20,
        description: "Receive 20 likes on your shared challenges",
      },
      {
        name: "30 Day Streak",
        isUnlocked: (user.streak || 0) >= 30,
        description: "Maintain a streak of 30 days",
      },
      {
        name: "Top Ranker",
        isUnlocked: user.points >= 2400,
        description: "Reach the highest rank (Platinum)",
      },
    ];

    const badges = user.badges?.length
      ? user.badges.map((name: string, index: number) => ({
          name,
          isUnlocked:
            index === 0
              ? (user.completedChallenges || 0) >= 1
              : index === 1
              ? (user.streak || 0) >= 7
              : index === 2
              ? totalComments >= 20
              : index === 3
              ? totalLikes >= 20
              : index === 4
              ? (user.streak || 0) >= 30
              : index === 5
              ? user.points >= 2400
              : false,
          description:
            defaultBadges[index]?.description || "No description available",
        }))
      : defaultBadges;

    const store = [
      { name: "Custom Profile Badge", points: 300 },
      { name: "Extra Challenge Slot", points: 500 },
      { name: "Highlight Shared Challenge", points: 400 },
      { name: "Streak Saver", points: 200 },
      { name: "Rank Booster", points: 700 },
      { name: "Exclusive Workshop Access", points: 600 },
    ];

    res.status(200).json({
      points: user.points || 0,
      badges,
      store,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserRank = (
  completedProjects: number
): "Platinum" | "Gold" | "Silver" | "Bronze" => {
  if (completedProjects >= 6) return "Platinum";
  if (completedProjects >= 4) return "Gold";
  if (completedProjects >= 2) return "Silver";
  return "Bronze";
};
// داخل نفس الملف (قبل downloadCertificate)
const getRankRequirementsFromProjects = async (): Promise<
  Record<"Silver" | "Gold" | "Platinum", number>
> => {
  const projects = await Project.find()
    .select("points")
    .sort({ createdAt: 1 })
    .lean();

  if (projects.length === 0) {
    return { Silver: 600, Gold: 1200, Platinum: 1800 };
  }

  const silver = projects.slice(0, 2).reduce((s, p) => s + (p.points || 0), 0);
  const gold = projects.slice(0, 4).reduce((s, p) => s + (p.points || 0), 0);
  const plat = projects.slice(0, 6).reduce((s, p) => s + (p.points || 0), 0);

  return { Silver: silver, Gold: gold, Platinum: plat };
};

export const downloadCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { rank } = req.query;

    // تحقق من أن rank موجود ومن نوع string
    if (!rank || Array.isArray(rank)) {
      return res.status(400).json({ message: "Invalid or missing rank" });
    }

    // تحقق من أن القيمة واحدة من الـ ranks المسموحة
    const validRanks = ["Silver", "Gold", "Platinum"] as const;
    if (!validRanks.includes(rank as any)) {
      return res.status(400).json({ message: "Invalid rank value" });
    }

    // الآن rank آمن ومن النوع الصحيح
    const typedRank = rank as "Silver" | "Gold" | "Platinum";

    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const cert = user.certificates?.find((c: any) => c.rank === typedRank);
    if (!cert?.paid) {
      return res.status(403).json({ message: "Certificate not paid" });
    }

    const fullName = `${user.firstName} ${user.lastName}`;
    const certificateBuffer = await generateCertificate({
      name: fullName,
      rank: typedRank,
    });

    res.set({
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${typedRank}-Certificate-${user.username}.png"`,
    });

    res.send(certificateBuffer);
  } catch (error: any) {
    console.error("Error downloading certificate:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// استبدل الدالة القديمة
const calculateRankProgress = (
  points: number,
  rank: string,
  required: number
) => {
  if (required === 0) return 100;
  return Math.min((points / required) * 100, 100);
};

export const getUserCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // جيب النقاط المطلوبة ديناميكيًا من المشاريع
    const requirements = await getRankRequirementsFromProjects();
    const currentPoints = user.points || 0;

    const ranks: ("Silver" | "Gold" | "Platinum")[] = [
      "Silver",
      "Gold",
      "Platinum",
    ];

    const certificates = ranks.map((rank) => {
      const required = requirements[rank]; // من الـ API
      const progress = calculateRankProgress(currentPoints, rank, required);
      const isUnlocked = progress >= 100;

      const existing = user.certificates?.find((c: any) => c.rank === rank);

      return {
        rank,
        progress,
        unlocked: isUnlocked,
        paid: existing?.paid || false,
        issuedAt: existing?.issuedAt,
        certificateId: existing?.certificateId,
      };
    });

    res.json({ certificates });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const unlockCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { rank, paymentMethod } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const requirements = await getRankRequirementsFromProjects(); // الدالة اللي تحت
    const requiredPoints = requirements[rank as keyof typeof requirements];

    const progress = calculateRankProgress(
      user.points || 0,
      rank,
      requiredPoints
    );
    if (progress < 100)
      return res.status(400).json({ message: "Rank not achieved yet" });

    if (!["instapay", "vodafone_cash"].includes(paymentMethod))
      return res.status(400).json({ message: "Invalid payment method" });

    const certificateBuffer = await generateCertificate({
      name: `${user.firstName} ${user.lastName}`,
      rank: rank as "Silver" | "Gold" | "Platinum",
    });

    const certificateId = `CERT-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // تأكد من وجود certificates كـ DocumentArray
    if (!Array.isArray(user.certificates)) {
      // لا تستخدم = [] → خطأ!
      // استخدم: إعادة تعيين من الـ schema
      user.set("certificates", []);
    }

    const certIndex = user.certificates.findIndex((c: any) => c.rank === rank);

    if (certIndex >= 0) {
      const cert = user.certificates[certIndex];
      cert.paid = true;
      cert.certificateId = certificateId;
      cert.issuedAt = new Date();
      user.markModified(`certificates.${certIndex}`);
    } else {
      // استخدم create() + push() → آمن 100%
      const newCert = (user.certificates as any).create({
        rank,
        paid: true,
        certificateId,
        issuedAt: new Date(),
        progress: 100,
        unlocked: true,
      });
      user.certificates.push(newCert);
    }

    await user.save();

    try {
      await sendCertificateEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        rank,
        certificateBuffer
      );
    } catch (emailError: any) {
      console.error("Failed to send email:", emailError.message);
    }

    res.json({
      message: "Payment successful! Certificate sent to your email.",
      certificateId,
    });
  } catch (error: any) {
    console.error("خطأ في unlockCertificate:", error);
    res.status(500).json({ message: error.message });
  }
};

export const redeemReward = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { rewardName, challengeId } = req.body as {
      rewardName: string;
      challengeId?: string;
    };
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.banUntil && new Date() < user.banUntil) {
      return res
        .status(403)
        .json({ message: "You are banned from redeeming rewards" });
    }

    let pointsRequired: number;
    switch (rewardName) {
      case "Highlight Shared Challenge":
        pointsRequired = 400;
        if (!challengeId) {
          return res.status(400).json({ message: "Challenge ID is required" });
        }
        const sharedChallenge = await SharedChallenge.findById(challengeId);
        if (!sharedChallenge || sharedChallenge.user.toString() !== userId) {
          return res
            .status(404)
            .json({ message: "Shared challenge not found or not owned" });
        }
        if (sharedChallenge.highlighted) {
          return res
            .status(400)
            .json({ message: "Challenge already highlighted" });
        }
        if (user.points < pointsRequired) {
          return res.status(400).json({ message: "Insufficient points" });
        }
        sharedChallenge.highlighted = true;
        sharedChallenge.highlightExpiresAt = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        );
        await sharedChallenge.save();
        user.points -= pointsRequired;
        break;

      case "Streak Saver":
        pointsRequired = 200;
        if (user.points < pointsRequired) {
          return res.status(400).json({ message: "Insufficient points" });
        }
        const today = new Date().setHours(0, 0, 0, 0);
        let inDanger = true;
        if (user.lastLogin) {
          const lastLoginDay = new Date(user.lastLogin).setHours(0, 0, 0, 0);
          inDanger = today > lastLoginDay;
        }
        if (!inDanger) {
          return res.status(400).json({
            message:
              "Your points will be wasted because there are no challenges in danger.",
          });
        }
        user.streakSavers = (user.streakSavers || 0) + 1;
        user.points -= pointsRequired;
        user.lastLogin = new Date();
        break;

      case "Challenge Boost":
        pointsRequired = 500;
        if (!challengeId) {
          return res.status(400).json({ message: "Challenge ID is required" });
        }
        const challenge = await Challenge.findOne({ challengeId }).populate(
          "project",
          "_id name track points"
        );
        if (!challenge) {
          return res.status(404).json({ message: "Challenge not found" });
        }
        if (user.challenges.some((id) => id.equals(challenge._id))) {
          return res
            .status(400)
            .json({ message: "Challenge already completed" });
        }
        if (user.points < pointsRequired) {
          return res.status(400).json({ message: "Insufficient points" });
        }

        // جلب نقاط التحديات المكتملة مسبقًا للمشروع
        let totalCompletedPoints = 0;
        if (challenge.project) {
          const project = await mongoose
            .model("Project")
            .findById(challenge.project._id);
          if (!project) {
            return res.status(404).json({ message: "Project not found" });
          }

          const userCompletedChallenges = await Challenge.find({
            _id: { $in: user.challenges },
            project: challenge.project._id,
          });

          totalCompletedPoints = userCompletedChallenges.reduce(
            (sum, ch) => sum + (ch.points || 50),
            0
          );
        }

        // إضافة التحدي الحالي
        user.challenges.push(challenge._id);
        user.completedChallenges += 1;
        user.streak += 1;
        user.points += challenge.points || 50;

        // تحقق من اكتمال المشروع بعد إضافة التحدي
        if (challenge.project) {
          const project = await mongoose
            .model("Project")
            .findById(challenge.project._id);
          if (!project) {
            return res.status(404).json({ message: "Project not found" });
          }

          totalCompletedPoints += challenge.points || 50; // إضافة نقاط التحدي الحالي
          if (totalCompletedPoints >= project.points) {
            user.completedProjects += 1;
            console.log(
              `[redeemReward] Project completed for user ${user._id}, completedProjects: ${user.completedProjects}, total points: ${totalCompletedPoints}/${project.points}`
            );
          }
        }
        const oldRank = user.rank;
        user.rank = updateUserRank(user.completedProjects);
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
        user.points -= pointsRequired;
        challenge.likes += 1;
        await Promise.all([user.save(), challenge.save()]);
        break;

      default:
        return res.status(400).json({ message: "Invalid reward" });
    }

    await user.save();
    res.status(200).json({
      message: `${rewardName} redeemed successfully`,
      points: user.points,
      streakSavers: user.streakSavers,
    });
  } catch (error: any) {
    console.error("Error in redeemReward:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getNextChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("track challenges");
    if (!user || !user.track) {
      return res
        .status(200)
        .json({ nextChallenge: null, message: "No track selected" });
    }

    // جلب التحديات مع populate للـ project
    const challenges = await Challenge.find({ category: user.track })
      .sort({ createdAt: 1 })
      .populate("project", "name") // أضف populate هنا
      .select(
        "challengeId name overview previewImages category project duration"
      );

    if (challenges.length === 0) {
      return res
        .status(200)
        .json({ nextChallenge: null, message: "No challenges in your track" });
    }

    const completedIds = user.challenges.map((c: any) => c.toString());

    const nextChallenge = challenges.find(
      (ch) => !completedIds.includes(ch._id.toString())
    );

    if (!nextChallenge) {
      return res.status(200).json({
        nextChallenge: null,
        message: "New challenge coming soon!",
      });
    }

    res.status(200).json({
      nextChallenge: {
        challengeId: nextChallenge.challengeId,
        name: nextChallenge.name,
        description: nextChallenge.overview,
        image: nextChallenge.previewImages?.[0],
        track: nextChallenge.category,
        project: nextChallenge.project
          ? { name: (nextChallenge.project as any).name } // Type-safe
          : null,
        duration: nextChallenge.duration || 1,
      },
    });
  } catch (error: any) {
    console.error("Error in getNextChallenge:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPublicProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select(
      "firstName lastName email track skillLevel profilePicture streak points completedChallenges rank completedProjects"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTopCreators = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = الأحد, 1 = الإثنين, ..., 5 = الجمعة, 6 = السبت

    // احسب تاريخ الجمعة الماضية (أو اليوم لو اليوم جمعة)
    const friday = new Date(now);
    const daysToFriday = (5 - currentDay + 7) % 7 || 7; // لو اليوم جمعة، نأخذ اليوم نفسه
    friday.setDate(now.getDate() - daysToFriday);
    friday.setHours(0, 0, 0, 0); // بداية الجمعة

    // الخميس الحالي (نهاية الأسبوع)
    const thursday = new Date(friday);
    thursday.setDate(friday.getDate() + 6); // الجمعة + 6 = الخميس
    thursday.setHours(23, 59, 59, 999); // نهاية الخميس

    const topCreators = await User.find({
      lastLogin: { $gte: friday, $lte: thursday },
      points: { $exists: true },
      role: "User",
    })
      .sort({ points: -1, streak: -1 })
      .limit(3)
      .select("firstName lastName profilePicture track streak points username")
      .lean();

    res.status(200).json({ topCreators });
  } catch (error: any) {
    console.error("Error in getTopCreators:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// جيب النقاط المطلوبة لكل رتبة بناءً على المشاريع
export const getRankRequirements = async (req: AuthRequest, res: Response) => {
  try {
    // جيب كل المشاريع مع نقاطها، مرتبة حسب تاريخ الإنشاء (الأقدم أولاً)
    const projects = await Project.find()
      .select("points")
      .sort({ createdAt: 1 })
      .lean();

    // لو مفيش مشاريع → ارجع قيم افتراضية (مؤقتًا)
    if (projects.length === 0) {
      return res.json({
        requirements: {
          Silver: 600,
          Gold: 1200,
          Platinum: 1800,
        },
      });
    }

    // احسب النقاط الكلية لأول N مشاريع
    const silverPoints = projects
      .slice(0, 2)
      .reduce((sum, p) => sum + (p.points || 0), 0);

    const goldPoints = projects
      .slice(0, 4)
      .reduce((sum, p) => sum + (p.points || 0), 0);

    const platinumPoints = projects
      .slice(0, 6)
      .reduce((sum, p) => sum + (p.points || 0), 0);

    res.json({
      requirements: {
        Silver: silverPoints,
        Gold: goldPoints,
        Platinum: platinumPoints,
      },
    });
  } catch (err: any) {
    console.error("[getRankRequirements] Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

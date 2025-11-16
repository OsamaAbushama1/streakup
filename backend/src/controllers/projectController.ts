import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Project from "../models/projectModel";
import Challenge from "../models/challengeModel";
import Track from "../models/trackModel";

interface AuthRequest extends Request {
  user?: { _id: string; role?: string };
}

const FIXED_TRACKS = [
  "UI/UX Design",
  "Graphic Design",
  "Frontend Development",
  "Backend Development",
];

// جلب كل المشاريع
export const getAllProjects = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const projects = await Project.find().populate(
      "createdBy",
      "firstName lastName"
    );
    const projectsWithChallengeCount = await Promise.all(
      projects.map(async (project) => {
        const challengeCount = await Challenge.countDocuments({
          project: project._id,
        });
        return { ...project.toJSON(), challengeCount };
      })
    );
    res.status(200).json({ projects: projectsWithChallengeCount });
  }
);

// جلب مشروع معين
export const getProjectById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const project = await Project.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName"
    );
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }
    const challengeCount = await Challenge.countDocuments({
      project: project._id,
    });
    res.status(200).json({ project: { ...project.toJSON(), challengeCount } });
  }
);

// إنشاء مشروع جديد
export const createProject = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const { name, track, projectType, points } = req.body;

    if (!name || !track || !projectType || points === undefined) {
      res.status(400);
      throw new Error("All fields are required");
    }

    const parsedPoints = parseInt(points);
    if (isNaN(parsedPoints) || parsedPoints < 0) {
      res.status(400);
      throw new Error("Points must be a non-negative number");
    }

    // تحقق من وجود الـ Track فقط (مش نقاط)
    const isValidTrack =
      FIXED_TRACKS.includes(track) || (await Track.findOne({ name: track }));
    if (!isValidTrack) {
      res.status(400);
      throw new Error("Invalid track");
    }

    // تحقق من عدم تكرار الاسم في نفس الـ Track
    const existingProject = await Project.findOne({ name, track });
    if (existingProject) {
      res.status(400);
      throw new Error("Project with this name already exists in this track");
    }

    const project = await Project.create({
      name,
      track,
      projectType,
      points: parsedPoints,
      createdBy: req.user._id,
      challengeCount: 0,
    });

    res.status(201).json({ project });
  }
);

// تعديل مشروع
export const updateProject = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const { name, track, projectType, points } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }

    if (
      project.createdBy.toString() !== req.user._id &&
      req.user.role !== "Admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to update this project");
    }

    // تحقق من الـ Track الجديد
    if (track && track !== project.track) {
      const isValidTrack =
        FIXED_TRACKS.includes(track) || (await Track.findOne({ name: track }));
      if (!isValidTrack) {
        res.status(400);
        throw new Error("Invalid track");
      }

      const challenges = await Challenge.find({ project: project._id });
      if (challenges.length > 0) {
        res.status(400);
        throw new Error(
          "Cannot change track; project has associated challenges"
        );
      }
    }

    // تحقق من النقاط الجديدة
    if (points !== undefined) {
      const parsedPoints = parseInt(points);
      if (isNaN(parsedPoints) || parsedPoints < 0) {
        res.status(400);
        throw new Error("Points must be a non-negative number");
      }

      const challenges = await Challenge.find({ project: project._id });
      const totalChallengePoints = challenges.reduce(
        (sum, c) => sum + c.points,
        0
      );
      if (totalChallengePoints > parsedPoints) {
        res.status(400);
        throw new Error(
          `Total challenge points (${totalChallengePoints}) exceed new project points (${parsedPoints})`
        );
      }
    }

    project.name = name ?? project.name;
    project.track = track ?? project.track;
    project.projectType = projectType ?? project.projectType;
    project.points = points !== undefined ? parseInt(points) : project.points;

    const updatedProject = await project.save();
    res.status(200).json({ project: updatedProject });
  }
);

// حذف مشروع
export const deleteProject = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }

    if (
      project.createdBy.toString() !== req.user._id &&
      req.user.role !== "Admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to delete this project");
    }

    await Challenge.updateMany(
      { project: project._id },
      { $set: { project: null } }
    );
    await project.deleteOne();

    res.status(200).json({ message: "Project deleted successfully" });
  }
);

// routes/challengeRoutes.ts
import { Router } from "express";
import {
  incrementChallengeViews,
  likeChallenge,
  startChallenge,
  recordView,
  getNonCompletedChallenges,
  getCompletedProjects,
  getChallengesByProject,
  shareChallenge,
  getAllChallenges,
  getChallengeById,
} from "../controllers/challengeController";
import { protect } from "../middleware/authMiddleware";
import multer from "multer";
import { authenticateToken } from "../controllers/userController";

const router = Router();

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// === مسارات التحديات (User) ===
router.get("/", protect, getAllChallenges);
router.get("/:id", protect, getChallengeById);
router.post(
  "/:id/share",
  authenticateToken,
  upload.array("images", 5),
  shareChallenge
);
router.post("/:challengeId/view", protect, incrementChallengeViews);
router.put("/start/:id", protect, startChallenge);
router.put("/like/:id", protect, likeChallenge);
router.put("/:id/view", protect, recordView);
router.get("/non-completed", protect, getNonCompletedChallenges);
router.get("/completed-projects", protect, getCompletedProjects);

export default router;

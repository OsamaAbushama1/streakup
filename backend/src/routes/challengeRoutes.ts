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

// ==================== CHALLENGE ENDPOINTS ====================
// All challenge endpoints require authentication (protect middleware)

// Get all challenges
router.get("/", protect, getAllChallenges);

// Get challenge by ID
router.get("/:id", protect, getChallengeById);

// Share a challenge (with image uploads)
router.post(
  "/:id/share",
  authenticateToken,
  upload.array("images", 5),
  shareChallenge
);

// Increment challenge views
router.post("/:challengeId/view", protect, incrementChallengeViews);

// Start a challenge
router.put("/start/:id", protect, startChallenge);

// Like a challenge
router.put("/like/:id", protect, likeChallenge);

// Record challenge view
router.put("/:id/view", protect, recordView);

// Get non-completed challenges
router.get("/non-completed", protect, getNonCompletedChallenges);

// Get completed projects
router.get("/completed-projects", protect, getCompletedProjects);

export default router;

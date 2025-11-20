import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  checkLikeStatus,
  getMyNonHighlightedSharedChallenges,
  getMySharedChallenges,
  getSharedChallengeById,
  getSharedChallengeByUsernameAndId,
  getSharedChallenges,
  getSharedChallengesByUsername,
  getUsernameBySharedChallengeId,
  incrementSharedChallengeViews,
  likeSharedChallenge,
} from "../controllers/sharedChallengeController";

const router = Router();

// ==================== SHARED CHALLENGE ENDPOINTS ====================
// All endpoints require authentication (protect middleware applied globally)
router.use(protect);

// Get all shared challenges
router.get("/", getSharedChallenges);

// Get user's own shared challenges
router.get("/my", getMySharedChallenges);

// Get user's non-highlighted shared challenges
router.get("/my-non-highlighted", getMyNonHighlightedSharedChallenges);

// Get shared challenges by username
router.get("/by-username/:username", getSharedChallengesByUsername);

// Get shared challenge by ID
router.get("/:challengeId", getSharedChallengeById);

// Increment shared challenge views
router.post("/:challengeId/view", incrementSharedChallengeViews);

// Like a shared challenge
router.post("/:challengeId/like", likeSharedChallenge);

// Check like status for a shared challenge
router.get("/:challengeId/like-status", checkLikeStatus);

// Get shared challenge by username and ID
router.get("/:username/:challengeId", getSharedChallengeByUsernameAndId);

// Get username by shared challenge ID
router.get("/username/:challengeId", getUsernameBySharedChallengeId);

export default router;

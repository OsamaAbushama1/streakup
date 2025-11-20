import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  addComment,
  getComments,
  likeComment,
  reportComment,
} from "../controllers/commentController";

const router = Router();

// ==================== COMMENT ENDPOINTS ====================
// All endpoints require authentication (protect middleware applied globally)
router.use(protect);

// Add a comment to a shared challenge
router.post("/shared/:sharedChallengeId", addComment);

// Get comments for a shared challenge
router.get("/shared/:sharedChallengeId", getComments);

// Like a comment
router.post("/:commentId/like", likeComment);

// Report a comment
router.post("/:commentId/report", reportComment);

export default router;

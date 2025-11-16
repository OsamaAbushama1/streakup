import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  addComment,
  getComments,
  likeComment,
  reportComment,
} from "../controllers/commentController";

const router = Router();

router.use(protect);

router.post("/shared/:sharedChallengeId", addComment);

router.get("/shared/:sharedChallengeId", getComments);

router.post("/:commentId/like", likeComment);

router.post("/:commentId/report", reportComment);

export default router;

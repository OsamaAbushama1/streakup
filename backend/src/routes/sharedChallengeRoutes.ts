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

router.use(protect);

router.get("/", getSharedChallenges);
router.get("/my", getMySharedChallenges);
router.get("/my-non-highlighted", getMyNonHighlightedSharedChallenges);
router.get("/by-username/:username", getSharedChallengesByUsername);

router.get("/:challengeId", getSharedChallengeById);
router.post("/:challengeId/view", incrementSharedChallengeViews);
router.post("/:challengeId/like", likeSharedChallenge);
router.get("/:challengeId/like-status", checkLikeStatus);
router.get("/:username/:challengeId", getSharedChallengeByUsernameAndId);

router.get("/username/:challengeId", getUsernameBySharedChallengeId);

export default router;

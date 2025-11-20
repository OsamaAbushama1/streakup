"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const sharedChallengeController_1 = require("../controllers/sharedChallengeController");
const router = (0, express_1.Router)();
// ==================== SHARED CHALLENGE ENDPOINTS ====================
// All endpoints require authentication (protect middleware applied globally)
router.use(authMiddleware_1.protect);
// Get all shared challenges
router.get("/", sharedChallengeController_1.getSharedChallenges);
// Get user's own shared challenges
router.get("/my", sharedChallengeController_1.getMySharedChallenges);
// Get user's non-highlighted shared challenges
router.get("/my-non-highlighted", sharedChallengeController_1.getMyNonHighlightedSharedChallenges);
// Get shared challenges by username
router.get("/by-username/:username", sharedChallengeController_1.getSharedChallengesByUsername);
// Get shared challenge by ID
router.get("/:challengeId", sharedChallengeController_1.getSharedChallengeById);
// Increment shared challenge views
router.post("/:challengeId/view", sharedChallengeController_1.incrementSharedChallengeViews);
// Like a shared challenge
router.post("/:challengeId/like", sharedChallengeController_1.likeSharedChallenge);
// Check like status for a shared challenge
router.get("/:challengeId/like-status", sharedChallengeController_1.checkLikeStatus);
// Get shared challenge by username and ID
router.get("/:username/:challengeId", sharedChallengeController_1.getSharedChallengeByUsernameAndId);
// Get username by shared challenge ID
router.get("/username/:challengeId", sharedChallengeController_1.getUsernameBySharedChallengeId);
exports.default = router;

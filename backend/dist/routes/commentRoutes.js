"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const commentController_1 = require("../controllers/commentController");
const router = (0, express_1.Router)();
// ==================== COMMENT ENDPOINTS ====================
// All endpoints require authentication (protect middleware applied globally)
router.use(authMiddleware_1.protect);
// Add a comment to a shared challenge
router.post("/shared/:sharedChallengeId", commentController_1.addComment);
// Get comments for a shared challenge
router.get("/shared/:sharedChallengeId", commentController_1.getComments);
// Like a comment
router.post("/:commentId/like", commentController_1.likeComment);
// Report a comment
router.post("/:commentId/report", commentController_1.reportComment);
exports.default = router;

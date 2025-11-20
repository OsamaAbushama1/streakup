import { Router } from "express";
import authRoutes from "./userRoutes";
import challengeRoutes from "./challengeRoutes";
import adminRoutes from "./adminRoutes";
import sharedChallengeRoutes from "./sharedChallengeRoutes";
import commentRoutes from "./commentRoutes";

const router = Router();

// ==================== ROUTE STRUCTURE ====================
// All routes are prefixed with /api in server.ts
// Security layers applied in server.ts:
//   1. Bot Detection - Blocks automated scrapers
//   2. Rate Limiting - 30 requests per minute
//   3. Individual route authentication as needed

// Authentication & User routes - /api/auth
router.use("/auth", authRoutes);

// Challenge routes - /api/challenges (all protected)
router.use("/challenges", challengeRoutes);

// Admin routes - /api/admin (protected + admin only)
router.use("/admin", adminRoutes);

// Shared challenge routes - /api/shared (all protected)
router.use("/shared", sharedChallengeRoutes);

// Comment routes - /api/comments (all protected)
router.use("/comments", commentRoutes);

export default router;

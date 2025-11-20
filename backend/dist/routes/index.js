"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userRoutes_1 = __importDefault(require("./userRoutes"));
const challengeRoutes_1 = __importDefault(require("./challengeRoutes"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const sharedChallengeRoutes_1 = __importDefault(require("./sharedChallengeRoutes"));
const commentRoutes_1 = __importDefault(require("./commentRoutes"));
const router = (0, express_1.Router)();
// ==================== ROUTE STRUCTURE ====================
// All routes are prefixed with /api in server.ts
// Security layers applied in server.ts:
//   1. Bot Detection - Blocks automated scrapers
//   2. Rate Limiting - 30 requests per minute
//   3. Individual route authentication as needed
// Authentication & User routes - /api/auth
router.use("/auth", userRoutes_1.default);
// Challenge routes - /api/challenges (all protected)
router.use("/challenges", challengeRoutes_1.default);
// Admin routes - /api/admin (protected + admin only)
router.use("/admin", adminRoutes_1.default);
// Shared challenge routes - /api/shared (all protected)
router.use("/shared", sharedChallengeRoutes_1.default);
// Comment routes - /api/comments (all protected)
router.use("/comments", commentRoutes_1.default);
exports.default = router;

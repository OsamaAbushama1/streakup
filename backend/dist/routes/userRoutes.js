"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const projectController_1 = require("../controllers/projectController");
const trackController_1 = require("../controllers/trackController");
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
// Use memory storage for Cloudinary uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
// ==================== PUBLIC ENDPOINTS ====================
// These endpoints are accessible without authentication
// Check username availability (public for registration form)
router.get("/check-username", userController_1.checkUsername);
// Get public user profile (visible to all)
router.get("/profile/:username", userController_1.getPublicProfile);
// Get public tracks (read-only, no auth required)
router.get("/tracks", trackController_1.getPublicTracks);
// ==================== AUTHENTICATION ENDPOINTS ====================
// Protected with special rate limiters to prevent brute force attacks
// User registration (rate limited: 10 req/15min)
router.post("/register", rateLimiter_1.authLimiter, upload.single("profilePicture"), userController_1.registerUser);
// User login (rate limited: 10 req/15min)
router.post("/login", rateLimiter_1.authLimiter, userController_1.loginUser);
// Password reset request (rate limited: 3 req/hour)
router.post("/forget-password", rateLimiter_1.passwordResetLimiter, userController_1.forgetPassword);
// Password reset confirmation (rate limited: 3 req/hour)
router.post("/reset-password", rateLimiter_1.passwordResetLimiter, userController_1.resetPassword);
// Logout (no auth required, clears cookies)
router.post("/logout", userController_1.logoutUser);
// ==================== PROTECTED USER ENDPOINTS ====================
// All endpoints below require valid JWT authentication
// Check authentication status
router.get("/check", authMiddleware_1.protect, userController_1.checkAuth);
// User heartbeat (activity tracking)
router.post("/heartbeat", authMiddleware_1.protect, userController_1.heartbeat);
// Get user profile
router.get("/profile", userController_1.authenticateToken, userController_1.getUserProfile);
// Update user profile
router.put("/update-profile", userController_1.authenticateToken, upload.single("profilePicture"), userController_1.updateProfile);
// User analytics and statistics
router.get("/analytics", userController_1.authenticateToken, userController_1.getAnalytics);
// User rewards
router.get("/rewards", userController_1.authenticateToken, userController_1.getRewards);
router.post("/redeem-reward", authMiddleware_1.protect, userController_1.redeemReward);
// User certificates
router.get("/certificate", authMiddleware_1.protect, userController_1.downloadCertificate);
router.get("/certificates", userController_1.authenticateToken, userController_1.getUserCertificates);
router.post("/certificates/unlock", userController_1.authenticateToken, userController_1.unlockCertificate);
// Rank requirements
router.get("/rank-requirements", userController_1.authenticateToken, userController_1.getRankRequirements);
// Projects (protected)
router.get("/projects", authMiddleware_1.protect, projectController_1.getAllProjects);
// Top creators leaderboard
router.get("/top-creators", authMiddleware_1.protect, userController_1.getTopCreators);
// Next challenge recommendation
router.get("/next-challenge", authMiddleware_1.protect, userController_1.getNextChallenge);
// Notifications
router.get("/notifications", authMiddleware_1.protect, notificationController_1.getNotifications);
router.put("/notifications/read", authMiddleware_1.protect, notificationController_1.markNotificationsAsRead);
exports.default = router;

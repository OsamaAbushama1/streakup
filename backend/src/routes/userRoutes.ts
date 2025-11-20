import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  authenticateToken,
  logoutUser,
  forgetPassword,
  resetPassword,
  updateProfile,
  getAnalytics,
  getRewards,
  redeemReward,
  checkUsername,
  checkAuth,
  getPublicProfile,
  downloadCertificate,
  getTopCreators,
  getNextChallenge,
  getUserCertificates,
  unlockCertificate,
  getRankRequirements,
  heartbeat,
  getBadgeNotifications,
  markBadgeAsSeen,
} from "../controllers/userController";
import multer from "multer";
import { protect } from "../middleware/authMiddleware";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter";

import { getAllProjects } from "../controllers/projectController";
import { getPublicTracks } from "../controllers/trackController";

import {
  getNotifications,
  markNotificationsAsRead,
} from "../controllers/notificationController";

const router = express.Router();

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==================== PUBLIC ENDPOINTS ====================
// These endpoints are accessible without authentication

// Check username availability (public for registration form)
router.get("/check-username", checkUsername);

// Get public user profile (visible to all)
router.get("/profile/:username", getPublicProfile);

// Get public tracks (read-only, no auth required)
router.get("/tracks", getPublicTracks);

// ==================== AUTHENTICATION ENDPOINTS ====================
// Protected with special rate limiters to prevent brute force attacks

// User registration (rate limited: 10 req/15min)
router.post("/register", authLimiter, upload.single("profilePicture"), registerUser);

// User login (rate limited: 10 req/15min)
router.post("/login", authLimiter, loginUser);

// Password reset request (rate limited: 3 req/hour)
router.post("/forget-password", passwordResetLimiter, forgetPassword);

// Password reset confirmation (rate limited: 3 req/hour)
router.post("/reset-password", passwordResetLimiter, resetPassword);

// Logout (no auth required, clears cookies)
router.post("/logout", logoutUser);

// ==================== PROTECTED USER ENDPOINTS ====================
// All endpoints below require valid JWT authentication

// Check authentication status
router.get("/check", protect, checkAuth);

// User heartbeat (activity tracking)
router.post("/heartbeat", protect, heartbeat);

// Get user profile
router.get("/profile", authenticateToken, getUserProfile);

// Update user profile
router.put(
  "/update-profile",
  authenticateToken,
  upload.single("profilePicture"),
  updateProfile
);

// User analytics and statistics
router.get("/analytics", authenticateToken, getAnalytics);

// User rewards
router.get("/rewards", authenticateToken, getRewards);
router.post("/redeem-reward", protect, redeemReward);

// Badge notifications
router.get("/badge-notifications", protect, getBadgeNotifications);
router.post("/mark-badge-seen", protect, markBadgeAsSeen);

// User certificates
router.get("/certificate", protect, downloadCertificate);
router.get("/certificates", authenticateToken, getUserCertificates);
router.post("/certificates/unlock", authenticateToken, unlockCertificate);

// Rank requirements
router.get("/rank-requirements", authenticateToken, getRankRequirements);

// Projects (protected)
router.get("/projects", protect, getAllProjects);

// Top creators leaderboard
router.get("/top-creators", protect, getTopCreators);

// Next challenge recommendation
router.get("/next-challenge", protect, getNextChallenge);

// Notifications
router.get("/notifications", protect, getNotifications);
router.put("/notifications/read", protect, markNotificationsAsRead);

export default router;

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
} from "../controllers/userController";
import multer from "multer";
import { protect } from "../middleware/authMiddleware";

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
router.get("/check", protect, checkAuth);
router.post("/register", upload.single("profilePicture"), registerUser);
router.get("/check-username", checkUsername);
router.post("/login", loginUser);
router.get("/profile", authenticateToken, getUserProfile);
router.post("/logout", logoutUser);
router.post("/heartbeat", protect, heartbeat);

router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.put(
  "/update-profile",
  authenticateToken,
  upload.single("profilePicture"),
  updateProfile
);

router.get("/analytics", authenticateToken, getAnalytics);
router.get("/rewards", authenticateToken, getRewards);

router.post("/redeem-reward", protect, redeemReward);

router.get("/profile/:username", getPublicProfile);
router.get("/projects", protect, getAllProjects);

router.get("/tracks", getPublicTracks);

router.get("/certificate", protect, downloadCertificate);

router.get("/certificates", authenticateToken, getUserCertificates);
router.post("/certificates/unlock", authenticateToken, unlockCertificate);

router.get("/top-creators", protect, getTopCreators);
router.get("/next-challenge", protect, getNextChallenge);

router.get("/notifications", protect, getNotifications);
router.put("/notifications/read", protect, markNotificationsAsRead);
router.get("/rank-requirements", authenticateToken, getRankRequirements);

export default router;

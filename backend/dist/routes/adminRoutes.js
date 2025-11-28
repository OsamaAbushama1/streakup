"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/adminRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const restrictToAdmin_1 = require("../middleware/restrictToAdmin");
const multer_1 = __importDefault(require("multer"));
const adminController_1 = require("../controllers/adminController");
const projectController_1 = require("../controllers/projectController");
const trackController_1 = require("../controllers/trackController");
const adminController_2 = require("../controllers/adminController");
const challengeController_1 = require("../controllers/challengeController");
const router = (0, express_1.Router)();
// Import file validation utilities
const fileValidation_1 = require("../utils/fileValidation");
// Use secure upload configuration with file validation
const upload = (0, multer_1.default)(fileValidation_1.uploadConfig);
// ==================== ADMIN ROUTES ====================
// All routes require authentication (protect) AND admin privileges (restrictToAdmin)
router.use(authMiddleware_1.protect, restrictToAdmin_1.restrictToAdmin);
// ==================== USERS ====================
// Change admin password
router.put("/change-password", authMiddleware_1.protect, adminController_1.changePassword);
// User management
router.get("/users", adminController_1.getAllUsers);
router.delete("/users/:id", adminController_1.deleteUser);
router.put("/users/:id", adminController_1.updateUser);
router.put("/users/:id/ban", adminController_1.banUser);
// Register new admin
router.post("/register", upload.single("profilePicture"), adminController_1.registerAdmin);
// ==================== PROJECTS ====================
router.get("/projects", projectController_1.getAllProjects);
router.get("/projects/:id", projectController_1.getProjectById);
router.post("/projects", upload.array("previewImages", 5), projectController_1.createProject);
router.put("/projects/:id", upload.array("previewImages", 5), projectController_1.updateProject);
router.delete("/projects/:id", projectController_1.deleteProject);
// ==================== TRACKS ====================
router.get("/tracks", trackController_1.getTracks);
router.post("/tracks", upload.single("icon"), trackController_1.addTrack);
router.delete("/tracks/:trackName", trackController_1.deleteTrack);
// ==================== CHALLENGES ====================
router.get("/challenges", challengeController_1.getAllChallenges);
router.get("/challenges/by-project", challengeController_1.getChallengesByProject);
router.get("/challenges/:id", challengeController_1.getChallengeById);
router.post("/challenges", upload.array("previewImages", 5), adminController_2.createChallenge);
router.put("/challenges/:id", upload.array("previewImages", 5), adminController_2.updateChallenge);
router.delete("/challenges/:id", adminController_2.deleteChallenge);
// ==================== COMMENTS ====================
router.delete("/comments/:id", adminController_1.deleteCommentAdmin);
// ==================== REPORTS ====================
router.get("/reports", adminController_1.getReports);
router.put("/reports/:id/resolve", adminController_1.resolveReport);
// ==================== REWARDS ====================
// ==================== REWARDS ====================
// router.get("/rewards/settings", getRewardSettings); // Deprecated
// router.put("/rewards/settings", updateRewardSettings); // Deprecated
const rewardController_1 = require("../controllers/rewardController");
router.get("/rewards", rewardController_1.getAllRewardsAdmin);
router.post("/rewards", rewardController_1.createReward);
router.put("/rewards/:id", rewardController_1.updateReward);
router.delete("/rewards/:id", rewardController_1.deleteReward);
// ==================== ACTIVITIES ====================
router.get("/activities", adminController_1.getActivities);
// ==================== DASHBOARD ====================
router.get("/", adminController_1.getDashboardStats); // /api/admin
exports.default = router;

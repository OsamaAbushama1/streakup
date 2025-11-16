// src/routes/adminRoutes.ts
import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { restrictToAdmin } from "../middleware/restrictToAdmin";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  banUser,
  changePassword,
  deleteCommentAdmin,
  deleteUser,
  getActivities,
  getAllUsers,
  getDashboardStats,
  getReports,
  registerAdmin,
  resolveReport,
  updateUser,
} from "../controllers/adminController";

import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  updateProject,
} from "../controllers/projectController";

import {
  addTrack,
  deleteTrack,
  getTracks,
} from "../controllers/trackController";

import {
  createChallenge,
  deleteChallenge,
  updateChallenge,
} from "../controllers/adminController";

import { getComments, addComment } from "../controllers/commentController";

import {
  getAllChallenges,
  getChallengeById,
  getChallengesByProject,
} from "../controllers/challengeController";

const router = Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

/* -------------------------------------------------
   Middleware لكل الـ admin routes (protect + admin)
   ------------------------------------------------- */
router.use(protect, restrictToAdmin);

/* ==================== USERS ==================== */
router.put("/change-password", protect, changePassword);

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.put("/users/:id", updateUser);
router.put("/users/:id/ban", banUser);
router.post("/register", upload.single("profilePicture"), registerAdmin);

/* ==================== PROJECTS ==================== */
router.get("/projects", getAllProjects);
router.get("/projects/:id", getProjectById);
router.post("/projects", upload.array("previewImages", 5), createProject);
router.put("/projects/:id", upload.array("previewImages", 5), updateProject);
router.delete("/projects/:id", deleteProject);

/* ==================== TRACKS ==================== */
router.get("/tracks", getTracks);
router.post("/tracks", upload.single("icon"), addTrack);
router.delete("/tracks/:trackName", deleteTrack);

/* ==================== CHALLENGES ==================== */
router.get("/challenges", getAllChallenges);
router.get("/challenges/by-project", getChallengesByProject);
router.get("/challenges/:id", getChallengeById);
router.post("/challenges", upload.array("previewImages", 5), createChallenge);
router.put(
  "/challenges/:id",
  upload.array("previewImages", 5),
  updateChallenge
);
router.delete("/challenges/:id", deleteChallenge);

/* ==================== COMMENTS ==================== */
router.delete("/comments/:id", deleteCommentAdmin);

/* ==================== REPORTS ==================== */
router.get("/reports", getReports);
router.put("/reports/:id/resolve", resolveReport);

/* ==================== ACTIVITIES ==================== */
router.get("/activities", getActivities);

/* ==================== DASHBOARD ==================== */
router.get("/", getDashboardStats); // /api/admin
export default router;

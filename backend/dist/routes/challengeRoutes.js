"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/challengeRoutes.ts
const express_1 = require("express");
const challengeController_1 = require("../controllers/challengeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// إعداد Multer للتحديات
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, "../uploads");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
// === مسارات التحديات (User) ===
router.get("/", authMiddleware_1.protect, challengeController_1.getAllChallenges);
router.get("/:id", authMiddleware_1.protect, challengeController_1.getChallengeById);
router.post("/:id/share", userController_1.authenticateToken, upload.array("images", 5), challengeController_1.shareChallenge);
router.post("/:challengeId/view", authMiddleware_1.protect, challengeController_1.incrementChallengeViews);
router.put("/start/:id", authMiddleware_1.protect, challengeController_1.startChallenge);
router.put("/like/:id", authMiddleware_1.protect, challengeController_1.likeChallenge);
router.put("/:id/view", authMiddleware_1.protect, challengeController_1.recordView);
router.get("/non-completed", authMiddleware_1.protect, challengeController_1.getNonCompletedChallenges);
router.get("/completed-projects", authMiddleware_1.protect, challengeController_1.getCompletedProjects);
exports.default = router;

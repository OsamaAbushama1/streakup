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
router.use("/auth", userRoutes_1.default);
router.use("/challenges", challengeRoutes_1.default);
router.use("/admin", adminRoutes_1.default);
router.use("/shared", sharedChallengeRoutes_1.default);
router.use("/comments", commentRoutes_1.default);
exports.default = router;

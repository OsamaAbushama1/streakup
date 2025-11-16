import { Router } from "express";
import authRoutes from "./userRoutes";
import challengeRoutes from "./challengeRoutes";
import adminRoutes from "./adminRoutes";
import sharedChallengeRoutes from "./sharedChallengeRoutes";
import commentRoutes from "./commentRoutes";
const router = Router();

router.use("/auth", authRoutes);

router.use("/challenges", challengeRoutes);

router.use("/admin", adminRoutes);
router.use("/shared", sharedChallengeRoutes);

router.use("/comments", commentRoutes);

export default router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackVisitor = void 0;
const visitorModel_1 = __importDefault(require("../models/visitorModel"));
const crypto_1 = __importDefault(require("crypto"));
const trackVisitor = async (req, res, next) => {
    try {
        // 1. جلب IP نظيف
        const ip = (req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.headers["x-forwarded-for"] ||
            "unknown")
            .split(",")[0]
            .replace("::ffff:", "")
            .trim();
        // 2. جلب User-Agent
        const userAgent = (req.get("User-Agent") || "unknown").trim();
        // 3. إنشاء hash فريد للمتصفح (IP + UA)
        const browserHash = crypto_1.default
            .createHash("md5")
            .update(`${ip}|||${userAgent}`)
            .digest("hex");
        const BROWSER_ID_COOKIE = "browser_id";
        // 4. تحقق من الكوكي
        let cookieBrowserId = req.cookies[BROWSER_ID_COOKIE];
        // إذا الكوكي موجودة ومطابقة → استخدمها
        // إذا مش موجودة أو مختلفة → احفظ الجديدة
        if (!cookieBrowserId || cookieBrowserId !== browserHash) {
            res.cookie(BROWSER_ID_COOKIE, browserHash, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });
        }
        // 5. استخدم الـ hash من الكوكي (أو الجديد) كـ sessionId
        const sessionId = `browser_${browserHash}`;
        // 6. تحديد بداية ونهاية اليوم
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // 7. تحقق: هل هذا المتصفح زار اليوم؟
        const existingVisit = await visitorModel_1.default.findOne({
            sessionId,
            visitedAt: { $gte: today, $lt: tomorrow },
        });
        // 8. إذا لم يزر اليوم → سجّل زيارة جديدة
        if (!existingVisit) {
            await visitorModel_1.default.create({
                ip,
                sessionId,
                userAgent,
                path: req.path,
                visitedAt: new Date(),
            });
        }
        // 9. إرفاق الـ browserHash في الـ request (اختياري)
        req.browserHash = browserHash;
    }
    catch (err) {
        console.error("Failed to track visitor:", err);
    }
    next();
};
exports.trackVisitor = trackVisitor;

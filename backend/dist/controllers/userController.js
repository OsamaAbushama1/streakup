"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRankRequirements = exports.getTopCreators = exports.getPublicProfile = exports.getNextChallenge = exports.redeemReward = exports.unlockCertificate = exports.getUserCertificates = exports.downloadCertificate = exports.getRewards = exports.getAnalytics = exports.updateProfile = exports.resetPassword = exports.forgetPassword = exports.heartbeat = exports.logoutUser = exports.getUserProfile = exports.loginUser = exports.registerUser = exports.checkUsername = exports.checkAuth = exports.authenticateToken = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../models/userModel"));
const commentModel_1 = __importDefault(require("../models/commentModel"));
const projectModel_1 = __importDefault(require("../models/projectModel")); // ← أضف هذا السطر في أعلى الملف
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const challengeModel_1 = __importDefault(require("../models/challengeModel"));
const sharedChallengeModel_1 = __importDefault(require("../models/sharedChallengeModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const generateCertificate_1 = require("../utils/generateCertificate");
const cloudinary_1 = require("../utils/cloudinary");
const isProduction = process.env.NODE_ENV === "production";
const baseCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 3600000,
};
const cookieOptionsWithDomain = {
    ...baseCookieOptions,
    // domain: isProduction ? process.env.COOKIE_DOMAIN : undefined, // Removed to support Next.js rewrites (HostOnly cookies)
};
const authenticateToken = (req, res, next) => {
    // جرب الـ cookie أولاً
    let token = req.cookies.token;
    // لو مفيش cookie، جرب الـ Authorization header
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    console.log('Auth attempt:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        userAgent: req.headers['user-agent']?.substring(0, 50)
    }); // للـ debugging
    if (!token) {
        console.log('No token found');
        return res
            .status(401)
            .json({
            message: "Authentication token is required",
            debug: process.env.NODE_ENV === 'development' ? {
                cookies: Object.keys(req.cookies),
                hasAuthorization: !!req.headers.authorization
            } : undefined
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key-here");
        console.log('Token decoded successfully for user:', decoded.id); // للـ debugging
        req.user = { id: decoded.id };
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(403).json({
            message: "Invalid or expired token",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.authenticateToken = authenticateToken;
const checkAuth = async (req, res) => {
    try {
        console.log('checkAuth called:', {
            hasUser: !!req.user,
            userId: req.user?.id,
            cookies: Object.keys(req.cookies)
        }); // للـ debugging
        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthenticated",
                debug: process.env.NODE_ENV === 'development' ? {
                    cookies: Object.keys(req.cookies),
                    authorization: !!req.headers.authorization
                } : undefined
            });
        }
        // تحقق من وجود المستخدم في الـ database
        const user = await userModel_1.default.findById(req.user.id).select('_id email username');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "Authenticated",
            userId: req.user.id,
            email: user.email,
            username: user.username
        });
    }
    catch (error) {
        console.error("[checkAuth] Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.checkAuth = checkAuth;
const checkUsername = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }
        const existingUser = await userModel_1.default.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username is already taken" });
        }
        return res.status(200).json({ message: "Username is available" });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.checkUsername = checkUsername;
const registerUser = async (req, res) => {
    const { firstName, lastName, username, email, password, track, skillLevel } = req.body;
    if (!firstName || !lastName || !email || !username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await userModel_1.default.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        return res.status(400).json({
            message: existingUser.email === email
                ? "Email already exists"
                : "Username already taken",
        });
    }
    let profilePicture;
    if (req.file) {
        try {
            profilePicture = await (0, cloudinary_1.uploadToCloudinary)(req.file, 'streakup/users');
        }
        catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            return res.status(500).json({ message: "Error uploading profile picture" });
        }
    }
    console.log("Received data:", {
        firstName,
        lastName,
        username,
        email,
        password,
        track,
        skillLevel,
        profilePicture,
        lastLogin: new Date(),
    });
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
            message: "First name, last name, email, and password are required",
        });
    }
    try {
        const existingUser = await userModel_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await userModel_1.default.create({
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
            track,
            skillLevel,
            profilePicture,
            lastLogin: new Date(),
        });
        const token = jsonwebtoken_1.default.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });
        res.cookie("token", token, cookieOptionsWithDomain);
        res.status(201).json({
            user: {
                id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        const user = await userModel_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        user.lastLogin = new Date();
        user.isOnline = true;
        await user.save();
        const token = jsonwebtoken_1.default.sign({
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role
        }, process.env.JWT_SECRET || "secret", { expiresIn: "24h" });
        res.cookie("token", token, cookieOptionsWithDomain);
        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.loginUser = loginUser;
const getUserProfile = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const challengesAggregate = await challengeModel_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalAppreciations: { $sum: "$likes" },
                    totalFeedback: { $sum: "$comments" },
                },
            },
        ]);
        const aggregates = challengesAggregate[0] || {
            totalViews: 0,
            totalAppreciations: 0,
            totalFeedback: 0,
        };
        res.status(200).json({
            user: {
                ...user.toObject(),
                completedProjects: user.completedProjects,
                challengesViews: aggregates.totalViews,
                appreciations: aggregates.totalAppreciations,
                feedback: aggregates.totalFeedback,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getUserProfile = getUserProfile;
const logoutUser = async (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
            const user = await userModel_1.default.findById(decoded.id);
            if (user) {
                user.isOnline = false;
                await user.save();
            }
        }
        catch (err) {
            // إذا كان التوكن منتهي أو غير صالح، لا نفعل شيئًا
        }
    }
    res.clearCookie("token", cookieOptionsWithDomain);
    res.status(200).json({ message: "Logged out successfully" });
};
exports.logoutUser = logoutUser;
const heartbeat = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        await userModel_1.default.findByIdAndUpdate(req.user.id, {
            lastActive: new Date(), // أضف حقل lastActive في الـ schema
            isOnline: true,
        });
        res.status(200).json({ message: "Heartbeat received" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.heartbeat = heartbeat;
const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const token = crypto_1.default.randomBytes(32).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;
        const transporter = nodemailer_1.default.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Request",
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.`,
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Reset link sent to your email" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.forgetPassword = forgetPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await userModel_1.default.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }
        user.password = await bcryptjs_1.default.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.resetPassword = resetPassword;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { firstName, lastName, email, password, track, skillLevel } = req.body;
        let profilePicture;
        if (req.file) {
            try {
                profilePicture = await (0, cloudinary_1.uploadToCloudinary)(req.file, 'streakup/users');
            }
            catch (error) {
                console.error('Error uploading to Cloudinary:', error);
                return res.status(500).json({ message: "Error uploading profile picture" });
            }
        }
        const updatedData = {};
        if (firstName)
            updatedData.firstName = firstName;
        if (lastName)
            updatedData.lastName = lastName;
        if (email)
            updatedData.email = email;
        if (password)
            updatedData.password = await bcryptjs_1.default.hash(password, 10);
        if (track)
            updatedData.track = track;
        if (skillLevel)
            updatedData.skillLevel = skillLevel;
        if (profilePicture)
            updatedData.profilePicture = profilePicture;
        const user = await userModel_1.default.findByIdAndUpdate(userId, updatedData, {
            new: true,
            runValidators: true,
        }).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Profile updated successfully", user });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.updateProfile = updateProfile;
const getAnalytics = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id).select("streak completedChallenges");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const streak = user.streak || 0;
        const calendarDays = 7;
        const activeDayIndex = streak % calendarDays;
        const streakCalendar = Array.from({ length: calendarDays }, (_, i) => ({
            isActive: i < activeDayIndex || (streak >= calendarDays && i < calendarDays),
            number: i + 1,
            className: i < activeDayIndex || (streak >= calendarDays && i < calendarDays)
                ? "bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400"
                : "bg-gray-300",
        }));
        res.status(200).json({
            streakCalendar,
            progress1: user.streak * 5,
            progress2: user.completedChallenges * 10,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getAnalytics = getAnalytics;
const getRewards = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id).select("points badges completedChallenges streak rank");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const sharedChallenges = await sharedChallengeModel_1.default.find({
            user: user._id,
        }).select("likes");
        const totalLikes = sharedChallenges.reduce((sum, challenge) => sum + (challenge.likes || 0), 0);
        const totalComments = await commentModel_1.default.countDocuments({ user: user._id });
        const defaultBadges = [
            {
                name: "First Challenge",
                isUnlocked: (user.completedChallenges || 0) >= 1,
                description: "Complete your first challenge",
            },
            {
                name: "7 Day Streak",
                isUnlocked: (user.streak || 0) >= 7,
                description: "Maintain a streak of 7 days",
            },
            {
                name: "Community Helper",
                isUnlocked: totalComments >= 20,
                description: "Write 20 comments on shared challenges",
            },
            {
                name: "Social Star",
                isUnlocked: totalLikes >= 20,
                description: "Receive 20 likes on your shared challenges",
            },
            {
                name: "30 Day Streak",
                isUnlocked: (user.streak || 0) >= 30,
                description: "Maintain a streak of 30 days",
            },
            {
                name: "Top Ranker",
                isUnlocked: user.points >= 2400,
                description: "Reach the highest rank (Platinum)",
            },
        ];
        const badges = user.badges?.length
            ? user.badges.map((name, index) => ({
                name,
                isUnlocked: index === 0
                    ? (user.completedChallenges || 0) >= 1
                    : index === 1
                        ? (user.streak || 0) >= 7
                        : index === 2
                            ? totalComments >= 20
                            : index === 3
                                ? totalLikes >= 20
                                : index === 4
                                    ? (user.streak || 0) >= 30
                                    : index === 5
                                        ? user.points >= 2400
                                        : false,
                description: defaultBadges[index]?.description || "No description available",
            }))
            : defaultBadges;
        const store = [
            { name: "Custom Profile Badge", points: 300 },
            { name: "Extra Challenge Slot", points: 500 },
            { name: "Highlight Shared Challenge", points: 400 },
            { name: "Streak Saver", points: 200 },
            { name: "Rank Booster", points: 700 },
            { name: "Exclusive Workshop Access", points: 600 },
        ];
        res.status(200).json({
            points: user.points || 0,
            badges,
            store,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getRewards = getRewards;
const updateUserRank = (completedProjects) => {
    if (completedProjects >= 6)
        return "Platinum";
    if (completedProjects >= 4)
        return "Gold";
    if (completedProjects >= 2)
        return "Silver";
    return "Bronze";
};
// داخل نفس الملف (قبل downloadCertificate)
const getRankRequirementsFromProjects = async () => {
    const projects = await projectModel_1.default.find()
        .select("points")
        .sort({ createdAt: 1 })
        .lean();
    if (projects.length === 0) {
        return { Silver: 600, Gold: 1200, Platinum: 1800 };
    }
    const silver = projects.slice(0, 2).reduce((s, p) => s + (p.points || 0), 0);
    const gold = projects.slice(0, 4).reduce((s, p) => s + (p.points || 0), 0);
    const plat = projects.slice(0, 6).reduce((s, p) => s + (p.points || 0), 0);
    return { Silver: silver, Gold: gold, Platinum: plat };
};
const downloadCertificate = async (req, res) => {
    try {
        const { rank } = req.query;
        // تحقق من أن rank موجود ومن نوع string
        if (!rank || Array.isArray(rank)) {
            return res.status(400).json({ message: "Invalid or missing rank" });
        }
        // تحقق من أن القيمة واحدة من الـ ranks المسموحة
        const validRanks = ["Silver", "Gold", "Platinum"];
        if (!validRanks.includes(rank)) {
            return res.status(400).json({ message: "Invalid rank value" });
        }
        // الآن rank آمن ومن النوع الصحيح
        const typedRank = rank;
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const cert = user.certificates?.find((c) => c.rank === typedRank);
        if (!cert?.paid) {
            return res.status(403).json({ message: "Certificate not paid" });
        }
        const fullName = `${user.firstName} ${user.lastName}`;
        const certificateBuffer = await (0, generateCertificate_1.generateCertificate)({
            name: fullName,
            rank: typedRank,
        });
        res.set({
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="${typedRank}-Certificate-${user.username}.png"`,
        });
        res.send(certificateBuffer);
    }
    catch (error) {
        console.error("Error downloading certificate:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.downloadCertificate = downloadCertificate;
// استبدل الدالة القديمة
const calculateRankProgress = (points, rank, required) => {
    if (required === 0)
        return 100;
    return Math.min((points / required) * 100, 100);
};
const getUserCertificates = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        // جيب النقاط المطلوبة ديناميكيًا من المشاريع
        const requirements = await getRankRequirementsFromProjects();
        const currentPoints = user.points || 0;
        const ranks = [
            "Silver",
            "Gold",
            "Platinum",
        ];
        const certificates = ranks.map((rank) => {
            const required = requirements[rank]; // من الـ API
            const progress = calculateRankProgress(currentPoints, rank, required);
            const isUnlocked = progress >= 100;
            const existing = user.certificates?.find((c) => c.rank === rank);
            return {
                rank,
                progress,
                unlocked: isUnlocked,
                paid: existing?.paid || false,
                issuedAt: existing?.issuedAt,
                certificateId: existing?.certificateId,
            };
        });
        res.json({ certificates });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getUserCertificates = getUserCertificates;
const unlockCertificate = async (req, res) => {
    try {
        const { rank, paymentMethod } = req.body;
        const user = await userModel_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const requirements = await getRankRequirementsFromProjects(); // الدالة اللي تحت
        const requiredPoints = requirements[rank];
        const progress = calculateRankProgress(user.points || 0, rank, requiredPoints);
        if (progress < 100)
            return res.status(400).json({ message: "Rank not achieved yet" });
        if (!["instapay", "vodafone_cash"].includes(paymentMethod))
            return res.status(400).json({ message: "Invalid payment method" });
        const certificateBuffer = await (0, generateCertificate_1.generateCertificate)({
            name: `${user.firstName} ${user.lastName}`,
            rank: rank,
        });
        const certificateId = `CERT-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        // تأكد من وجود certificates كـ DocumentArray
        if (!Array.isArray(user.certificates)) {
            // لا تستخدم = [] → خطأ!
            // استخدم: إعادة تعيين من الـ schema
            user.set("certificates", []);
        }
        const certIndex = user.certificates.findIndex((c) => c.rank === rank);
        if (certIndex >= 0) {
            const cert = user.certificates[certIndex];
            cert.paid = true;
            cert.certificateId = certificateId;
            cert.issuedAt = new Date();
            user.markModified(`certificates.${certIndex}`);
        }
        else {
            // استخدم create() + push() → آمن 100%
            const newCert = user.certificates.create({
                rank,
                paid: true,
                certificateId,
                issuedAt: new Date(),
                progress: 100,
                unlocked: true,
            });
            user.certificates.push(newCert);
        }
        await user.save();
        try {
            await (0, generateCertificate_1.sendCertificateEmail)(user.email, `${user.firstName} ${user.lastName}`, rank, certificateBuffer);
        }
        catch (emailError) {
            console.error("Failed to send email:", emailError.message);
        }
        res.json({
            message: "Payment successful! Certificate sent to your email.",
            certificateId,
        });
    }
    catch (error) {
        console.error("خطأ في unlockCertificate:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.unlockCertificate = unlockCertificate;
const redeemReward = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { rewardName, challengeId } = req.body;
        const userId = req.user.id;
        const user = await userModel_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.banUntil && new Date() < user.banUntil) {
            return res
                .status(403)
                .json({ message: "You are banned from redeeming rewards" });
        }
        let pointsRequired;
        switch (rewardName) {
            case "Highlight Shared Challenge":
                pointsRequired = 400;
                if (!challengeId) {
                    return res.status(400).json({ message: "Challenge ID is required" });
                }
                const sharedChallenge = await sharedChallengeModel_1.default.findById(challengeId);
                if (!sharedChallenge || sharedChallenge.user.toString() !== userId) {
                    return res
                        .status(404)
                        .json({ message: "Shared challenge not found or not owned" });
                }
                if (sharedChallenge.highlighted) {
                    return res
                        .status(400)
                        .json({ message: "Challenge already highlighted" });
                }
                if (user.points < pointsRequired) {
                    return res.status(400).json({ message: "Insufficient points" });
                }
                sharedChallenge.highlighted = true;
                sharedChallenge.highlightExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await sharedChallenge.save();
                user.points -= pointsRequired;
                break;
            case "Streak Saver":
                pointsRequired = 200;
                if (user.points < pointsRequired) {
                    return res.status(400).json({ message: "Insufficient points" });
                }
                const today = new Date().setHours(0, 0, 0, 0);
                let inDanger = true;
                if (user.lastLogin) {
                    const lastLoginDay = new Date(user.lastLogin).setHours(0, 0, 0, 0);
                    inDanger = today > lastLoginDay;
                }
                if (!inDanger) {
                    return res.status(400).json({
                        message: "Your points will be wasted because there are no challenges in danger.",
                    });
                }
                user.streakSavers = (user.streakSavers || 0) + 1;
                user.points -= pointsRequired;
                user.lastLogin = new Date();
                break;
            case "Challenge Boost":
                pointsRequired = 500;
                if (!challengeId) {
                    return res.status(400).json({ message: "Challenge ID is required" });
                }
                const challenge = await challengeModel_1.default.findOne({ challengeId }).populate("project", "_id name track points");
                if (!challenge) {
                    return res.status(404).json({ message: "Challenge not found" });
                }
                if (user.challenges.some((id) => id.equals(challenge._id))) {
                    return res
                        .status(400)
                        .json({ message: "Challenge already completed" });
                }
                if (user.points < pointsRequired) {
                    return res.status(400).json({ message: "Insufficient points" });
                }
                // جلب نقاط التحديات المكتملة مسبقًا للمشروع
                let totalCompletedPoints = 0;
                if (challenge.project) {
                    const project = await mongoose_1.default
                        .model("Project")
                        .findById(challenge.project._id);
                    if (!project) {
                        return res.status(404).json({ message: "Project not found" });
                    }
                    const userCompletedChallenges = await challengeModel_1.default.find({
                        _id: { $in: user.challenges },
                        project: challenge.project._id,
                    });
                    totalCompletedPoints = userCompletedChallenges.reduce((sum, ch) => sum + (ch.points || 50), 0);
                }
                // إضافة التحدي الحالي
                user.challenges.push(challenge._id);
                user.completedChallenges += 1;
                user.streak += 1;
                user.points += challenge.points || 50;
                // تحقق من اكتمال المشروع بعد إضافة التحدي
                if (challenge.project) {
                    const project = await mongoose_1.default
                        .model("Project")
                        .findById(challenge.project._id);
                    if (!project) {
                        return res.status(404).json({ message: "Project not found" });
                    }
                    totalCompletedPoints += challenge.points || 50; // إضافة نقاط التحدي الحالي
                    if (totalCompletedPoints >= project.points) {
                        user.completedProjects += 1;
                        console.log(`[redeemReward] Project completed for user ${user._id}, completedProjects: ${user.completedProjects}, total points: ${totalCompletedPoints}/${project.points}`);
                    }
                }
                const oldRank = user.rank;
                user.rank = updateUserRank(user.completedProjects);
                if (user.rank !== oldRank && user.rank !== "Bronze") {
                    try {
                        const certificateBuffer = await (0, generateCertificate_1.generateCertificate)({
                            name: `${user.firstName} ${user.lastName}`,
                            rank: user.rank,
                        });
                        await (0, generateCertificate_1.sendCertificateEmail)(user.email, `${user.firstName} ${user.lastName}`, user.rank, certificateBuffer);
                        console.log(`Certificate sent to ${user.email} for ${user.rank} rank`);
                    }
                    catch (emailErr) {
                        console.error("Failed to send certificate email:", emailErr);
                    }
                }
                user.points -= pointsRequired;
                challenge.likes += 1;
                await Promise.all([user.save(), challenge.save()]);
                break;
            default:
                return res.status(400).json({ message: "Invalid reward" });
        }
        await user.save();
        res.status(200).json({
            message: `${rewardName} redeemed successfully`,
            points: user.points,
            streakSavers: user.streakSavers,
        });
    }
    catch (error) {
        console.error("Error in redeemReward:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.redeemReward = redeemReward;
const getNextChallenge = async (req, res) => {
    try {
        const user = await userModel_1.default.findById(req.user?.id).select("track challenges");
        if (!user || !user.track) {
            return res
                .status(200)
                .json({ nextChallenge: null, message: "No track selected" });
        }
        // جلب التحديات مع populate للـ project
        const challenges = await challengeModel_1.default.find({ category: user.track })
            .sort({ createdAt: 1 })
            .populate("project", "name") // أضف populate هنا
            .select("challengeId name overview previewImages category project duration");
        if (challenges.length === 0) {
            return res
                .status(200)
                .json({ nextChallenge: null, message: "No challenges in your track" });
        }
        const completedIds = user.challenges.map((c) => c.toString());
        const nextChallenge = challenges.find((ch) => !completedIds.includes(ch._id.toString()));
        if (!nextChallenge) {
            return res.status(200).json({
                nextChallenge: null,
                message: "New challenge coming soon!",
            });
        }
        res.status(200).json({
            nextChallenge: {
                challengeId: nextChallenge.challengeId,
                name: nextChallenge.name,
                description: nextChallenge.overview,
                image: nextChallenge.previewImages?.[0],
                track: nextChallenge.category,
                project: nextChallenge.project
                    ? { name: nextChallenge.project.name } // Type-safe
                    : null,
                duration: nextChallenge.duration || 1,
            },
        });
    }
    catch (error) {
        console.error("Error in getNextChallenge:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getNextChallenge = getNextChallenge;
const getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await userModel_1.default.findOne({ username }).select("firstName lastName email track skillLevel profilePicture streak points completedChallenges rank completedProjects");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        console.error("Error fetching public profile:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getPublicProfile = getPublicProfile;
const getTopCreators = async (req, res) => {
    try {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = الأحد, 1 = الإثنين, ..., 5 = الجمعة, 6 = السبت
        // احسب تاريخ الجمعة الماضية (أو اليوم لو اليوم جمعة)
        const friday = new Date(now);
        const daysToFriday = (5 - currentDay + 7) % 7 || 7; // لو اليوم جمعة، نأخذ اليوم نفسه
        friday.setDate(now.getDate() - daysToFriday);
        friday.setHours(0, 0, 0, 0); // بداية الجمعة
        // الخميس الحالي (نهاية الأسبوع)
        const thursday = new Date(friday);
        thursday.setDate(friday.getDate() + 6); // الجمعة + 6 = الخميس
        thursday.setHours(23, 59, 59, 999); // نهاية الخميس
        const topCreators = await userModel_1.default.find({
            lastLogin: { $gte: friday, $lte: thursday },
            points: { $exists: true },
            role: "User",
        })
            .sort({ points: -1, streak: -1 })
            .limit(3)
            .select("firstName lastName profilePicture track streak points username")
            .lean();
        res.status(200).json({ topCreators });
    }
    catch (error) {
        console.error("Error in getTopCreators:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getTopCreators = getTopCreators;
// جيب النقاط المطلوبة لكل رتبة بناءً على المشاريع
const getRankRequirements = async (req, res) => {
    try {
        // جيب كل المشاريع مع نقاطها، مرتبة حسب تاريخ الإنشاء (الأقدم أولاً)
        const projects = await projectModel_1.default.find()
            .select("points")
            .sort({ createdAt: 1 })
            .lean();
        // لو مفيش مشاريع → ارجع قيم افتراضية (مؤقتًا)
        if (projects.length === 0) {
            return res.json({
                requirements: {
                    Silver: 600,
                    Gold: 1200,
                    Platinum: 1800,
                },
            });
        }
        // احسب النقاط الكلية لأول N مشاريع
        const silverPoints = projects
            .slice(0, 2)
            .reduce((sum, p) => sum + (p.points || 0), 0);
        const goldPoints = projects
            .slice(0, 4)
            .reduce((sum, p) => sum + (p.points || 0), 0);
        const platinumPoints = projects
            .slice(0, 6)
            .reduce((sum, p) => sum + (p.points || 0), 0);
        res.json({
            requirements: {
                Silver: silverPoints,
                Gold: goldPoints,
                Platinum: platinumPoints,
            },
        });
    }
    catch (err) {
        console.error("[getRankRequirements] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getRankRequirements = getRankRequirements;

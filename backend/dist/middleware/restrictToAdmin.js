"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictToAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../models/userModel"));
const restrictToAdmin = async (req, res, next) => {
    let token;
    // التحقق من وجود التوكن في رأس الطلب
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // التحقق من وجود التوكن في الكوكيز إذا لم يكن في رأس الطلب
    else if (req.cookies.token) {
        token = req.cookies.token;
    }
    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // جلب المستخدم من قاعدة البيانات
        const user = await userModel_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // التحقق من أن المستخدم هو أدمن
        if (user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};
exports.restrictToAdmin = restrictToAdmin;

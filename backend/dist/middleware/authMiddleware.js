"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * JWT Authentication Middleware
 * Protects routes by verifying JWT tokens from Authorization header or cookies
 */
const protect = (req, res, next) => {
    let token;
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    // Check for token in Authorization header
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies if not in header
    else if (req.cookies.token) {
        token = req.cookies.token;
    }
    // No token found
    if (!token) {
        console.warn(`[AUTH FAILED] No token provided from IP: ${ip}, Path: ${req.path}`);
        return res.status(401).json({
            success: false,
            message: "Not authorized, no token provided",
            error: "NO_TOKEN",
            hint: "Please log in to access this resource.",
        });
    }
    // Verify token
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        // Token is invalid or expired
        const errorMessage = error instanceof jsonwebtoken_1.default.TokenExpiredError
            ? "Token has expired"
            : "Invalid token";
        console.warn(`[AUTH FAILED] ${errorMessage} from IP: ${ip}, Path: ${req.path}`);
        return res.status(401).json({
            success: false,
            message: `Not authorized, ${errorMessage.toLowerCase()}`,
            error: error instanceof jsonwebtoken_1.default.TokenExpiredError ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
            hint: error instanceof jsonwebtoken_1.default.TokenExpiredError
                ? "Your session has expired. Please log in again."
                : "Please log in again.",
        });
    }
};
exports.protect = protect;

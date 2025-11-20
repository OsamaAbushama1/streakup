"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
// Routes
const routes_1 = __importDefault(require("./routes"));
// Config
const db_1 = __importDefault(require("./config/db"));
// Security Middleware
const botDetection_1 = require("./middleware/botDetection");
const rateLimiter_1 = require("./middleware/rateLimiter");
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
app.set("trust proxy", 1);
// === Middleware ===
app.use((0, cookie_parser_1.default)());
// CORS Configuration - Restricted to main domain only
const allowedOrigins = [
    process.env.FRONTEND_URL?.replace(/\/$/, ""),
    process.env.ADMIN_URL?.replace(/\/$/, ""),
    // Only allow localhost in development
    ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:3000", "http://127.0.0.1:3000"]
        : []),
].filter(Boolean);
app.use((0, cors_1.default)({
    origin(origin, callback) {
        // Allow requests with no origin (mobile apps, server-to-server, etc.)
        // This is common for mobile apps and some legitimate use cases
        if (!origin) {
            return callback(null, true);
        }
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Log blocked origin for monitoring
        console.warn(`[CORS BLOCKED] Origin ${origin} not allowed`);
        // Reject the request (don't throw error, just return false)
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
}));
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// === Security Middleware for API Routes ===
// Apply bot detection and rate limiting to all API routes
app.use("/api", botDetection_1.detectBot); // Block bots and scrapers
app.use("/api", rateLimiter_1.strictApiLimiter); // 30 requests per minute limit
// === All Routes ===
app.use("/api", routes_1.default);
// === Health Check ===
app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
});
// === MongoDB ===
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("Database connection error:", err));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

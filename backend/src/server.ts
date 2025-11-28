// src/server.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import mongoose from "mongoose";

// Routes
import routes from "./routes";
// Config
import connectDB from "./config/db";
// Security Middleware
import { detectBot } from "./middleware/botDetection";
import { strictApiLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
// Utilities
import { validateEnv } from "./utils/validateEnv";

// Load environment variables
dotenv.config();

// Validate environment variables before starting server
validateEnv();

// Connect to database
connectDB();

const app = express();
app.set("trust proxy", 1);

// === Security Headers & HTTPS Enforcement ===
const isProduction = process.env.NODE_ENV === "production";

// Force HTTPS in production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      return res.redirect(`https://${req.header("host")}${req.url}`);
    }
    next();
  });
}

// Security headers
app.use((req, res, next) => {
  // HTTP Strict Transport Security (HSTS)
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS Protection (legacy browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (restrict features)
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  next();
});

// === Middleware ===
app.use(cookieParser());

// CORS Configuration - Restricted to main domain only
const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/$/, ""),
  process.env.ADMIN_URL?.replace(/\/$/, ""),
  // Only allow localhost in development
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
].filter(Boolean) as string[];

app.use(
  cors({
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
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// === Security Middleware for API Routes ===
// Apply bot detection and rate limiting to all API routes
app.use("/api", detectBot);           // Block bots and scrapers
app.use("/api", strictApiLimiter);    // 30 requests per minute limit

// === All Routes ===
app.use("/api", routes);

// === Health Check ===
app.get("/", (req, res) => {
  res.json({
    message: "Server is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

// === Error Handling ===
// 404 handler - must be after all routes
app.use(notFoundHandler);

// Centralized error handler - must be last
app.use(errorHandler);

// === MongoDB ===
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1); // Exit if database connection fails
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API: http://localhost:${PORT}/api\n`);
});

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

dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);

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
      // Allow requests with no origin (mobile apps, Postman in dev, etc.)
      if (!origin && process.env.NODE_ENV === "development") {
        return callback(null, true);
      }

      if (!origin) {
        return callback(new Error("Origin not allowed by CORS"));
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS BLOCKED] Origin ${origin} not allowed`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
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
  res.json({ message: "Server is running" });
});

// === MongoDB ===
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("Database connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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

dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);

// === Middleware ===
app.use(cookieParser());
const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/$/, ""),
  process.env.ADMIN_URL?.replace(/\/$/, ""),
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
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

// === كل الـ Routes في مكان واحد ===
app.use("/api", routes); // كل شيء من هنا

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

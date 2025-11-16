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

// === Middleware ===
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
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

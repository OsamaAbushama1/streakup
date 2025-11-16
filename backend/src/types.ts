// src/types.ts
import { Request } from "express";
import { Document } from "mongoose";

export interface AuthRequest extends Request {
  user?: Document & { id: string; role: string }; // Adjust based on your User model
}

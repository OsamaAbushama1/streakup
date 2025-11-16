import { Types } from "mongoose";

export interface User {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  track?:
    | "UI/UX Design"
    | "Graphic Design"
    | "Frontend Development"
    | "Backend Development"
    | null;
  skillLevel?: "Beginner" | "Intermediate" | "Advanced" | null;
  profilePicture?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  role: "User" | "Admin";
  streak: number;
  totalPoints: number;
  completedChallenges: Types.ObjectId[];
  rank: string;
}

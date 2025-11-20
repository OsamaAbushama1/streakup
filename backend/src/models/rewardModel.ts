import mongoose, { Schema, Document } from "mongoose";

export interface IReward extends Document {
    name: string;
    description: string;
    points: number;
    isLocked: boolean;
    icon: string; // Store icon name or type
}

const rewardSchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    points: { type: Number, required: true },
    isLocked: { type: Boolean, default: true },
    icon: { type: String, required: true }, // e.g., "highlight", "saver", "boost"
});

export default mongoose.model<IReward>("Reward", rewardSchema);

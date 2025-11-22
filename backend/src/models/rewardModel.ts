import mongoose, { Schema, Document } from 'mongoose';

export interface IReward extends Document {
    name: string;
    description: string;
    points: number;
    icon?: string;
    isAvailable: boolean;
    isSystem: boolean; // To mark the original 3 rewards so they aren't deleted
}

const rewardSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    points: { type: Number, required: true },
    icon: { type: String },
    isAvailable: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IReward>('Reward', rewardSchema);

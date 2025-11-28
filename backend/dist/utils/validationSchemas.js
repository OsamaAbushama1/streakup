"use strict";
/**
 * Zod Validation Schemas
 * Defines validation rules for all API inputs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.banUserSchema = exports.updateUserSchema = exports.createRewardSchema = exports.redeemRewardSchema = exports.createTrackSchema = exports.createProjectSchema = exports.createCommentSchema = exports.shareChallengeSchema = exports.createChallengeSchema = exports.resetPasswordSchema = exports.forgetPasswordSchema = exports.updateProfileSchema = exports.loginUserSchema = exports.registerUserSchema = void 0;
const zod_1 = require("zod");
// ==================== PASSWORD VALIDATION ====================
const passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
// ==================== USER SCHEMAS ====================
exports.registerUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').max(50, 'First name too long').trim(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50, 'Last name too long').trim(),
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .trim(),
    email: zod_1.z.string().email('Invalid email format').toLowerCase().trim(),
    password: passwordSchema,
    track: zod_1.z.string().min(1, 'Track is required'),
    skillLevel: zod_1.z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
});
exports.loginUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').toLowerCase().trim(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(50).trim().optional(),
    lastName: zod_1.z.string().min(1).max(50).trim().optional(),
    email: zod_1.z.string().email().toLowerCase().trim().optional(),
    password: passwordSchema.optional(),
    track: zod_1.z.string().optional(),
    skillLevel: zod_1.z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
});
exports.forgetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').toLowerCase().trim(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
});
// ==================== CHALLENGE SCHEMAS ====================
exports.createChallengeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Challenge name is required').max(200, 'Name too long').trim(),
    category: zod_1.z.string().min(1, 'Category is required').trim(),
    challengeId: zod_1.z.string().min(1, 'Challenge ID is required').trim(),
    duration: zod_1.z.number().int().min(1, 'Duration must be at least 1 day').max(365, 'Duration too long'),
    points: zod_1.z.number().int().min(0, 'Points cannot be negative').max(10000, 'Points too high'),
    overview: zod_1.z.string().min(1, 'Overview is required').max(1000, 'Overview too long').trim(),
    challengeDetails: zod_1.z.string().min(1, 'Challenge details are required').max(5000, 'Details too long').trim(),
    challengeSteps: zod_1.z.string().min(1, 'Challenge steps are required').max(5000, 'Steps too long').trim(),
    requirements: zod_1.z.string().min(1, 'Requirements are required').max(2000, 'Requirements too long').trim(),
    project: zod_1.z.string().optional(),
});
exports.shareChallengeSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, 'Description is required').max(1000, 'Description too long').trim(),
});
// ==================== COMMENT SCHEMAS ====================
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Comment cannot be empty').max(500, 'Comment too long').trim(),
});
// ==================== PROJECT SCHEMAS ====================
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required').max(200, 'Name too long').trim(),
    track: zod_1.z.string().min(1, 'Track is required').trim(),
});
// ==================== TRACK SCHEMAS ====================
exports.createTrackSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Track name is required').max(100, 'Name too long').trim(),
});
// ==================== REWARD SCHEMAS ====================
exports.redeemRewardSchema = zod_1.z.object({
    rewardName: zod_1.z.string().min(1, 'Reward name is required'),
    challengeId: zod_1.z.string().optional(),
    theme: zod_1.z.string().optional(),
});
exports.createRewardSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Reward name is required').max(100, 'Name too long').trim(),
    description: zod_1.z.string().min(1, 'Description is required').max(500, 'Description too long').trim(),
    points: zod_1.z.number().int().min(0, 'Points cannot be negative').max(10000, 'Points too high'),
    isAvailable: zod_1.z.boolean().default(false),
});
// ==================== ADMIN SCHEMAS ====================
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(50).trim().optional(),
    lastName: zod_1.z.string().min(1).max(50).trim().optional(),
    email: zod_1.z.string().email().toLowerCase().trim().optional(),
    track: zod_1.z.string().optional(),
    skillLevel: zod_1.z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    role: zod_1.z.enum(['User', 'Admin', 'SuperAdmin']).optional(),
    points: zod_1.z.number().int().min(0).optional(),
    streak: zod_1.z.number().int().min(0).optional(),
});
exports.banUserSchema = zod_1.z.object({
    banUntil: zod_1.z.string().datetime().optional().or(zod_1.z.null()),
});

/**
 * Zod Validation Schemas
 * Defines validation rules for all API inputs
 */

import { z } from 'zod';

// ==================== PASSWORD VALIDATION ====================
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

// ==================== USER SCHEMAS ====================

export const registerUserSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').trim(),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').trim(),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .trim(),
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: passwordSchema,
    track: z.string().min(1, 'Track is required'),
    skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
});

export const loginUserSchema = z.object({
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
    firstName: z.string().min(1).max(50).trim().optional(),
    lastName: z.string().min(1).max(50).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    password: passwordSchema.optional(),
    track: z.string().optional(),
    skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
});

export const forgetPasswordSchema = z.object({
    email: z.string().email('Invalid email format').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
});

// ==================== CHALLENGE SCHEMAS ====================

export const createChallengeSchema = z.object({
    name: z.string().min(1, 'Challenge name is required').max(200, 'Name too long').trim(),
    category: z.string().min(1, 'Category is required').trim(),
    challengeId: z.string().min(1, 'Challenge ID is required').trim(),
    duration: z.number().int().min(1, 'Duration must be at least 1 day').max(365, 'Duration too long'),
    points: z.number().int().min(0, 'Points cannot be negative').max(10000, 'Points too high'),
    overview: z.string().min(1, 'Overview is required').max(1000, 'Overview too long').trim(),
    challengeDetails: z.string().min(1, 'Challenge details are required').max(5000, 'Details too long').trim(),
    challengeSteps: z.string().min(1, 'Challenge steps are required').max(5000, 'Steps too long').trim(),
    requirements: z.string().min(1, 'Requirements are required').max(2000, 'Requirements too long').trim(),
    project: z.string().optional(),
});

export const shareChallengeSchema = z.object({
    description: z.string().min(1, 'Description is required').max(1000, 'Description too long').trim(),
});

// ==================== COMMENT SCHEMAS ====================

export const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment too long').trim(),
});

// ==================== PROJECT SCHEMAS ====================

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(200, 'Name too long').trim(),
    track: z.string().min(1, 'Track is required').trim(),
});

// ==================== TRACK SCHEMAS ====================

export const createTrackSchema = z.object({
    name: z.string().min(1, 'Track name is required').max(100, 'Name too long').trim(),
});

// ==================== REWARD SCHEMAS ====================

export const redeemRewardSchema = z.object({
    rewardName: z.string().min(1, 'Reward name is required'),
    challengeId: z.string().optional(),
    theme: z.string().optional(),
});

export const createRewardSchema = z.object({
    name: z.string().min(1, 'Reward name is required').max(100, 'Name too long').trim(),
    description: z.string().min(1, 'Description is required').max(500, 'Description too long').trim(),
    points: z.number().int().min(0, 'Points cannot be negative').max(10000, 'Points too high'),
    isAvailable: z.boolean().default(false),
});

// ==================== ADMIN SCHEMAS ====================

export const updateUserSchema = z.object({
    firstName: z.string().min(1).max(50).trim().optional(),
    lastName: z.string().min(1).max(50).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    track: z.string().optional(),
    skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    role: z.enum(['User', 'Admin', 'SuperAdmin']).optional(),
    points: z.number().int().min(0).optional(),
    streak: z.number().int().min(0).optional(),
});

export const banUserSchema = z.object({
    banUntil: z.string().datetime().optional().or(z.null()),
});

// ==================== TYPE EXPORTS ====================

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;

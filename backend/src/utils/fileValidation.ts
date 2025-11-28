/**
 * File Upload Validation Utilities
 * Validates file types, sizes, and sanitizes file names
 */

import { Request } from 'express';
import multer from 'multer';
import path from 'path';

// Allowed MIME types for images
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Validates file type and size
 */
export const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    // Check MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return cb(
            new Error(
                `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
            )
        );
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(
            new Error(
                `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
            )
        );
    }

    // File is valid
    cb(null, true);
};

/**
 * Sanitizes file name by removing special characters
 */
export const sanitizeFileName = (fileName: string): string => {
    // Get file extension
    const ext = path.extname(fileName);
    // Get file name without extension
    const nameWithoutExt = path.basename(fileName, ext);

    // Remove special characters and spaces
    const sanitized = nameWithoutExt
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now();

    return `${sanitized}_${timestamp}${ext}`;
};

/**
 * Multer configuration for file uploads
 */
export const uploadConfig = {
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5, // Maximum 5 files per request
    },
};

/**
 * Validates uploaded file size
 */
export const validateFileSize = (file: Express.Multer.File): boolean => {
    return file.size <= MAX_FILE_SIZE;
};

/**
 * Validates multiple uploaded files
 */
export const validateFiles = (files: Express.Multer.File[]): {
    valid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    if (files.length > 5) {
        errors.push('Maximum 5 files allowed per upload');
    }

    files.forEach((file, index) => {
        if (!validateFileSize(file)) {
            errors.push(
                `File ${index + 1} (${file.originalname}) exceeds maximum size of 5MB`
            );
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            errors.push(
                `File ${index + 1} (${file.originalname}) has invalid type: ${file.mimetype}`
            );
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
};

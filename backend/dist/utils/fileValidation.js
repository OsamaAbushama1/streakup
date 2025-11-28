"use strict";
/**
 * File Upload Validation Utilities
 * Validates file types, sizes, and sanitizes file names
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFiles = exports.validateFileSize = exports.uploadConfig = exports.sanitizeFileName = exports.fileFilter = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
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
const fileFilter = (req, file, cb) => {
    // Check MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
    }
    // Check file extension
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
    // File is valid
    cb(null, true);
};
exports.fileFilter = fileFilter;
/**
 * Sanitizes file name by removing special characters
 */
const sanitizeFileName = (fileName) => {
    // Get file extension
    const ext = path_1.default.extname(fileName);
    // Get file name without extension
    const nameWithoutExt = path_1.default.basename(fileName, ext);
    // Remove special characters and spaces
    const sanitized = nameWithoutExt
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now();
    return `${sanitized}_${timestamp}${ext}`;
};
exports.sanitizeFileName = sanitizeFileName;
/**
 * Multer configuration for file uploads
 */
exports.uploadConfig = {
    storage: multer_1.default.memoryStorage(),
    fileFilter: exports.fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5, // Maximum 5 files per request
    },
};
/**
 * Validates uploaded file size
 */
const validateFileSize = (file) => {
    return file.size <= MAX_FILE_SIZE;
};
exports.validateFileSize = validateFileSize;
/**
 * Validates multiple uploaded files
 */
const validateFiles = (files) => {
    const errors = [];
    if (files.length > 5) {
        errors.push('Maximum 5 files allowed per upload');
    }
    files.forEach((file, index) => {
        if (!(0, exports.validateFileSize)(file)) {
            errors.push(`File ${index + 1} (${file.originalname}) exceeds maximum size of 5MB`);
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            errors.push(`File ${index + 1} (${file.originalname}) has invalid type: ${file.mimetype}`);
        }
    });
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validateFiles = validateFiles;

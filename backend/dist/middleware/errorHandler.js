"use strict";
/**
 * Centralized Error Handling Middleware
 * Catches all errors and returns appropriate responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
// Custom error class for operational errors
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Error handling middleware
 * Should be placed after all routes
 */
const errorHandler = (err, req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';
    // Default error values
    let statusCode = 500;
    let message = 'An unexpected error occurred';
    let errors = undefined;
    // Handle AppError (operational errors)
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    }
    // Handle Mongoose duplicate key errors
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyPattern)[0];
        message = `${field} already exists`;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Log error details server-side
    if (!isProduction || statusCode === 500) {
        console.error('❌ Error:', {
            message: err.message,
            stack: err.stack,
            statusCode,
            path: req.path,
            method: req.method,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });
    }
    // Send response
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        // Only include stack trace in development
        ...(isProduction ? {} : { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 * Should be placed before error handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async handler wrapper
 * Catches errors in async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;

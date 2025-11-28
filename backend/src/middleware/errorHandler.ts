/**
 * Centralized Error Handling Middleware
 * Catches all errors and returns appropriate responses
 */

import { Request, Response, NextFunction } from 'express';

// Custom error class for operational errors
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error handling middleware
 * Should be placed after all routes
 */
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Default error values
    let statusCode = 500;
    let message = 'An unexpected error occurred';
    let errors: any = undefined;

    // Handle AppError (operational errors)
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        errors = Object.values((err as any).errors).map((e: any) => ({
            field: e.path,
            message: e.message,
        }));
    }

    // Handle Mongoose duplicate key errors
    if ((err as any).code === 11000) {
        statusCode = 400;
        const field = Object.keys((err as any).keyPattern)[0];
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

/**
 * 404 Not Found handler
 * Should be placed before error handler
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const error = new AppError(
        `Route ${req.originalUrl} not found`,
        404
    );
    next(error);
};

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

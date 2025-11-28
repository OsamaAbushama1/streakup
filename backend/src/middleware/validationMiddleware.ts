/**
 * Validation Middleware
 * Validates request data against Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Creates a validation middleware for the specified schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate and sanitize the request body
            const validated = await schema.parseAsync(req.body);

            // Replace request body with validated and sanitized data
            req.body = validated;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format validation errors for user-friendly response
                const errors = error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors,
                });
            }

            // Unexpected error
            next(error);
        }
    };
};

/**
 * Validates query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = await schema.parseAsync(req.query);
            req.query = validated as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Query validation failed',
                    errors,
                });
            }

            next(error);
        }
    };
};

/**
 * Validates URL parameters
 */
export const validateParams = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = await schema.parseAsync(req.params);
            req.params = validated as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Parameter validation failed',
                    errors,
                });
            }

            next(error);
        }
    };
};

"use strict";
/**
 * Validation Middleware
 * Validates request data against Zod schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Creates a validation middleware for the specified schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate and sanitize the request body
            const validated = await schema.parseAsync(req.body);
            // Replace request body with validated and sanitized data
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.validate = validate;
/**
 * Validates query parameters
 */
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync(req.query);
            req.query = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.validateQuery = validateQuery;
/**
 * Validates URL parameters
 */
const validateParams = (schema) => {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync(req.params);
            req.params = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.validateParams = validateParams;

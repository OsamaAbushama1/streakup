"use strict";
/**
 * Environment Variable Validation
 * Validates required environment variables on server startup
 * Prevents server from starting with missing or invalid configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
exports.getRequiredEnv = getRequiredEnv;
exports.getOptionalEnv = getOptionalEnv;
const REQUIRED_ENV_VARS = [
    'MONGO_URI',
    'JWT_SECRET',
    'FRONTEND_URL',
];
const PRODUCTION_REQUIRED_ENV_VARS = [
    'EMAIL_USER',
    'EMAIL_PASS',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
];
// Dangerous default values that should never be used in production
const DANGEROUS_DEFAULTS = [
    'your-secret-key-here',
    'secret',
    'your-super-secret-jwt-key-change-this-in-production',
    'change-this',
    'default',
];
/**
 * Validates that all required environment variables are set
 * @throws Error if validation fails
 */
function validateEnv() {
    const isProduction = process.env.NODE_ENV === 'production';
    const errors = [];
    // Check required variables
    for (const varName of REQUIRED_ENV_VARS) {
        const value = process.env[varName];
        if (!value) {
            errors.push(`Missing required environment variable: ${varName}`);
            continue;
        }
        // Check for dangerous defaults
        if (DANGEROUS_DEFAULTS.some(dangerous => value.includes(dangerous))) {
            errors.push(`Environment variable ${varName} contains a default/placeholder value. Please set a proper value.`);
        }
        // Validate JWT_SECRET strength
        if (varName === 'JWT_SECRET') {
            if (value.length < 32) {
                errors.push(`JWT_SECRET must be at least 32 characters long. Current length: ${value.length}`);
            }
        }
        // Validate URL format
        if (varName.includes('URL')) {
            try {
                new URL(value);
            }
            catch {
                errors.push(`Invalid URL format for ${varName}: ${value}`);
            }
        }
    }
    // Additional checks for production
    if (isProduction) {
        for (const varName of PRODUCTION_REQUIRED_ENV_VARS) {
            if (!process.env[varName]) {
                errors.push(`Missing required production environment variable: ${varName}`);
            }
        }
        // Ensure JWT_SECRET is strong in production
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret && jwtSecret.length < 64) {
            console.warn(`⚠️  WARNING: JWT_SECRET should be at least 64 characters in production. Current: ${jwtSecret.length} characters.`);
            console.warn(`   Generate a strong secret with: openssl rand -base64 64`);
        }
    }
    // Throw error if any validation failed
    if (errors.length > 0) {
        console.error('\n❌ Environment Variable Validation Failed:\n');
        errors.forEach(error => console.error(`   - ${error}`));
        console.error('\n💡 Please check your .env file and ensure all required variables are set.');
        console.error('   See .env.example for reference.\n');
        throw new Error('Environment validation failed. Server cannot start.');
    }
    // Success message
    console.log('✅ Environment variables validated successfully');
    if (isProduction) {
        console.log('🔒 Running in PRODUCTION mode with enhanced security');
    }
    else {
        console.log('🔧 Running in DEVELOPMENT mode');
    }
}
/**
 * Gets a required environment variable
 * @throws Error if variable is not set
 */
function getRequiredEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
}
/**
 * Gets an optional environment variable with a default value
 */
function getOptionalEnv(key, defaultValue) {
    return process.env[key] || defaultValue;
}

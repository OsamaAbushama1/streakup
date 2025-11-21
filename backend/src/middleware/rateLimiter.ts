import rateLimit from "express-rate-limit";

/**
 * Strict API Rate Limiter - 300 requests per minute
 * Applied to all API endpoints to prevent scraping and abuse
 */
export const strictApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Limit each IP to 300 requests per minute
  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests from this IP address. You have exceeded the limit of 300 requests per minute.",
    hint: "Please wait a moment before trying again.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false, // Count failed requests too
});

// General API rate limiter - more lenient for specific use cases
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication endpoints (login, register, password reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs (reasonable for legitimate use)
  message: {
    success: false,
    error: "AUTH_RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
    hint: "If you forgot your password, use the password reset feature.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
  skipFailedRequests: false, // Count failed requests
});

// Even stricter limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: "PASSWORD_RESET_LIMIT_EXCEEDED",
    message: "Too many password reset attempts. Please wait 1 hour before trying again.",
    hint: "Check your email for previous reset requests.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});


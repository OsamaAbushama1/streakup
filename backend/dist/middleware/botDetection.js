"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBotLenient = exports.detectBot = void 0;
/**
 * Bot Detection Middleware
 * Detects and blocks automated scraping tools and bots
 * Allows legitimate browsers and optionally search engine crawlers
 */
// List of known bot/scraper user agents to block
const BLOCKED_USER_AGENTS = [
    // Python libraries
    "python-requests",
    "python-urllib",
    "python-httpx",
    "aiohttp",
    // Command line tools
    "curl",
    "wget",
    "httpie",
    // Scraping frameworks
    "scrapy",
    "beautifulsoup",
    "mechanize",
    "selenium",
    "puppeteer",
    "playwright",
    // API testing tools
    "postman",
    "insomnia",
    "httpie",
    "rest-client",
    // Other automated tools
    "bot",
    "crawler",
    "spider",
    "scraper",
    "headless",
    "phantom",
    "axios", // Block direct axios usage (not from browsers)
    "node-fetch",
    "got",
    "superagent",
];
// Legitimate search engine crawlers (optional - uncomment to allow)
const ALLOWED_CRAWLERS = [
// "googlebot",
// "bingbot",
// "slurp", // Yahoo
// "duckduckbot",
// "baiduspider",
// "yandexbot",
// "facebookexternalhit",
// "twitterbot",
];
/**
 * Check if user agent is a blocked bot/scraper
 */
function isBlockedBot(userAgent) {
    if (!userAgent)
        return true; // Block requests with no user agent
    const lowerUA = userAgent.toLowerCase();
    // Check if it's an allowed crawler
    for (const crawler of ALLOWED_CRAWLERS) {
        if (lowerUA.includes(crawler.toLowerCase())) {
            return false;
        }
    }
    // Check if it's a blocked bot
    for (const bot of BLOCKED_USER_AGENTS) {
        if (lowerUA.includes(bot.toLowerCase())) {
            return true;
        }
    }
    return false;
}
/**
 * Check if request has suspicious headers (missing common browser headers)
 */
function hasSuspiciousHeaders(req) {
    const userAgent = req.headers["user-agent"];
    const accept = req.headers["accept"];
    const acceptLanguage = req.headers["accept-language"];
    const acceptEncoding = req.headers["accept-encoding"];
    // Missing user agent is suspicious
    if (!userAgent)
        return true;
    // Legitimate browsers typically send these headers
    // If all are missing, it's likely a bot
    if (!accept && !acceptLanguage && !acceptEncoding) {
        return true;
    }
    // Check for suspicious accept headers
    // Browsers typically accept text/html, while bots often accept */* or application/json only
    if (accept && !accept.includes("text/html") && !accept.includes("*/*")) {
        // If it's only accepting JSON and not from a browser, it's suspicious
        if (accept === "application/json" && !userAgent.toLowerCase().includes("mozilla")) {
            return true;
        }
    }
    return false;
}
/**
 * Bot Detection Middleware
 */
const detectBot = (req, res, next) => {
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    // Check if user agent is a known bot
    if (isBlockedBot(userAgent)) {
        console.warn(`[BOT DETECTED] Blocked bot from IP: ${ip}, User-Agent: ${userAgent}`);
        res.status(403).json({
            success: false,
            message: "Access denied. Automated access is not permitted.",
            error: "BOT_DETECTED",
            hint: "If you believe this is an error, please contact support.",
        });
        return;
    }
    // Check for suspicious headers (optional - can be strict)
    // Uncomment to enable strict header checking
    /*
    if (hasSuspiciousHeaders(req)) {
      console.warn(`[SUSPICIOUS HEADERS] Blocked request from IP: ${ip}, User-Agent: ${userAgent}`);
      res.status(403).json({
        success: false,
        message: "Access denied. Invalid request headers.",
        error: "SUSPICIOUS_REQUEST",
      });
      return;
    }
    */
    next();
};
exports.detectBot = detectBot;
/**
 * Optional: More lenient bot detection for public endpoints
 * Only blocks obvious bots, allows more flexibility
 */
const detectBotLenient = (req, res, next) => {
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    // Only block the most obvious bots
    const obviousBots = ["scrapy", "curl", "wget", "python-requests", "bot", "crawler", "spider"];
    const lowerUA = userAgent.toLowerCase();
    for (const bot of obviousBots) {
        if (lowerUA.includes(bot)) {
            console.warn(`[BOT DETECTED] Blocked obvious bot from IP: ${ip}, User-Agent: ${userAgent}`);
            res.status(403).json({
                success: false,
                message: "Access denied. Automated access is not permitted.",
                error: "BOT_DETECTED",
            });
            return;
        }
    }
    next();
};
exports.detectBotLenient = detectBotLenient;

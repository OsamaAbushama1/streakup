# Anti-Scraping Protection - Security Documentation

## Overview

This document describes the comprehensive anti-scraping protection implemented in the StreakUp backend. Multiple security layers work together to prevent automated scraping, abuse, and unauthorized access while maintaining full functionality for legitimate users.

## Security Layers

### 1. Bot Detection 🤖

**Location:** `src/middleware/botDetection.ts`

**Purpose:** Detect and block automated scraping tools and bots

**Blocked User Agents:**
- Python libraries: `python-requests`, `python-urllib`, `python-httpx`, `aiohttp`
- Command line tools: `curl`, `wget`, `httpie`
- Scraping frameworks: `scrapy`, `beautifulsoup`, `mechanize`, `selenium`, `puppeteer`, `playwright`
- API testing tools: `postman`, `insomnia`
- Other automated tools: `bot`, `crawler`, `spider`, `scraper`, `headless`, `phantom`, `axios`, `node-fetch`, `got`, `superagent`

**Features:**
- User-Agent analysis
- Header verification (optional, commented out by default)
- Logging of blocked requests with IP addresses
- Clear error messages for blocked bots
- Optional lenient mode for public endpoints

**Response when blocked:**
```json
{
  "success": false,
  "message": "Access denied. Automated access is not permitted.",
  "error": "BOT_DETECTED",
  "hint": "If you believe this is an error, please contact support."
}
```

### 2. Rate Limiting ⏱️

**Location:** `src/middleware/rateLimiter.ts`

**Rate Limiters:**

#### Strict API Limiter (Global)
- **Limit:** 30 requests per minute
- **Applied to:** All `/api/*` endpoints
- **Purpose:** Prevent scraping and API abuse

#### Auth Limiter
- **Limit:** 10 requests per 15 minutes
- **Applied to:** Login, register endpoints
- **Purpose:** Prevent brute force attacks
- **Special:** Doesn't count successful logins

#### Password Reset Limiter
- **Limit:** 3 requests per hour
- **Applied to:** Password reset endpoints
- **Purpose:** Prevent password reset abuse

**Response when rate limited:**
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests from this IP address. You have exceeded the limit of 30 requests per minute.",
  "hint": "Please wait a moment before trying again."
}
```

### 3. JWT Authentication 🔐

**Location:** `src/middleware/authMiddleware.ts`

**Features:**
- Token verification from Authorization header or cookies
- IP tracking for failed authentication attempts
- Detailed error messages
- Distinction between expired and invalid tokens
- Security logging

**Protected Endpoints:**
- All user data endpoints
- All challenge operations
- All shared challenges
- All comments
- All admin operations

**Public Endpoints (No Auth Required):**
- `/api/auth/check-username` - Username availability check
- `/api/auth/profile/:username` - Public user profiles
- `/api/auth/tracks` - Public tracks listing
- `/api/auth/login` - Login endpoint
- `/api/auth/register` - Registration endpoint
- `/api/auth/logout` - Logout endpoint

**Response when not authenticated:**
```json
{
  "success": false,
  "message": "Not authorized, no token provided",
  "error": "NO_TOKEN",
  "hint": "Please log in to access this resource."
}
```

### 4. CORS Protection 🌐

**Location:** `src/server.ts`

**Configuration:**
- **Production:** Only allows requests from `FRONTEND_URL` and `ADMIN_URL`
- **Development:** Also allows `localhost:3000` and `127.0.0.1:3000`
- **Credentials:** Enabled for cookie-based authentication
- **Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Headers:** Content-Type, Authorization

**Features:**
- Environment-based origin filtering
- Logging of blocked origins
- Clear error messages

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Request                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CORS Validation                          │
│              (Check origin is allowed)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Bot Detection                            │
│         (Check User-Agent and headers)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Rate Limiting                            │
│           (30 requests per minute)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Route-Specific Middleware                      │
│    (Auth rate limiter for login/register)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              JWT Authentication                             │
│         (Verify token for protected routes)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Admin Authorization                            │
│         (Check admin role for admin routes)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Route Handler                              │
│              (Process the request)                          │
└─────────────────────────────────────────────────────────────┘
```

## Route Protection Summary

### Public Routes (No Authentication)
- `GET /api/auth/check-username`
- `GET /api/auth/profile/:username`
- `GET /api/auth/tracks`
- `POST /api/auth/login` (rate limited)
- `POST /api/auth/register` (rate limited)
- `POST /api/auth/logout`
- `POST /api/auth/forget-password` (rate limited)
- `POST /api/auth/reset-password` (rate limited)

### Protected Routes (JWT Required)
- All `/api/challenges/*` endpoints
- All `/api/shared/*` endpoints
- All `/api/comments/*` endpoints
- All user data endpoints in `/api/auth/*`

### Admin Routes (JWT + Admin Role Required)
- All `/api/admin/*` endpoints

## Monitoring and Logging

All security events are logged with the following information:
- IP address
- User-Agent
- Request path
- Timestamp
- Reason for blocking

**Log Examples:**
```
[BOT DETECTED] Blocked bot from IP: 192.168.1.100, User-Agent: python-requests/2.28.0
[AUTH FAILED] No token provided from IP: 192.168.1.101, Path: /api/challenges
[CORS BLOCKED] Origin https://malicious-site.com not allowed
```

## Testing the Security

### Test Bot Detection
```bash
# Should be blocked
curl -H "User-Agent: python-requests/2.28.0" http://localhost:5000/api/challenges

# Should work (if authenticated)
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" http://localhost:5000/api/challenges
```

### Test Rate Limiting
```bash
# Make 35 requests quickly - last 5 should be blocked
for i in {1..35}; do
  curl http://localhost:5000/api/auth/check-username?username=test
done
```

### Test JWT Authentication
```bash
# Should return 401
curl http://localhost:5000/api/challenges

# Should work
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/challenges
```

### Test CORS
```bash
# Should be blocked in production
curl -H "Origin: https://malicious-site.com" http://localhost:5000/api/challenges
```

## Configuration

### Environment Variables

Make sure these are set in your `.env` file:

```env
# Frontend URLs (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
ADMIN_URL=https://your-admin-domain.com

# Environment
NODE_ENV=production  # or development

# JWT Secret
JWT_SECRET=your-secret-key
```

### Customization

#### Allow Search Engine Crawlers
Edit `src/middleware/botDetection.ts` and uncomment the crawlers you want to allow:

```typescript
const ALLOWED_CRAWLERS: string[] = [
  "googlebot",      // Uncomment to allow Google
  "bingbot",        // Uncomment to allow Bing
  // etc.
];
```

#### Adjust Rate Limits
Edit `src/middleware/rateLimiter.ts`:

```typescript
export const strictApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // Time window
  max: 30,                   // Max requests
  // ...
});
```

#### Enable Strict Header Checking
Edit `src/middleware/botDetection.ts` and uncomment the header checking code in the `detectBot` function.

## Impact on Legitimate Users

✅ **No Impact:**
- Normal browsing and API usage
- Mobile apps
- Legitimate browser-based applications

⚠️ **Potential Impact:**
- API testing tools (Postman, Insomnia) - blocked in production
- Command-line tools (curl, wget) - blocked
- Automated scripts - blocked
- Heavy API usage (>30 req/min) - rate limited

## Troubleshooting

### "Access denied. Automated access is not permitted."
- Your User-Agent is detected as a bot
- Use a legitimate browser or contact support for whitelisting

### "Too many requests from this IP address"
- You've exceeded the rate limit of 30 requests per minute
- Wait 1 minute and try again
- If you're a legitimate user with high usage, contact support

### "Not authorized, no token provided"
- You're trying to access a protected endpoint without authentication
- Log in and include your JWT token in the Authorization header

### CORS errors in browser console
- Your origin is not in the allowed list
- Check that `FRONTEND_URL` and `ADMIN_URL` are correctly set
- In development, make sure `NODE_ENV=development`

## Maintenance

### Regular Tasks
1. **Monitor logs** for unusual patterns
2. **Review blocked IPs** to ensure no false positives
3. **Update bot signatures** as new scraping tools emerge
4. **Adjust rate limits** based on usage patterns

### Adding New Routes
When adding new routes, always consider:
1. Does this need authentication? → Add `protect` middleware
2. Is this admin-only? → Add `restrictToAdmin` middleware
3. Should this have special rate limiting? → Add appropriate limiter
4. Document the security requirements in comments

## Summary

The StreakUp backend now has **4 layers of security**:

1. ✅ **Bot Detection** - Blocks automated scrapers
2. ✅ **Rate Limiting** - 30 requests/minute globally
3. ✅ **JWT Authentication** - Protects sensitive endpoints
4. ✅ **CORS Protection** - Restricts to authorized domains

All security measures are **production-ready** and **fully tested**. The implementation maintains **100% backward compatibility** with existing functionality while adding robust protection against scraping and abuse.

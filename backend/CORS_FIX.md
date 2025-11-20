# CORS Fix - Quick Reference

## Problem
The CORS configuration was throwing errors when rejecting unauthorized origins, which caused the Express server to crash with:
```
Error: Origin not allowed by CORS
```

## Root Cause
The CORS `origin` callback was using `callback(new Error(...))` to reject requests, which throws an error and crashes the middleware chain instead of properly rejecting the request.

## Solution
Changed the CORS rejection from throwing an error to returning `false`:

**Before (Incorrect):**
```typescript
if (!origin) {
  return callback(new Error("Origin not allowed by CORS"));
}
```

**After (Correct):**
```typescript
if (!origin) {
  return callback(null, true); // Allow requests with no origin
}

// For unauthorized origins:
return callback(null, false); // Reject without throwing error
```

## Key Changes

### 1. Allow Requests with No Origin
Mobile apps and server-to-server requests often don't send an `Origin` header. We now allow these by default:
```typescript
if (!origin) {
  return callback(null, true);
}
```

### 2. Proper Rejection
When rejecting unauthorized origins, we use `callback(null, false)` instead of throwing an error:
```typescript
// Log blocked origin for monitoring
console.warn(`[CORS BLOCKED] Origin ${origin} not allowed`);

// Reject the request (don't throw error, just return false)
return callback(null, false);
```

## Testing

### Test Allowed Origin
```bash
curl -H "Origin: https://your-frontend-domain.com" https://streakup-backend.onrender.com/api/auth/tracks
# Should work
```

### Test Blocked Origin
```bash
curl -H "Origin: https://malicious-site.com" https://streakup-backend.onrender.com/api/auth/tracks
# Should be blocked but server won't crash
```

### Test No Origin (Mobile Apps)
```bash
curl https://streakup-backend.onrender.com/api/auth/tracks
# Should work (no origin header is allowed)
```

## Deployment
1. Build: `npm run build` ✅
2. Deploy to Render
3. Server will no longer crash on CORS rejections
4. Unauthorized origins will be silently blocked with proper CORS headers

## Notes
- Mobile apps typically don't send `Origin` headers, so we allow requests with no origin
- The server logs all blocked origins for monitoring: `[CORS BLOCKED] Origin X not allowed`
- This maintains security while preventing server crashes
- All legitimate requests from your frontend will continue to work normally

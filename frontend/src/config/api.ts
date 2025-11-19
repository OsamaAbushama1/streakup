// API Configuration
// In production, this will use NEXT_PUBLIC_API_URL from environment variables
// In development, it defaults to localhost:5000
// For Docker: use http://localhost:5000 (ports are exposed)
// For production: set NEXT_PUBLIC_API_URL to your backend URL (e.g., https://your-backend.onrender.com)
export const API_BASE_URL =
  typeof window !== 'undefined'
    ? "" // Browser: Use relative path to leverage Next.js rewrites
    : (process.env.NEXT_PUBLIC_API_URL || "http://backend:5000"); // Server-side uses Docker service name


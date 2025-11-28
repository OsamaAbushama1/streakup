import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: any;
}

/**
 * JWT Authentication Middleware
 * Protects routes by verifying JWT tokens from Authorization header or cookies
 */
export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token;
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Check for token in cookies if not in header
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // No token found
  if (!token) {
    console.warn(`[AUTH FAILED] No token provided from IP: ${ip}, Path: ${req.path}`);
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
      error: "NO_TOKEN",
      hint: "Please log in to access this resource.",
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    // Token is invalid or expired
    const errorMessage = error instanceof jwt.TokenExpiredError
      ? "Token has expired"
      : "Invalid token";

    console.warn(`[AUTH FAILED] ${errorMessage} from IP: ${ip}, Path: ${req.path}`);

    return res.status(401).json({
      success: false,
      message: `Not authorized, ${errorMessage.toLowerCase()}`,
      error: error instanceof jwt.TokenExpiredError ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      hint: error instanceof jwt.TokenExpiredError
        ? "Your session has expired. Please log in again."
        : "Please log in again.",
    });
  }
};

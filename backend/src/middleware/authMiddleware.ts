
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Request ke Authorization header se token lena
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token nahi mila. Pehle login karo."
      });
    }

    // "Bearer " hatakar asli token lena
    const token = authorization.split(" ")[1];

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET .env mein nahi mila");

      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    // Token ko verify karna
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    // Verified user ki ID aage bhejna
    res.locals.userId = decoded.userId;

    // Ab agla middleware ya controller chalega
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token invalid ya expire ho chuka hai"
    });
  }
}

import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/database";
import jwt from "jsonwebtoken";

export async function loginUser(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const [rows] = await pool.execute(
      `SELECT id, username, display_name, password_hash, avatar_url,role
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username.trim().toLowerCase()]
    );

    const users = rows as {
      id: number | bigint;
      username: string;
      display_name: string;
      password_hash: string;
      avatar_url: string | null;
      role: "admin" | "user";
    }[];

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    const token = jwt.sign(
      { userId: user.id.toString(),
      role: user.role },
      secret,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id.toString(),
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed due to a server error"
    });
  }
}




export async function getMyProfile(
  req: Request,
  res: Response
) {
  try {
    // Middleware ne verified userId yahan rakhi hai
    const userId = res.locals.userId as string;

    const [rows] = await pool.execute(
      `SELECT id, username, display_name, avatar_url, last_seen, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    const users = rows as {
      id: number | bigint;
      username: string;
      display_name: string;
      avatar_url: string | null;
      last_seen: Date | null;
      created_at: Date;
    }[];

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User nahi mila"
      });
    }

    const user = users[0];

    return res.status(200).json({
      success: true,
      user: {
        id: user.id.toString(),
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        last_seen: user.last_seen,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Profile fetch nahi ho payi"
    });
  }
}

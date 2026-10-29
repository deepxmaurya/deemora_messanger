
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/database";

export async function registerUser(req: Request, res: Response) {
  try {
    const { username, display_name, password } = req.body;

    // 1. Check required fields
    if (
      typeof username !== "string" ||
      typeof display_name !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Username, display name and password are required"
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = display_name.trim();

    // 2. Validate input
    if (!/^[a-z0-9_]{3,50}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-50 characters and use letters, numbers or underscore"
      });
    }

    if (cleanDisplayName.length < 1 || cleanDisplayName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Display name must be between 1 and 100 characters"
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters"
      });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Save user in MySQL
    const [result] = await pool.execute(
      `INSERT INTO users (username, display_name, password_hash)
       VALUES (?, ?, ?)`,
      [cleanUsername, cleanDisplayName, passwordHash]
    );

    const userId = (result as { insertId: number | bigint }).insertId;

    // 5. Send response without password
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: userId.toString(),
        username: cleanUsername,
        display_name: cleanDisplayName
      }
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message: "This username is already taken"
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed due to a server error"
    });
  }
}



export const searchUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const q = String(req.query.q || "").trim();

    if (q.length < 2) {
      res.status(400).json({
        success: false,
        message: "Search ke liye kam se kam 2 characters likho.",
      });
      return;
    }

    const currentUserId = res.locals.userId;

    const [rows] = await pool.execute(
      `SELECT id, username, avatar_url
       FROM users
       WHERE username LIKE ?
       AND id != ?
       ORDER BY username
       LIMIT 20`,
      [`%${q}%`, currentUserId]
    );

    res.status(200).json({
      success: true,
      users: rows,
    });
  } catch (error) {
    console.error("Search users error:", error);

    res.status(500).json({
      success: false,
      message: "Users search karte waqt error aaya.",
    });
  }
};

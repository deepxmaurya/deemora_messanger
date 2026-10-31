import type { Request, Response } from "express";
import { RowDataPacket } from "mysql2/promise";
import pool from "../config/database";

interface UserRow extends RowDataPacket {
  id: number | bigint;
  username: string;
  display_name: string;
  role: "admin" | "user";
  created_at: Date;
}

export async function getAllUsers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Middleware se logged-in user ki ID milegi
    const currentUserId = String(res.locals.userId);

    // Pehle check karo ki request karne wala Admin hai ya nahi
    const [adminRows] = await pool.execute<RowDataPacket[]>(
      `SELECT role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [currentUserId]
    );

    if (adminRows.length === 0 || adminRows[0].role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Only admin can view users."
      });
      return;
    }

    // Database se sabhi users ki information lao
    const [rows] = await pool.execute<UserRow[]>(
      `SELECT
         id,
         username,
         display_name,
         role,
         created_at
       FROM users
       ORDER BY created_at DESC`
    );


    res.status(200).json({
      success: true,
      totalUsers: rows.length,
      users: rows.map((user) => ({
        id: user.id.toString(),
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        created_at: user.created_at
      }))
    });

  } catch (error) {
    console.error("Get all users error:", error);

    res.status(500).json({
      success: false,
      message: "Users fetch nahi ho paye."
    });
  }
}

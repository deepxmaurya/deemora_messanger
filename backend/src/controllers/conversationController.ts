
import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "../config/database";

export const startPrivateChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  const currentUserId = String(res.locals.userId);
  const otherUserId = String(req.params.userId);

  if (currentUserId === otherUserId) {
    res.status(400).json({
      success: false,
      message: "Aap apne aap se chat nahi kar sakte.",
    });
    return;
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [targetUsers] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [otherUserId]
    );

    if (targetUsers.length === 0) {
      await connection.rollback();
      res.status(404).json({
        success: false,
        message: "User nahi mila.",
      });
      return;
    }

    const [existingChats] = await connection.execute<RowDataPacket[]>(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_members cm
         ON cm.conversation_id = c.id
       WHERE c.type = 'private'
         AND cm.user_id IN (?, ?)
       GROUP BY c.id
       HAVING COUNT(DISTINCT cm.user_id) = 2
         AND (
           SELECT COUNT(*)
           FROM conversation_members cm2
           WHERE cm2.conversation_id = c.id
         ) = 2
       LIMIT 1`,
      [currentUserId, otherUserId]
    );

    if (existingChats.length > 0) {
      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Existing chat open karo.",
        conversationId: String(existingChats[0].id),
        existing: true,
      });
      return;
    }

    const [conversationResult] =
      await connection.execute<ResultSetHeader>(
        `INSERT INTO conversations (type, created_by)
         VALUES ('private', ?)`,
        [currentUserId]
      );

    const conversationId = conversationResult.insertId;

    await connection.execute(
      `INSERT INTO conversation_members (conversation_id, user_id)
       VALUES (?, ?), (?, ?)`,
      [
        conversationId,
        currentUserId,
        conversationId,
        otherUserId,
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Private chat create ho gayi.",
      conversationId: String(conversationId),
      existing: false,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Start private chat error:", error);

    res.status(500).json({
      success: false,
      message: "Chat start nahi ho payi.",
    });
  } finally {
    connection?.release();
  }
};



export async function getMyConversations(
  req: Request,
  res: Response
) {
  try {
    const userId = String(res.locals.userId);

    const [conversations] = await pool.execute<RowDataPacket[]>(
      `SELECT
         cm.conversation_id,
         other.id AS other_user_id,
         other.username,
         other.display_name,
         last_msg.content AS last_message,
         last_msg.created_at AS last_message_at
       FROM conversation_members cm

       JOIN conversation_members other_cm
         ON other_cm.conversation_id = cm.conversation_id
         AND other_cm.user_id <> cm.user_id

       JOIN users other
         ON other.id = other_cm.user_id

       LEFT JOIN (
         SELECT m1.*
         FROM messages m1
         WHERE m1.message_type = 'text'
           AND NOT EXISTS (
             SELECT 1
             FROM messages m2
             WHERE m2.conversation_id = m1.conversation_id
               AND m2.message_type = 'text'
               AND (
                 m2.created_at > m1.created_at
                 OR (
                   m2.created_at = m1.created_at
                   AND m2.id > m1.id
                 )
               )
           )
       ) last_msg
         ON last_msg.conversation_id = cm.conversation_id

       WHERE cm.user_id = ?

       ORDER BY
         last_msg.created_at DESC,
         cm.conversation_id DESC`,
      [userId]
    );

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      success: false,
      message: "Conversations load nahi ho sakin."
    });
  }
}

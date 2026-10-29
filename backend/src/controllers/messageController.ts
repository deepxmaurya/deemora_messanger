
import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database";

interface MessageRow extends RowDataPacket {
  id: number;
  conversation_id: number;
  sender_id: number;
  username: string;
  content: string;
  created_at: Date;
}

export async function getMessages(req: Request, res: Response) {
  try {
    const conversationId = req.params.conversationId;
    const userId = String(res.locals.userId);

    const [members] = await pool.execute<RowDataPacket[]>(
      `SELECT user_id
       FROM conversation_members
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
    );

    if (members.length === 0) {
      res.status(403).json({
        success: false,
        message: "Tum is conversation ke member nahi ho."
      });
      return;
    }

    const [messages] = await pool.execute<MessageRow[]>(
      `SELECT
         m.id,
         m.conversation_id,
         m.sender_id,
         u.username,
         m.content,
         m.created_at,
         m.read_at
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
         AND m.message_type = 'text'
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [conversationId]
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Messages load nahi ho sake."
    });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const conversationId = req.params.conversationId;
    const userId = String(res.locals.userId);
    const content =
      typeof req.body.content === "string"
        ? req.body.content.trim()
        : "";

    if (!content) {
      res.status(400).json({
        success: false,
        message: "Message khaali nahi ho sakta."
      });
      return;
    }

    if (content.length > 5000) {
      res.status(400).json({
        success: false,
        message: "Message 5000 characters se chhota hona chahiye."
      });
      return;
    }

    const [members] = await pool.execute<RowDataPacket[]>(
      `SELECT user_id
       FROM conversation_members
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
    );

    if (members.length === 0) {
      res.status(403).json({
        success: false,
        message: "Tum is conversation ke member nahi ho."
      });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO messages
       (conversation_id, sender_id, message_type, content)
       VALUES (?, ?, 'text', ?)`,
      [conversationId, userId, content]
    );

    const [rows] = await pool.execute<MessageRow[]>(
      `SELECT
         m.id,
         m.conversation_id,
         m.sender_id,
         u.username,
         m.content,
         m.created_at,
         m.read_at
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [result.insertId]
    );

    const message = rows[0];
    const io = req.app.get("io");

    if (io) {
      io.to(`conversation:${conversationId}`).emit(
        "new_message",
        message
      );
    }

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Message send nahi ho saka."
    });
  }
}


export async function markMessagesAsRead(
  req: Request,
  res: Response
) {
  try {
    const conversationId = String(req.params.conversationId);
    const userId = String(res.locals?.userId);

    // Check karo ki user conversation ka member hai
    const [members] = await pool.execute<RowDataPacket[]>(
      `SELECT user_id
       FROM conversation_members
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
    );

    if (members.length === 0) {
      res.status(403).json({
        success: false,
        message: "Tum is conversation ke member nahi ho."
      });
      return;
    }

    // Sirf doosre user ke unread messages ko Seen mark karo
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE messages
       SET read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = ?
         AND sender_id != ?
         AND read_at IS NULL`,
      [conversationId, userId]
    );

    const readAt = new Date().toISOString();
    const io = req.app.get("io");

    // Conversation mein real-time Seen event bhejo
    if (io && result.affectedRows > 0) {
      io.to(`conversation:${conversationId}`).emit(
        "messages_seen",
        {
          conversationId,
          readerId: userId,
          readAt
        }
      );
    }

    res.json({
      success: true,
      message: "Messages Seen mark ho gaye.",
      affectedRows: result.affectedRows,
      readAt
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);

    res.status(500).json({
      success: false,
      message: "Messages Seen mark nahi ho sake."
    });
  }
}


// Edit message
export async function editMessage(req: Request, res: Response) {
  try {
    const messageId = req.params.messageId;
    const userId = res.locals?.userId;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required",
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content required",
      });
    }

    const [result] = await pool.execute(
      `UPDATE messages
       SET content = ?
       WHERE id = ?
         AND sender_id = ?
         AND message_type = 'text'`,
      [content.trim(), messageId, userId]
    );

    const updateResult = result as { affectedRows: number };

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Message nahi mila ya tum uske sender nahi ho",
      });
    }

        const [rows] = await pool.execute(
          `SELECT id, conversation_id, sender_id, content
           FROM messages
           WHERE id = ? AND sender_id = ?`,
          [messageId, userId]
        );

        const messages = rows as {
          id: number;
          conversation_id: number;
          sender_id: number;
          content: string;
        }[];

        if (messages.length > 0) {
          const updatedMessage = messages[0];
          const io = req.app.get("io");

          io.to(`conversation:${updatedMessage.conversation_id}`).emit(
            "message_updated",
            {
              message: updatedMessage,
            }
          );
        }

    return res.json({
      success: true,
      message: "Message updated successfully",
    });
  } catch (error) {
    console.error("Edit message error:", error);
    return res.status(500).json({
      success: false,
      message: "Message edit nahi hua",
    });
  }
}

// Delete message

export async function deleteMessage(req: Request, res: Response) {
  try {
    const messageId = req.params.messageId;
    const userId = res.locals.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required",
      });
    }

    // Delete karne se pehle message ki details nikalo
    const [rows] = await pool.execute(
      `SELECT id, conversation_id
       FROM messages
       WHERE id = ?
         AND sender_id = ?
         AND message_type = 'text'`,
      [messageId, userId]
    );

    const messages = rows as {
      id: number;
      conversation_id: number;
    }[];

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Message nahi mila ya tum uske sender nahi ho",
      });
    }

    const message = messages[0];

    // Database se delete karo
    await pool.execute(
      `DELETE FROM messages
       WHERE id = ?
         AND sender_id = ?
         AND message_type = 'text'`,
      [messageId, userId]
    );

    // Socket.IO instance lo
    const io = req.app.get("io");

    // Usi conversation ke users ko live event bhejo
    io.to(`conversation:${message.conversation_id}`).emit(
      "message_deleted",
      {
        messageId: message.id,
        conversationId: message.conversation_id,
      }
    );

    return res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);

    return res.status(500).json({
      success: false,
      message: "Message delete nahi hua",
    });
  }
}


import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import pool from "../config/database";

type TokenPayload = {
  userId: string | number;
};

type JoinConversationData = {
  conversationId: string | number;
};

export function initializeSocket(io: Server) {
  const onlineUsers = new Map<string, Set<string>>();
  const presenceRoom = "authenticated:presence";

  function broadcastOnlineUsers() {
    io.to(presenceRoom).emit("online_users", {
      userIds: Array.from(onlineUsers.keys()),
    });

    console.log("ONLINE USERS:", Array.from(onlineUsers.keys()));
  }

  // Socket connect hone se pehle JWT verify karo.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        return next(new Error("JWT_SECRET missing hai."));
      }

      if (typeof token !== "string" || !token) {
        return next(new Error("Authentication token missing hai."));
      }

      const decoded = jwt.verify(token, secret);

      if (
        typeof decoded === "string" ||
        (typeof decoded.userId !== "string" &&
          typeof decoded.userId !== "number")
      ) {
        return next(new Error("Token mein valid userId nahi hai."));
      }

      const userId = String(decoded.userId).trim();

      if (!userId) {
        return next(new Error("Invalid userId."));
      }

      socket.data.userId = userId;
      next();
    } catch {
      next(new Error("Invalid ya expired token."));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const userId = String(socket.data.userId);

    console.log("AUTHENTICATED SOCKET:", socket.id, userId);

    // Presence ko conversation se alag rakho.
    await socket.join(presenceRoom);
    await socket.join(`user:${userId}`);

    let userSockets = onlineUsers.get(userId);

    if (!userSockets) {
      userSockets = new Set<string>();
      onlineUsers.set(userId, userSockets);
    }

    userSockets.add(socket.id);
    broadcastOnlineUsers();

    socket.on(
      "join_conversation",
      async (data: JoinConversationData) => {
        try {
          const conversationId = String(
            data?.conversationId ?? ""
          ).trim();

          if (!conversationId) {
            throw new Error("Conversation ID missing hai.");
          }

          const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT DISTINCT user_id
             FROM conversation_members
             WHERE conversation_id = ?`,
            [conversationId]
          );

          if (!socket.connected) return;

          const memberIds = rows.map((row) =>
            String(row.user_id).trim()
          );

          if (!memberIds.includes(userId)) {
            throw new Error("Tum is conversation ke member nahi ho.");
          }

          if (memberIds.length !== 2) {
            throw new Error(
              "Private chat mein exactly 2 members hone chahiye."
            );
          }

          const otherUserId = memberIds.find(
            (id) => id !== userId
          );

          if (!otherUserId) {
            throw new Error("Chat partner nahi mila.");
          }

          const oldConversationId = socket.data
            .conversationId as string | undefined;

          if (
            oldConversationId &&
            oldConversationId !== conversationId
          ) {
            await socket.leave(
              `conversation:${oldConversationId}`
            );
          }

          if (!socket.connected) return;

          await socket.join(`conversation:${conversationId}`);

          socket.data.conversationId = conversationId;

          socket.emit("conversation_info", {
            conversationId,
            currentUserId: userId,
            otherUserId,
          });

          // console.log("CHAT JOINED:", {
          //   socketId: socket.id,
          //   conversationId,
          //   currentUserId: userId,
          //   otherUserId,
          // });
        } catch (error) {
          if (socket.connected) {
            socket.emit("chat_error", {
              message:
                error instanceof Error
                  ? error.message
                  : "Conversation join nahi ho saka.",
            });
          }
        }
      }
    );

socket.on("request_online_users", () => {
  socket.emit("online_users", {
    userIds: Array.from(onlineUsers.keys()),
  });
});
    socket.on("disconnect", (reason) => {
      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }

      broadcastOnlineUsers();

      console.log("SOCKET DISCONNECTED:", {
        socketId: socket.id,
        userId,
        reason,
      });
    });
  });
}

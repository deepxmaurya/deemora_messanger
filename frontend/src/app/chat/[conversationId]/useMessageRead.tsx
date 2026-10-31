
"use client";

import { useCallback, useEffect } from "react";
import { useAppSocket } from "../../component/SocketProvider";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type ReadableMessage = {
  id: number;
  sender_id: number | string;
  read_at?: string | null;
};
type ChatMessage = {
  id: number;
  conversation_id: number | string;
  sender_id: number | string;
  username: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type MessageReadOptions = {
  conversationId: string;
  setMessages: React.Dispatch<
    React.SetStateAction<ChatMessage[]>
  >;
};

export function useMessageRead({
  conversationId,
  setMessages,
}: MessageReadOptions) {
  const socket = useAppSocket();

  // Backend ko message read hone ki request bhejna
  const markMessagesAsRead = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${conversationId}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Messages read mark nahi hue.");
      }
    } catch (error) {
      console.error("Read status error:", error);
    }
  }, [conversationId]);

  // Doosre user ka Seen event receive karna
  useEffect(() => {
    if (!socket) return;

    const handleMessagesSeen = (data: {
      conversationId: string | number;
      readerId: string | number;
      readAt: string;
    }) => {
      if (
        String(data.conversationId) !== String(conversationId)
      ) {
        return;
      }

      setMessages((previous) =>
        previous.map((message) => {
          // Reader ke apne messages ko Seen nahi dikhana
          if (
            String(message.sender_id) === String(data.readerId)
          ) {
            return message;
          }

          return {
            ...message,
            read_at: data.readAt,
          };
        })
      );
    };

    socket.on("messages_seen", handleMessagesSeen);

    return () => {
      socket.off("messages_seen", handleMessagesSeen);
    };
  }, [socket, conversationId, setMessages]);

  return { markMessagesAsRead };
}

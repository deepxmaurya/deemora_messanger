"use client";
import { useMessageRead } from "./useMessageRead";
import {editMessage,deleteMessage,} from "./messageActions";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useAppSocket } from "../../component/SocketProvider";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ChatMessage = {
  id: number;
  conversation_id: number | string;
  sender_id: number | string;
  username: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type ConversationInfo = {
  conversationId: string | number;
  currentUserId: string | number;
  otherUserId: string | number;
};

type PresenceUpdate = {
  userId: string | number;
  status: "online" | "offline";
};

type MessagesResponse = {
  messages?: ChatMessage[];
  message?: string;
};

type SendResponse = {
  message?: ChatMessage | string;
};

export default function ChatClient({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const socket = useAppSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [text, setText] = useState("");
  const [userId, setUserId] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [presenceReady, setPresenceReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const isOtherUserOnline =
    connected &&
    presenceReady &&
    otherUserId !== "" &&
    onlineUsers.includes(otherUserId);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((previous) => {
      const exists = previous.some(
        (item) => String(item.id) === String(message.id)
      );

      return exists ? previous : [...previous, message];
    });
  }, []);

  const { markMessagesAsRead } = useMessageRead({
  conversationId,
  setMessages,
});

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!socket) {
      setConnected(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    setMessages([]);
    setUserId("");
    setOtherUserId("");
    setOnlineUsers([]);
    setPresenceReady(false);
    setConnected(socket.connected);
    setLoading(true);
    setError("");
    setConnectionError("");

    const joinConversation = () => {
      if (!active) return;

      setConnected(true);
      setPresenceReady(false);
      setOnlineUsers([]);
      setOtherUserId("");
      setConnectionError("");

      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        router.replace("/login");
        return;
      }

      console.log("SHARED SOCKET CONNECTED:", socket.id);
      socket.emit("join_conversation", { conversationId });
      // Backend should respond with the current online_users snapshot.
      socket.emit("request_online_users");
    };

    const handleConversationInfo = (data: ConversationInfo) => {
      if (
        !active ||
        String(data.conversationId) !== String(conversationId)
      ) return;

      setUserId(String(data.currentUserId));
      setOtherUserId(String(data.otherUserId));
      setConnectionError("");
      console.log("CONVERSATION INFO:", JSON.stringify(data));
    };

    const handleOnlineUsers = (data: { userIds: (string | number)[] }) => {
      if (!active || !Array.isArray(data?.userIds)) return;

      const ids = Array.from(new Set(data.userIds.map(String)));
      setOnlineUsers(ids);
      setPresenceReady(true);
      console.log("ONLINE USERS:", JSON.stringify(ids));
    };

    const handlePresenceUpdate = (data: PresenceUpdate) => {
      if (!active || !data || data.userId == null) return;

      const id = String(data.userId);
      setOnlineUsers((previous) => {
        if (data.status === "online") {
          return previous.includes(id) ? previous : [...previous, id];
        }
        return previous.filter((onlineId) => onlineId !== id);
      });
    };

    const handleNewMessage = (message: ChatMessage) => {
  if (
    active &&
    String(message.conversation_id) === String(conversationId)
  ) {
    addMessage(message);
    void markMessagesAsRead();
  }
};
    const handleChatError = (data: { message: string }) => {
      if (!active) return;
      setPresenceReady(false);
      setConnectionError(data.message);
      console.error("CHAT ERROR:", data.message);
    };

    const handleConnectError = (err: Error) => {
      if (!active) return;
      setConnected(false);
      setPresenceReady(false);
      setOnlineUsers([]);
      setConnectionError(`Live connection fail: ${err.message}`);
      console.error("SOCKET CONNECT ERROR:", err.message);
    };

    const handleDisconnect = (reason: string) => {
      if (!active) return;
      setConnected(false);
      setPresenceReady(false);
      setOnlineUsers([]);
      console.log("SHARED SOCKET DISCONNECTED:", reason);
    };

    socket.on("connect", joinConversation);
    socket.on("conversation_info", handleConversationInfo);
    socket.on("online_users", handleOnlineUsers);
    socket.on("presence_update", handlePresenceUpdate);
    socket.on("new_message", handleNewMessage);
    socket.on("chat_error", handleChatError);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

socket.on("message_updated", ({ message }) => {
  if (
    Number(message.conversation_id) !==
    Number(conversationId)
  ) {
    return;
  }

  setMessages((previous) =>
    previous.map((item) =>
      item.id === message.id
        ? { ...item, ...message }
        : item
    )
  );
});

socket.on("message_deleted", ({ messageId, conversationId: eventConversationId }) => {
  if (
    Number(eventConversationId) !==
    Number(conversationId)
  ) {
    return;
  }

  setMessages((previous) =>
    previous.filter(
      (item) => item.id !== Number(messageId)
    )
  );
});


    // Provider may have connected before this component mounted.
    if (socket.connected) {
      joinConversation();
    }

    async function loadMessages() {
      try {
        const response = await fetch(
          `${API_URL}/api/messages/${conversationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        if (!active) return;

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          router.replace("/login");
          return;
        }

        const data: MessagesResponse = await response.json();
        if (!active) return;

        if (!response.ok) {
          throw new Error(data.message || "Messages load nahi hue.");
        }

        setMessages((previous) => {
          const merged = new Map<string, ChatMessage>();
          for (const message of [...(data.messages || []), ...previous]) {
            merged.set(String(message.id), message);
          }
          return Array.from(merged.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        await markMessagesAsRead();
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Messages load nahi hue.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMessages();

    return () => {
      active = false;
      controller.abort();
      // Remove only this component's listeners. Do NOT disconnect the shared socket.
      socket.off("connect", joinConversation);
      socket.off("conversation_info", handleConversationInfo);
      socket.off("online_users", handleOnlineUsers);
      socket.off("presence_update", handlePresenceUpdate);
      socket.off("new_message", handleNewMessage);
      socket.off("chat_error", handleChatError);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("message_updated");
      socket.off("message_deleted");
    };
  }, [socket, conversationId, router, addMessage,markMessagesAsRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  async function handleSend(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const content = text.trim();

    if (!content || sending || !userId) return;

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${conversationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      const data: SendResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Message send nahi hua."
        );
      }

      if (!data.message || typeof data.message === "string") {
        throw new Error(
          "Server ne valid message object nahi bheja."
        );
      }

      addMessage(data.message);

      // Request ke dauran type kiya naya text preserve karo.
      setText((previous) =>
        previous.trim() === content ? "" : previous
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Message send nahi hua."
      );
    } finally {
      setSending(false);
    }
  }


async function handleEdit(messageId: number) {
  const content = editContent.trim();

  if (!content) {
    setError("Message khali nahi ho sakta.");
    return;
  }

  const token = localStorage.getItem("token");
 
  if (!token) {
    router.replace("/login");
    return;
  }

  try {
    setError("");

    await editMessage(API_URL, messageId, content, token);

    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId
          ? { ...message, content }
          : message
      )
    );

    setEditingMessageId(null);
    setEditContent("");
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Message edit nahi hua."
    );
  }
}

async function handleDelete(messageId: number) {
  const confirmed = window.confirm(
    "are you soure you want to delete message ?"
  );

  if (!confirmed) return;

  const token = localStorage.getItem("token");

  if (!token) {
    router.replace("/login");
    return;
  }

  try {
    setError("");

    await deleteMessage(API_URL, messageId, token);

    setMessages((previous) =>
      previous.filter((message) => message.id !== messageId)
    );
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Message delete nahi hua."
    );
  }
}


  const statusText = !connected
    ? "Connection reconnect ho raha hai..."
    : !presenceReady || !otherUserId
      ? "Status check ho raha hai..."
      : isOtherUserOnline
        ? "Other user online"
        : "Other user offline";

  return (
    <main className="flex h-dvh flex-col bg-[#080b14] text-white">
      <header className="shrink-0 border-b border-white/10 bg-[#111522] p-4">
        <h1 className="font-bold">Private Chat</h1>

        <p className="text-xs text-zinc-400">
          Conversation #{conversationId}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isOtherUserOnline
                ? "bg-green-500"
                : "bg-zinc-500"
            }`}
          />

          <p className="text-xs text-zinc-300">
            {statusText}
          </p>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading && (
          <p className="text-center text-zinc-400">
            Messages loading...
          </p>
        )}

        {!loading && messages.length === 0 && (
          <p className="mt-10 text-center text-zinc-400">
            Chat shuru karo! Apna pehla message likho.
          </p>
        )}

        <div className="flex w-full flex-col gap-3">
          {messages.map((message) => {
            const mine =
              userId !== "" &&
              String(message.sender_id) === userId;

            return (
              <div
                key={message.id}
                className={`flex w-full ${
                  mine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`min-w-0 max-w-[80%] rounded-2xl px-4 py-3 ${
                    mine
                      ? "rounded-br-sm bg-violet-600"
                      : "rounded-bl-sm border border-white/10 bg-[#171c2b]"
                  }`}
                >
                  {!mine && (
                    <p className="mb-1 text-xs text-violet-300">
                      {message.username}
                    </p>
                  )}

                  
{editingMessageId === message.id ? (
  <div className="mt-2 space-y-2">
    <textarea
      value={editContent}
      onChange={(event) => setEditContent(event.target.value)}
      className="w-full rounded-lg bg-white p-2 text-sm text-black"
      rows={3}
    />

    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(message.id)}
                        className="rounded bg-white px-3 py-1 text-sm text-violet-700"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessageId(null);
                          setEditContent("");
                        }}
                              className="rounded border border-white/30 px-3 py-1 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">
                          {message.content}
                        </p>
                      )}

                {mine && editingMessageId !== message.id && (
                  <div className="mt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMessageId(message.id);
                        setEditContent(message.content);
                        setError("");
                      }}
                      className="text-xs text-white/80 hover:text-white"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(message.id)}
                      className="text-xs text-red-200 hover:text-red-100"
                    >
                      Delete
                    </button>
                  </div>
                )}

                  
                <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-white/60">
                  <span>
                    {message.created_at
                      ? new Date(message.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>

                  {mine && (
                    <span>
                      {message.read_at ? "Seen ✓✓" : "Sent ✓"}
                    </span>
                  )}
                </div>

                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </section>

      {(connectionError || error) && (
        <p className="shrink-0 px-4 pb-2 text-sm text-red-400">
          {connectionError || error}
        </p>
      )}

      <form
        onSubmit={handleSend}
        className="flex shrink-0 gap-3 border-t border-white/10 bg-[#111522] p-4"
      >
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Message likho..."
          rows={1}
          maxLength={5000}
          className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-[#080b14] px-4 py-3 text-sm outline-none focus:border-violet-500"
        />

        <button
          type="submit"
          disabled={sending || !text.trim() || !userId}
          className="rounded-xl bg-violet-600 px-5 py-3 font-semibold disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </main>
  );
}
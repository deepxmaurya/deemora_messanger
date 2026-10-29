
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type User = {
  id: string | number;
  username: string;
  display_name: string;
};

type Conversation = {
  conversation_id: string | number;
  other_user_id: string | number;
  username: string;
  display_name?: string;
  last_message: string | null;
  last_message_at: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const token = sessionStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const [profileResponse, chatsResponse] = await Promise.all([
          fetch(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/conversations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileData = await profileResponse.json();

        if (profileResponse.status === 401) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("userId");
          router.replace("/login");
          return;
        }

        if (!profileResponse.ok) {
          throw new Error(
            profileData.message || "Profile load nahi hua."
          );
        }

        if (active) setUser(profileData.user);

        const chatsData = await chatsResponse.json();

        if (!chatsResponse.ok) {
          throw new Error(
            chatsData.message ||
              "Chat list load nahi hui. Backend API check karo."
          );
        }

        if (active) setChats(chatsData.conversations || []);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Server se connection nahi ho pa raha hai."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setChatsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    router.replace("/login");
  }

  function openChat(conversationId: string | number) {
    router.push(`/chat/${conversationId}`);
  }

  function formatTime(value: string | null) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    return isToday
      ? date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b14] text-zinc-300">
        Dashboard load ho raha hai...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b14] p-5 text-red-400">
        {error || "User profile nahi mila."}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <header className="border-b border-white/10 bg-[#0d111d]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold">
              D
            </span>
            <span className="text-lg font-bold">
              DreamShop <span className="text-violet-400">Chat</span>
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl md:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 p-5 md:border-r md:border-b-0">
          <div className="rounded-2xl border border-white/10 bg-[#111522] p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              {user.username}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">Your User ID</p>

            <div className="mt-4 rounded-xl bg-white/5 px-3 py-3 text-sm text-violet-300">
              @{user.username}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold tracking-widest text-zinc-500">
              YOUR SPACE
            </p>

            <div className="rounded-xl bg-violet-500/10 px-4 py-3 font-medium text-violet-300">
              💬 My Chats ({chats.length})
            </div>

            <Link
              href="/find-people"
              className="mt-2 block rounded-xl px-4 py-3 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              🔎 Find People
            </Link>
          </div>
        </aside>

        <section className="min-w-0 p-5 sm:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Chats</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Jin users se tum pehle baat kar chuke ho.
              </p>
            </div>

            <Link
              href="/find-people"
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500"
            >
              + New Chat
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {chatsLoading ? (
            <p className="py-10 text-center text-zinc-400">
              Chats load ho rahi hain...
            </p>
          ) : chatError ? (
            <p className="rounded-xl bg-red-500/10 p-4 text-red-300">
              {chatError}
            </p>
          ) : chats.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#111522] px-6 py-14 text-center">
              <div className="text-5xl">💬</div>
              <h2 className="mt-4 text-xl font-semibold">
                Abhi koi chat nahi hai
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
                Find People se kisi user ke saath chat shuru karo.
                Uske baad tumhari conversation yahan dikhegi.
              </p>
              <Link
                href="/find-people"
                className="mt-6 inline-block rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500"
              >
                Find People
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {chats.map((chat) => (
                <button
                  key={String(chat.conversation_id)}
                  onClick={() => openChat(chat.conversation_id)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-[#111522] p-4 text-left transition hover:border-violet-500/50 hover:bg-[#171c2b]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-lg font-bold text-violet-300">
                    {(chat.display_name || chat.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {chat.display_name || chat.username}
                    </p>
                    <p className="mt-1 truncate text-sm text-zinc-400">
                      {chat.last_message || "Chat shuru karo"}
                    </p>
                  </div>

                  <div className="shrink-0 text-xs text-zinc-500">
                    {formatTime(chat.last_message_at)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

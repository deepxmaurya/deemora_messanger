
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type User = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export default function FindPeoplePage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [startingUserId, setStartingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchText = query.trim();

    setError("");
    setUsers([]);
    setSearched(false);

    if (searchText.length < 2) {
      setError("Kam se kam 2 characters likho.");
      return;
    }

    const token = sessionStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/users/search?q=${encodeURIComponent(searchText)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userId");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setError(data.message || "Search nahi ho payi.");
        return;
      }

      setUsers(data.users || []);
      setSearched(true);
    } catch {
      setError("Backend se connection nahi ho pa raha hai.");
    } finally {
      setLoading(false);
    }
  }

  
async function handleStartChat(user: User) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    router.replace("/login");
    return;
  }

  setError("");
  setStartingUserId(user.id);

  try {
    const response = await fetch(
      `${API_URL}/api/conversations/private/${user.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("userId");
      router.replace("/login");
      return;
    }

    if (!response.ok) {
      setError(data.message || "Chat start nahi ho payi.");
      return;
    }

    router.push(`/chat/${data.conversationId}`);
  } catch {
    setError("Backend se connection nahi ho pa raha hai.");
  } finally {
    setStartingUserId(null);
  }
}


  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <header className="border-b border-white/10 bg-[#0d111d]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 font-bold">
              D
            </span>
            <span className="text-lg font-bold">
              DreamShop <span className="text-violet-400">Chat</span>
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-widest text-violet-400">
            DISCOVER PEOPLE
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Find People
          </h1>
          <p className="mt-3 leading-7 text-zinc-400">
            User ID search karo aur DreamShop Chat par registered logon ko
            dhoondo.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111522] p-4 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-[#080b14] px-4">
            <span className="text-lg text-zinc-500">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="User ID likho, jaise deepak123"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-violet-600 px-6 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-sm font-semibold text-zinc-400">
            {searched ? `Search Results (${users.length})` : "Registered Users"}
          </h2>

          {loading && (
            <p className="py-8 text-center text-zinc-400">
              Users search ho rahe hain...
            </p>
          )}

          {!loading && searched && users.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#111522] px-5 py-10 text-center">
              <div className="text-3xl">🔎</div>
              <p className="mt-3 font-semibold">Koi user nahi mila</p>
              <p className="mt-2 text-sm text-zinc-500">
                User ID check karke dobara search karo.
              </p>
            </div>
          )}

          {!loading &&
            users.map((user) => (
              <div
                key={user.id}
                className="mb-3 flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111522] p-4 transition hover:border-violet-400/30"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-lg font-bold text-violet-300">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{user.username}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    @{user.username}
                  </p>
                </div>

                <button
                onClick={() => handleStartChat(user)}
                disabled={startingUserId !== null}
                className="shrink-0 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
              >
                {startingUserId === user.id ? "Opening..." : "Start Chat"}
              </button>
              </div>
            ))}

          {!loading && !searched && !error && (
            <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
              <div className="text-4xl">👥</div>
              <p className="mt-4 font-semibold">Find your people</p>
              <p className="mt-2 text-sm text-zinc-500">
                Search box mein kam se kam 2 characters likho.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type User = {
  id: string;
  username: string;
  display_name: string;
  role: "admin" | "user";
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "admin") {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          localStorage.clear();
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Users load nahi ho paye.");
        }

        setUsers(data.users || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [router]);

  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === "admin").length;
  const normalUsers = users.filter((user) => user.role === "user").length;

  function logout() {
    localStorage.clear();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <header className="border-b border-white/10 bg-[#0c1020]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide">
              <span className="text-[#D4AF37]">Deemora</span>{" "}
              <span className="text-violet-400">Admin</span>
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              User Management Dashboard
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Dashboard Overview</h2>
          <p className="mt-2 text-gray-400">
            Yahan tum apne registered users ki information dekh sakte ho.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#111827] p-6">
            <p className="text-sm text-gray-400">Total Users</p>
            <h3 className="mt-3 text-4xl font-bold text-[#D4AF37]">
              {loading ? "..." : totalUsers}
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              Total registered accounts
            </p>
          </div>

          <div className="rounded-2xl border border-violet-500/20 bg-[#111827] p-6">
            <p className="text-sm text-gray-400">Admin Users</p>
            <h3 className="mt-3 text-4xl font-bold text-violet-400">
              {loading ? "..." : adminUsers}
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              Accounts with admin role
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-[#111827] p-6">
            <p className="text-sm text-gray-400">Normal Users</p>
            <h3 className="mt-3 text-4xl font-bold text-blue-400">
              {loading ? "..." : normalUsers}
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              Regular registered accounts
            </p>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
          <div className="border-b border-white/10 px-6 py-5">
            <h3 className="text-xl font-bold">Registered Users</h3>
            <p className="mt-1 text-sm text-gray-400">
              All users created in Deemora Messenger
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">
              Users load ho rahe hain...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-400">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              Abhi koi user registered nahi hai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="px-6 py-4">User ID</th>
                    <th className="px-6 py-4">Display Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4 font-semibold text-white">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {user.display_name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                              : "bg-violet-500/10 text-violet-300"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(user.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

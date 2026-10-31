
"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: userId.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login nahi ho paya.");
        return;
      }

      if (!data.token) {
        setMessage("Login response mein token nahi mila.");
        return;
      }

      // Token ko current browser tab ke session mein rakhna
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.username);
      localStorage.setItem("role", data.user.role);
      setMessage("Login successful! Dashboard khol rahe hain.");

      // Dashboard hum agle step mein banayenge
      if (data.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
    } catch {
      setMessage(
        "Backend se connect nahi ho paya. Backend server check karo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="back-home">
          ← Home
        </Link>

         <Image
              src="/deemora-logo.png"
              alt="Deemora"
              width={44}
              height={44}
              className="h-11 w-11 rounded-2xl object-cover"
            />

        <p className="eyebrow">DEEMORA CHAT</p>
        <h1>Welcome Back</h1>
        <p className="auth-description">
          Apni User ID se login karo aur chat par wapas aao.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <label htmlFor="userId">User ID</label>
          <input
            id="userId"
            type="text"
            placeholder="Jaise deepak123"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Apna password likho"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {message && (
            <p className="form-message error-message" role="status">
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Login ho raha hai..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Account nahi hai? <Link href="/register">Create Account</Link>
        </p>
      </section>
    </main>
  );
}

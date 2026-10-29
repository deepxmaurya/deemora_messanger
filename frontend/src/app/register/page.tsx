
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RegisterPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);
    setLoading(true);

    const normalizedUserId = userId.trim().toLowerCase();

    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: normalizedUserId,
          display_name: normalizedUserId,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration nahi ho paya.");
        return;
      }

      setSuccess(true);
      setMessage("Account successfully ban gaya. Ab login karo.");

      setUserId("");
      setPassword("");
       router.push("/login");
    } catch {
      setMessage(
        "Backend se connect nahi ho paya. Server aur CORS check karo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark">D</div>

        <p className="eyebrow">DREAMSHOP CHAT</p>
        <h1>Create Account</h1>
        <p className="auth-description">
          Apni unique User ID banao aur chat shuru karo.
        </p>

        <form onSubmit={handleRegister} className="auth-form">
          <label htmlFor="userId">User ID</label>
          <input
            id="userId"
            type="text"
            placeholder="Jaise deepak123"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            minLength={3}
            maxLength={50}
            pattern="[a-zA-Z0-9_]+"
            title="3 se 50 characters: letters, numbers aur underscore."
            autoComplete="username"
            required
          />

          <p className="field-hint">
            Isi ID se login karoge. Do users ki ID ek jaisi nahi ho sakti.
          </p>

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Kam se kam 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            required
          />

          {message && (
            <p
              className={`form-message ${
                success ? "success-message" : "error-message"
              }`}
              role="status"
            >
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Account ban raha hai..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Pehle se account hai? <Link href="/login">Login karo</Link>
        </p>
      </section>
    </main>
  );
}

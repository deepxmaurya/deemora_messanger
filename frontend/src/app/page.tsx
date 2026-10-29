
import Link from "next/link";

const features = [
  {
    icon: "💬",
    title: "Private Conversations",
    description: "Apne friends ke saath ek hi jagah par chat karo.",
  },
  {
    icon: "⚡",
    title: "Simple & Fast",
    description: "Bina kisi complicated setup ke chatting shuru karo.",
  },
  {
    icon: "🔒",
    title: "Your Own Identity",
    description: "Apni unique User ID se logon ko connect karo.",
  },
];

const contacts = [
  { username: "Deepak1314", message: "Hey! Kya haal hai?", time: "10:24", color: "bg-violet-500" },
  { username: "Mandeep123", message: "Kal baat karte hain 😊", time: "10:12", color: "bg-pink-500" },
  { username: "Sandeep@123", message: "Thanks bro!", time: "09:48", color: "bg-cyan-500" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080b14] text-white">
      {/* Navbar */}
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold shadow-lg shadow-violet-600/30">
              D
            </span>
            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              Deemora <span className="text-violet-400">Chat</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:text-white sm:px-4"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold transition hover:bg-violet-500 sm:px-5"
            >
              Create Account
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-12 lg:py-28">
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-[110px]" />

        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Simple · Private · Connected
          </div>

          <h1 className="max-w-xl text-5xl leading-[1.12] font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your people.
            <br />
            Your <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">conversations.</span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-8 text-zinc-400 sm:text-lg">
            Welcome to DreamShop Chat. Apni User ID banao, friends ko
            connect karo aur apni conversations ek hi jagah par rakho.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-violet-600 px-7 py-4 font-semibold shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-500"
            >
              Get Started <span className="ml-2">→</span>
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-4 font-semibold transition hover:border-violet-400/50 hover:bg-white/10"
            >
              Login
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-400">
            <span>✓ Apni User ID</span>
            <span>✓ Simple experience</span>
            <span>✓ Personal conversations</span>
          </div>
        </div>

        {/* Chat Preview */}
        <div className="relative z-10 mx-auto w-full max-w-xl">
          <div className="absolute -inset-5 rounded-[2rem] bg-violet-600/10 blur-2xl" />

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111522] shadow-2xl shadow-black/40">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 font-bold">
                  D
                </div>
                <div>
                  <p className="font-semibold">Deemora Chat</p>
                  <p className="text-xs text-zinc-500">Your chat space</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-400">
                ● Online
              </span>
            </div>

            <div className="grid min-h-[350px] grid-cols-[125px_1fr] sm:grid-cols-[175px_1fr]">
              {/* Contact List */}
              <aside className="border-r border-white/10 p-3 sm:p-4">
                <p className="mb-4 text-xs font-semibold tracking-wider text-zinc-500">
                  MESSAGES
                </p>

                {contacts.map((contact, index) => (
                  <div
                    key={contact.username}
                    className={`mb-2 flex items-start gap-2 rounded-xl p-2 ${
                      index === 0 ? "bg-violet-500/15" : "hover:bg-white/5"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${contact.color}`}>
                      {contact.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-zinc-200">
                        {contact.username}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-zinc-500">
                        {contact.message}
                      </p>
                    </div>
                  </div>
                ))}
              </aside>

              {/* Message Area */}
              <div className="flex min-w-0 flex-col p-3 sm:p-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="font-semibold">Deepak1314</p>
                  <p className="mt-1 text-xs text-emerald-400">● Online</p>
                </div>

                <div className="flex flex-1 flex-col gap-5 py-6">
                  <div className="self-start">
                    <p className="mb-2 text-xs text-zinc-500">Deepak1314</p>
                    <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-[#1b2030] px-4 py-3 text-sm text-zinc-200">
                      Hey! Kya haal hai? 👋
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-600">10:24 AM</p>
                  </div>

                  <div className="max-w-[95%] self-end">
                    <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm text-white">
                      Sab badhiya! Tum batao 😊
                    </div>
                    <p className="mt-1 text-right text-[10px] text-zinc-500">10:25 AM ✓✓</p>
                  </div>

                  <div className="self-start">
                    <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-[#1b2030] px-4 py-3 text-sm text-zinc-200">
                      Chalo, baad mein baat karte hain!
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-600">10:26 AM</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f1a] px-3 py-3">
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-500 sm:text-sm">
                    Type a message...
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-sm">
                    ➤
                  </span>
                </div>
                <p className="mt-2 text-center text-[10px] text-zinc-600">
                  Preview only · Real chats will appear in your account
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-violet-400">
            MADE FOR CONVERSATIONS
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Chat, your way.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-zinc-400">
            Ek simple jagah jahan tum apni identity ke saath logon se connect kar sako.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-[#101420] p-6 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-[#141827]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10 text-2xl">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 DreamShop Chat</p>
          <p>Connect. Chat. Belong.</p>
        </div>
      </footer>
    </main>
  );
}

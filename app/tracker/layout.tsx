"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/tracker", label: "Today" },
  { href: "/tracker/lifts", label: "Lifts" },
  { href: "/tracker/history", label: "History" },
  { href: "/tracker/settings", label: "Settings" },
];

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <Link href="/" className="text-sm text-slate-400 hover:underline">
              ← Sales Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-white">Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
              {TABS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    pathname === t.href
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}

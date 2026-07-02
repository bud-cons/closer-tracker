"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MonthSelector from "@/components/MonthSelector";
import { PEOPLE } from "@/lib/constants";
import { formatCurrency, formatPercent, currentMonthValue } from "@/lib/format";
import type { Stats } from "@/lib/stats";

type CloserResult = { id: string; name: string; stats: Stats };
type SetterResult = { setter: string; stats: Stats };

export default function DashboardPage() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthValue());
  const [closers, setClosers] = useState<CloserResult[]>([]);
  const [setterSummary, setSetterSummary] = useState<SetterResult[]>([]);
  const [setterFilter, setSetterFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    const res = await fetch(`/api/dashboard?${params.toString()}`);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setClosers(data.closers ?? []);
    setSetterSummary(data.setterSummary ?? []);
    setLoading(false);
  }, [month, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  const visibleSetterSummary = setterFilter
    ? setterSummary.filter((s) => s.setter === setterFilter)
    : setterSummary;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Closer Tracker</h1>
            <p className="text-sm text-slate-500">Team dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <MonthSelector value={month} onChange={setMonth} />
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Closers
          </h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {closers.map((c) => (
                <Link
                  key={c.id}
                  href={`/closer/${c.id}?month=${month}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md"
                >
                  <h3 className="mb-3 text-base font-semibold text-slate-900">{c.name}</h3>
                  <dl className="space-y-1 text-sm">
                    <Row label="Calls" value={String(c.stats.totalCalls)} />
                    <Row label="Shows" value={`${c.stats.shows} (${formatPercent(c.stats.showRate)})`} />
                    <Row label="Won" value={String(c.stats.dealsWon)} />
                    <Row label="Close Rate" value={formatPercent(c.stats.closeRate)} />
                    <Row label="CC" value={formatCurrency(c.stats.cc)} />
                    <Row label="Commission" value={formatCurrency(c.stats.commission)} />
                    {c.stats.bonusAmount > 0 && (
                      <Row
                        label={`Bonus (${formatPercent(c.stats.bonusPercent)})`}
                        value={formatCurrency(c.stats.bonusAmount)}
                      />
                    )}
                  </dl>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              By Setter / Origin
            </h2>
            <select
              value={setterFilter}
              onChange={(e) => setSetterFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All Setters / Origins</option>
              {PEOPLE.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Setter / Origin</th>
                  <th className="px-4 py-3">Calls</th>
                  <th className="px-4 py-3">Showed</th>
                  <th className="px-4 py-3">Won</th>
                  <th className="px-4 py-3">CC</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">CC / Call</th>
                  <th className="px-4 py-3">Close Rate</th>
                </tr>
              </thead>
              <tbody>
                {visibleSetterSummary.map((s) => (
                  <tr key={s.setter} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.setter}</td>
                    <td className="px-4 py-3">{s.stats.totalCalls}</td>
                    <td className="px-4 py-3">{s.stats.shows}</td>
                    <td className="px-4 py-3">{s.stats.dealsWon}</td>
                    <td className="px-4 py-3">{formatCurrency(s.stats.cc)}</td>
                    <td className="px-4 py-3">{formatCurrency(s.stats.commission)}</td>
                    <td className="px-4 py-3">{formatCurrency(s.stats.ccPerCall)}</td>
                    <td className="px-4 py-3">{formatPercent(s.stats.closeRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import MonthSelector from "@/components/MonthSelector";
import StatsBox from "@/components/StatsBox";
import AppointmentForm, { AppointmentFormValues } from "@/components/AppointmentForm";
import { PEOPLE } from "@/lib/constants";
import { formatCurrency, formatPercent, formatDate, currentMonthValue } from "@/lib/format";
import { byDateThenTime } from "@/lib/sort";
import type { Appointment, Closer, Stats } from "@/lib/types";

type SortKey = "date" | "commission";
type SortDir = "asc" | "desc";

function CloserPageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const closerId = params.id;

  const [month, setMonth] = useState(searchParams.get("month") || currentMonthValue());
  const [setterFilter, setSetterFilter] = useState("");
  const [closer, setCloser] = useState<Closer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [setterStats, setSetterStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | undefined>(undefined);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedAppointments = useMemo(() => {
    const arr = [...appointments];
    arr.sort((a, b) => {
      const cmp = sortKey === "date" ? byDateThenTime(a, b) : a.commission - b.commission;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [appointments, sortKey, sortDir]);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (month) p.set("month", month);
    if (setterFilter) p.set("setter", setterFilter);
    const res = await fetch(`/api/closers/${closerId}?${p.toString()}`);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.status === 404) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setCloser(data.closer);
    setAppointments(data.appointments ?? []);
    setStats(data.stats);
    setSetterStats(data.setterStats);
    setLoading(false);
  }, [closerId, month, setterFilter, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(values: AppointmentFormValues) {
    const res = await fetch(`/api/closers/${closerId}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("Failed to create");
    setFormOpen(false);
    setEditing(undefined);
    await load();
  }

  async function handleUpdate(values: AppointmentFormValues) {
    if (!editing) return;
    const res = await fetch(`/api/appointments/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("Failed to update");
    setFormOpen(false);
    setEditing(undefined);
    await load();
  }

  async function handleDelete(appointment: Appointment) {
    if (!confirm(`Delete appointment for ${appointment.name}?`)) return;
    await fetch(`/api/appointments/${appointment.id}`, { method: "DELETE" });
    await load();
  }

  if (loading && !closer) {
    return <div className="min-h-screen bg-slate-950 p-8 text-sm text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <Link href="/" className="text-sm text-slate-400 hover:underline">
              ← Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-white">{closer?.name}</h1>
          </div>
          <MonthSelector value={month} onChange={setMonth} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {stats && setterStats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsBox
              title="Calls & Deals"
              rows={[
                { label: "Total Calls On Calendar", value: String(stats.totalCalls) },
                { label: "Closed Deals", value: String(stats.closedDeals) },
                { label: "CC", value: formatCurrency(stats.cc) },
                { label: "Total Commission", value: formatCurrency(stats.commission) },
                { label: "Bonus Tier", value: formatPercent(stats.bonusPercent) },
                { label: "Bonus $", value: formatCurrency(stats.bonusAmount) },
                { label: "Commission + Bonus", value: formatCurrency(stats.commissionWithBonus) },
                { label: "Show Rate", value: formatPercent(stats.showRate) },
                { label: "% on Calls Taken", value: formatPercent(stats.pctOnCallsTaken) },
                { label: "% on Calls Booked", value: formatPercent(stats.pctOnCallsBooked) },
              ]}
            />
            <StatsBox
              title="Shows & Cancels"
              rows={[
                { label: "Shows", value: String(stats.shows) },
                { label: "No-Shows", value: String(stats.noShows) },
                { label: "Cancels", value: String(stats.cancels) },
                { label: "Cancel Rate", value: formatPercent(stats.cancelRate) },
                { label: "Deals Won", value: String(stats.dealsWon) },
                { label: "Deals Lost", value: String(stats.dealsLost) },
                { label: "Follow-Ups", value: String(stats.followUps) },
              ]}
            />
            <StatsBox
              title="Setter / Origin"
              headerRight={
                <select
                  value={setterFilter}
                  onChange={(e) => setSetterFilter(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white outline-none focus:border-slate-500"
                >
                  <option value="">All</option>
                  {PEOPLE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              }
              rows={[
                { label: "Showed", value: String(setterStats.shows) },
                { label: "Won", value: String(setterStats.dealsWon) },
                { label: "CC", value: formatCurrency(setterStats.cc) },
                { label: "Commission", value: formatCurrency(setterStats.commission) },
                { label: "CC / Call", value: formatCurrency(setterStats.ccPerCall) },
                { label: "Close Rate", value: formatPercent(setterStats.closeRate) },
              ]}
            />
          </div>
        )}

        <div className="mt-8 mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Appointments
          </h2>
          <button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            + Add Appointment
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-800/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Booked</th>
                <SortableHeader label="Appt Date" sortKey="date" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Setter / Origin</th>
                <th className="px-3 py-3">Showed</th>
                <th className="px-3 py-3">Result</th>
                <th className="px-3 py-3">Reschedule</th>
                <th className="px-3 py-3">CC</th>
                <SortableHeader label="Commission" sortKey="commission" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <th className="px-3 py-3">Objection</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-3 py-6 text-center text-slate-500">
                    No appointments for this period yet.
                  </td>
                </tr>
              )}
              {sortedAppointments.map((a) => (
                <tr key={a.id} className="border-t border-slate-800">
                  <td className="px-3 py-3 font-medium text-white">{a.name}</td>
                  <td className="px-3 py-3 text-slate-400">{formatDate(a.dateBooked)}</td>
                  <td className="px-3 py-3 text-slate-400">{formatDate(a.appointmentDate)}</td>
                  <td className="px-3 py-3 text-slate-400">{a.requestedTime}</td>
                  <td className="px-3 py-3 text-slate-400">{a.setterOrigin}</td>
                  <td className="px-3 py-3 text-slate-400">{a.showed}</td>
                  <td className="px-3 py-3 text-slate-400">{a.result}</td>
                  <td className="px-3 py-3 text-slate-400">{formatDate(a.rescheduleDate)}</td>
                  <td className="px-3 py-3 text-slate-400">{formatCurrency(a.cashCollected)}</td>
                  <td className="px-3 py-3 text-slate-400">{formatCurrency(a.commission)}</td>
                  <td className="px-3 py-3 text-slate-400">{a.objection}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(a);
                          setFormOpen(true);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {formOpen && (
        <AppointmentForm
          appointment={editing}
          onCancel={() => {
            setFormOpen(false);
            setEditing(undefined);
          }}
          onSubmit={editing ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
}

export default function CloserPage() {
  return (
    <Suspense>
      <CloserPageInner />
    </Suspense>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const active = sortKey === activeKey;
  return (
    <th className="px-3 py-3">
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`flex items-center gap-1 hover:text-white ${active ? "text-white" : ""}`}
      >
        {label}
        <span className="text-[10px]">{active ? (dir === "asc" ? "▲" : "▼") : "⇅"}</span>
      </button>
    </th>
  );
}

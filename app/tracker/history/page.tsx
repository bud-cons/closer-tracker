"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { computeStreak, todayLocalDate } from "@/lib/tracker";
import { formatDate } from "@/lib/format";

type Day = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  caloriesBurned: number;
  pass: boolean;
};

const DAYS_WINDOW = 90;

export default function TrackerHistoryPage() {
  const router = useRouter();
  const today = todayLocalDate();
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/tracker/summary?today=${today}&days=${DAYS_WINDOW}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setDays(data.days ?? []);
      setLoading(false);
    })();
  }, [today, router]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  const streak = computeStreak(days.map((d) => ({ date: d.date, pass: d.pass })), today);
  const loggedDays = days.filter((d) => d.calories > 0 || d.caloriesBurned > 0);
  const recent = [...days].reverse();

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center gap-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Current streak</p>
          <p className="text-2xl font-semibold text-white">🔥 {streak.current}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Longest streak</p>
          <p className="text-2xl font-semibold text-white">{streak.longest}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Days logged</p>
          <p className="text-2xl font-semibold text-white">{loggedDays.length}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Last {DAYS_WINDOW} days
        </h2>
        <div className="flex flex-wrap gap-1">
          {days.map((d) => (
            <div
              key={d.date}
              title={`${d.date}${d.calories > 0 ? ` — ${d.pass ? "Passed" : "Missed"}` : " — no data"}`}
              className="h-4 w-4 rounded-sm"
              style={{
                backgroundColor:
                  d.calories === 0 && d.caloriesBurned === 0
                    ? "#2c2c2a"
                    : d.pass
                      ? "#0ca30c"
                      : "#d03b3b",
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          <Legend color="#0ca30c" label="Passed" />
          <Legend color="#d03b3b" label="Missed" />
          <Legend color="#2c2c2a" label="No data" />
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-800/50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Calories</th>
              <th className="px-4 py-3">Protein</th>
              <th className="px-4 py-3">Carbs</th>
              <th className="px-4 py-3">Fat</th>
              <th className="px-4 py-3">Burned</th>
              <th className="px-4 py-3">Result</th>
            </tr>
          </thead>
          <tbody>
            {recent
              .filter((d) => d.calories > 0 || d.caloriesBurned > 0)
              .map((d) => (
                <tr key={d.date} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-white">{formatDate(d.date)}</td>
                  <td className="px-4 py-3 text-slate-400">{Math.round(d.calories)}</td>
                  <td className="px-4 py-3 text-slate-400">{Math.round(d.protein)}g</td>
                  <td className="px-4 py-3 text-slate-400">{Math.round(d.carbs)}g</td>
                  <td className="px-4 py-3 text-slate-400">{Math.round(d.fat)}g</td>
                  <td className="px-4 py-3 text-slate-400">{d.caloriesBurned}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        color: d.pass ? "#0ca30c" : "#e66767",
                        backgroundColor: d.pass ? "rgba(12,163,12,0.12)" : "rgba(214,59,59,0.12)",
                      }}
                    >
                      {d.pass ? "Passed" : "Missed"}
                    </span>
                  </td>
                </tr>
              ))}
            {loggedDays.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No days logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

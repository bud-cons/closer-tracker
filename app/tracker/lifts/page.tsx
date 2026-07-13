"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computePRs } from "@/lib/pr";
import type { LiftLog } from "@/lib/pr";
import { todayLocalDate } from "@/lib/tracker";
import { formatDate } from "@/lib/format";

const COMMON_EXERCISES = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull-up",
];

export default function LiftsPage() {
  const router = useRouter();
  const today = todayLocalDate();

  const [lifts, setLifts] = useState<LiftLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [prBanner, setPrBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tracker/lifts");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setLifts(data.entries ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const prs = useMemo(() => computePRs(lifts), [lifts]);
  const knownExercises = useMemo(() => {
    const set = new Set([...COMMON_EXERCISES, ...lifts.map((l) => l.exercise)]);
    return Array.from(set);
  }, [lifts]);
  const recent = useMemo(() => [...lifts].reverse().slice(0, 25), [lifts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise.trim() || weight === "" || reps === "") return;
    setSaving(true);
    setPrBanner(null);
    try {
      const res = await fetch("/api/tracker/lifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          exercise: exercise.trim(),
          weightLbs: weight,
          reps,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.pr?.heaviestWeight || data.pr?.estimatedOneRepMax) {
          setPrBanner(`🎉 New PR on ${exercise.trim()}!`);
        }
        setWeight("");
        setReps("");
        setNotes("");
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/tracker/lifts/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Log a lift</h2>
        {prBanner && (
          <p className="rounded-lg border border-[#0ca30c]/40 bg-[#0ca30c]/10 px-3 py-2 text-sm font-medium text-[#0ca30c]">
            {prBanner}
          </p>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="col-span-2 block sm:col-span-1">
            <span className="mb-1 block text-xs text-slate-500">Exercise</span>
            <input
              type="text"
              list="exercise-options"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="Squat"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
            />
            <datalist id="exercise-options">
              {knownExercises.map((ex) => (
                <option key={ex} value={ex} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Weight (lbs)</span>
            <input
              type="number"
              min={0}
              value={weight}
              onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Reps</span>
            <input
              type="number"
              min={1}
              value={reps}
              onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
            />
          </label>
          <label className="col-span-2 block sm:col-span-1">
            <span className="mb-1 block text-xs text-slate-500">Notes</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="optional"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
            />
          </label>
          <div className="col-span-2 sm:col-span-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Log lift"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Personal records
        </h2>
        {prs.length === 0 ? (
          <p className="text-sm text-slate-500">Log a lift to start tracking PRs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Exercise</th>
                  <th className="py-2 pr-4">Heaviest weight</th>
                  <th className="py-2 pr-4">Best est. 1RM</th>
                </tr>
              </thead>
              <tbody>
                {prs.map((pr) => (
                  <tr key={pr.exercise} className="border-t border-slate-800">
                    <td className="py-2 pr-4 font-medium text-white">{pr.exercise}</td>
                    <td className="py-2 pr-4 text-slate-300">
                      {pr.heaviestWeight.weightLbs} lbs x {pr.heaviestWeight.reps}
                      <span className="ml-1 text-xs text-slate-500">
                        ({formatDate(pr.heaviestWeight.date)})
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-300">
                      {pr.bestEstimatedOneRepMax.value} lbs
                      <span className="ml-1 text-xs text-slate-500">
                        (from {pr.bestEstimatedOneRepMax.weightLbs}x{pr.bestEstimatedOneRepMax.reps},{" "}
                        {formatDate(pr.bestEstimatedOneRepMax.date)})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Recent lifts
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No lifts logged yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {recent.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-white">
                    {l.exercise} — {l.weightLbs} lbs x {l.reps}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(l.date)}
                    {l.notes ? ` · ${l.notes}` : ""}
                  </p>
                </div>
                <button onClick={() => handleDelete(l.id)} className="text-red-500 hover:text-red-700">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

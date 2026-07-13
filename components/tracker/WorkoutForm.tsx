"use client";

import { useState } from "react";
import { ACTIVITIES, INTENSITIES, INTENSITY_LABELS, estimateCaloriesBurned } from "@/lib/met";
import type { Activity, Intensity } from "@/lib/met";

export type WorkoutFormValues = {
  activity: string;
  intensity: string | null;
  durationMinutes: number;
  caloriesBurned: number;
  source: "manual" | "met" | "ai";
  notes: string;
};

type Prefill = {
  activity?: string;
  intensity?: string | null;
  durationMinutes?: number;
  caloriesBurned?: number;
  notes?: string;
};

type Props = {
  bodyWeightLbs: number;
  prefill: Prefill | null;
  onPrefillConsumed: () => void;
  onSubmit: (values: WorkoutFormValues) => Promise<void>;
};

export default function WorkoutForm({ bodyWeightLbs, prefill, onPrefillConsumed, onSubmit }: Props) {
  const [activity, setActivity] = useState<Activity>("BJJ");
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [duration, setDuration] = useState(60);
  const [manualOverride, setManualOverride] = useState(false);
  const [manualCalories, setManualCalories] = useState(0);
  const [notes, setNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appliedPrefill, setAppliedPrefill] = useState<Prefill | null>(null);

  if (prefill && prefill !== appliedPrefill) {
    setAppliedPrefill(prefill);
    if (prefill.activity && (ACTIVITIES as readonly string[]).includes(prefill.activity)) {
      setActivity(prefill.activity as Activity);
    }
    if (prefill.intensity && (INTENSITIES as readonly string[]).includes(prefill.intensity)) {
      setIntensity(prefill.intensity as Intensity);
    }
    if (typeof prefill.durationMinutes === "number") setDuration(prefill.durationMinutes);
    if (typeof prefill.caloriesBurned === "number") {
      setManualOverride(true);
      setManualCalories(prefill.caloriesBurned);
    }
    if (prefill.notes) setNotes(prefill.notes);
    setReviewing(true);
  }

  const computed = estimateCaloriesBurned(activity, intensity, duration, bodyWeightLbs);
  const displayCalories = manualOverride ? manualCalories : computed;

  function reset() {
    setActivity("BJJ");
    setIntensity("moderate");
    setDuration(60);
    setManualOverride(false);
    setManualCalories(0);
    setNotes("");
    setReviewing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (duration <= 0) return;
    setSaving(true);
    try {
      await onSubmit({
        activity,
        intensity: manualOverride ? null : intensity,
        durationMinutes: duration,
        caloriesBurned: displayCalories,
        source: reviewing ? "ai" : manualOverride ? "manual" : "met",
        notes,
      });
      reset();
      onPrefillConsumed();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {reviewing && (
        <p className="rounded-lg border border-blue-800 bg-blue-950/40 px-3 py-2 text-xs text-blue-300">
          Read from your screenshot — double-check before saving.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Activity</span>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as Activity)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-slate-500"
          >
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Duration (min)</span>
          <input
            type="number"
            min={1}
            value={duration || ""}
            onChange={(e) => setDuration(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-slate-500"
          />
        </label>
        {!manualOverride && (
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Intensity</span>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as Intensity)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-slate-500"
            >
              {INTENSITIES.map((i) => (
                <option key={i} value={i}>
                  {INTENSITY_LABELS[i]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {manualOverride ? (
          <label className="flex items-center gap-2">
            <span className="text-slate-400">Calories burned</span>
            <input
              type="number"
              min={0}
              value={manualCalories || ""}
              onChange={(e) => setManualCalories(Math.max(0, Number(e.target.value) || 0))}
              className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-slate-500"
            />
          </label>
        ) : (
          <span className="text-slate-400">
            Estimated burn: <span className="font-medium text-white">{computed} kcal</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            setManualOverride((v) => !v);
            setManualCalories(computed);
          }}
          className="text-xs text-slate-500 underline hover:text-slate-300"
        >
          {manualOverride ? "Use estimate instead" : "Enter exact calories instead"}
        </button>
      </div>

      <input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Log workout"}
        </button>
        {reviewing && (
          <button
            type="button"
            onClick={() => {
              reset();
              onPrefillConsumed();
            }}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Discard
          </button>
        )}
      </div>
    </form>
  );
}

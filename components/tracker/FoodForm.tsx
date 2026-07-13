"use client";

import { useState } from "react";

export type FoodFormValues = {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "manual" | "ai";
};

const EMPTY: FoodFormValues = {
  description: "",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  source: "manual",
};

type Props = {
  prefill: Partial<FoodFormValues> | null;
  onPrefillConsumed: () => void;
  onSubmit: (values: FoodFormValues) => Promise<void>;
};

export default function FoodForm({ prefill, onPrefillConsumed, onSubmit }: Props) {
  const [values, setValues] = useState<FoodFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [appliedPrefill, setAppliedPrefill] = useState<Props["prefill"]>(null);

  if (prefill && prefill !== appliedPrefill) {
    setAppliedPrefill(prefill);
    setValues({ ...EMPTY, ...prefill, source: "ai" });
    setReviewing(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.description.trim() || values.calories <= 0) return;
    setSaving(true);
    try {
      await onSubmit(values);
      setValues(EMPTY);
      setReviewing(false);
      onPrefillConsumed();
    } finally {
      setSaving(false);
    }
  }

  function num(v: string): number {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {reviewing && (
        <p className="rounded-lg border border-blue-800 bg-blue-950/40 px-3 py-2 text-xs text-blue-300">
          Read from your screenshot — double-check before saving.
        </p>
      )}
      <input
        type="text"
        placeholder="What did you eat?"
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
      />
      <div className="grid grid-cols-4 gap-2">
        <Field label="Calories">
          <input
            type="number"
            min={0}
            value={values.calories || ""}
            onChange={(e) => setValues((v) => ({ ...v, calories: num(e.target.value) }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-slate-500"
          />
        </Field>
        <Field label="Protein g">
          <input
            type="number"
            min={0}
            value={values.protein || ""}
            onChange={(e) => setValues((v) => ({ ...v, protein: num(e.target.value) }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-slate-500"
          />
        </Field>
        <Field label="Carbs g">
          <input
            type="number"
            min={0}
            value={values.carbs || ""}
            onChange={(e) => setValues((v) => ({ ...v, carbs: num(e.target.value) }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-slate-500"
          />
        </Field>
        <Field label="Fat g">
          <input
            type="number"
            min={0}
            value={values.fat || ""}
            onChange={(e) => setValues((v) => ({ ...v, fat: num(e.target.value) }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-slate-500"
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Log food"}
        </button>
        {reviewing && (
          <button
            type="button"
            onClick={() => {
              setValues(EMPTY);
              setReviewing(false);
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      {children}
    </label>
  );
}

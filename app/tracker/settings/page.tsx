"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TrackerProfile } from "@/lib/tracker";

export default function TrackerSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<TrackerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/tracker/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setProfile(data.profile);
      setLoading(false);
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/tracker/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setProfile(data.profile);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || !profile) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  function field(key: keyof TrackerProfile, label: string, unit: string) {
    return (
      <label className="block">
        <span className="mb-1 block text-sm text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={profile![key] || ""}
            onChange={(e) =>
              setProfile((p) => (p ? { ...p, [key]: Math.max(0, Number(e.target.value) || 0) } : p))
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
          />
          <span className="text-sm text-slate-500">{unit}</span>
        </div>
      </label>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <p className="text-sm text-slate-400">
        Your daily targets and bodyweight (used to estimate workout calorie burn).
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        {field("bodyWeightLbs", "Body weight", "lbs")}
        {field("calorieTarget", "Daily calorie target", "kcal")}
        {field("proteinTarget", "Daily protein target", "g")}
        {field("carbsTarget", "Daily carbs target", "g")}
        {field("fatTarget", "Daily fat target", "g")}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save targets"}
          </button>
          {saved && <span className="text-sm text-[#0ca30c]">Saved</span>}
        </div>
      </form>
    </div>
  );
}

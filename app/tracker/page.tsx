"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MacroBar from "@/components/tracker/MacroBar";
import ScreenshotUpload from "@/components/tracker/ScreenshotUpload";
import FoodForm, { FoodFormValues } from "@/components/tracker/FoodForm";
import WorkoutForm, { WorkoutFormValues } from "@/components/tracker/WorkoutForm";
import {
  computeStreak,
  evaluateDay,
  foodTotals,
  todayLocalDate,
  workoutCaloriesBurned,
} from "@/lib/tracker";
import type { FoodEntry, TrackerProfile, WorkoutEntry } from "@/lib/tracker";

const COLORS = { calories: "#3987e5", protein: "#199e70", carbs: "#c98500", fat: "#9085e9" };

export default function TrackerPage() {
  const router = useRouter();
  const today = todayLocalDate();

  const [profile, setProfile] = useState<TrackerProfile | null>(null);
  const [food, setFood] = useState<FoodEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [streakDays, setStreakDays] = useState<{ date: string; pass: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [foodPrefill, setFoodPrefill] = useState<Partial<FoodFormValues> | null>(null);
  const [workoutPrefill, setWorkoutPrefill] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [profileRes, foodRes, workoutRes, summaryRes] = await Promise.all([
      fetch("/api/tracker/profile"),
      fetch(`/api/tracker/food?date=${today}`),
      fetch(`/api/tracker/workout?date=${today}`),
      fetch(`/api/tracker/summary?today=${today}&days=90`),
    ]);
    if ([profileRes, foodRes, workoutRes, summaryRes].some((r) => r.status === 401)) {
      router.push("/login");
      return;
    }
    const profileData = await profileRes.json();
    const foodData = await foodRes.json();
    const workoutData = await workoutRes.json();
    const summaryData = await summaryRes.json();

    setProfile(profileData.profile);
    setFood(foodData.entries ?? []);
    setWorkouts(workoutData.entries ?? []);
    setStreakDays((summaryData.days ?? []).map((d: { date: string; pass: boolean }) => ({
      date: d.date,
      pass: d.pass,
    })));
    setLoading(false);
  }, [today, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddFood(values: FoodFormValues) {
    await fetch("/api/tracker/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, ...values }),
    });
    await load();
  }

  async function handleAddWorkout(values: WorkoutFormValues) {
    await fetch("/api/tracker/workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, ...values }),
    });
    await load();
  }

  async function handleDeleteFood(id: string) {
    await fetch(`/api/tracker/food/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleDeleteWorkout(id: string) {
    await fetch(`/api/tracker/workout/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading || !profile) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  const totals = foodTotals(food);
  const burned = workoutCaloriesBurned(workouts);
  const rule = evaluateDay(totals, burned, profile);
  const streak = computeStreak(streakDays, today);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Streak</p>
          <p className="text-2xl font-semibold text-white">
            🔥 {streak.current} {streak.current === 1 ? "day" : "days"}
          </p>
          <p className="text-xs text-slate-500">Longest: {streak.longest} days</p>
        </div>
        <DayChecklist rule={rule} />
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Today&apos;s macros
        </h2>
        <div className="space-y-4">
          <MacroBar label="Calories" unit="" consumed={totals.calories} target={profile.calorieTarget} color={COLORS.calories} />
          <MacroBar label="Protein" unit="g" consumed={totals.protein} target={profile.proteinTarget} color={COLORS.protein} isFloor />
          <MacroBar label="Carbs" unit="g" consumed={totals.carbs} target={profile.carbsTarget} color={COLORS.carbs} />
          <MacroBar label="Fat" unit="g" consumed={totals.fat} target={profile.fatTarget} color={COLORS.fat} />
        </div>
        <p className="border-t border-slate-800 pt-3 text-xs text-slate-500">
          Burned today from workouts: <span className="font-medium text-slate-300">{burned} kcal</span>{" "}
          — tracked separately and not added back to your calorie budget above.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Log food</h2>
          <ScreenshotUpload parseType="food" onParsed={(r) => setFoodPrefill(r as Partial<FoodFormValues>)} />
        </div>
        <FoodForm prefill={foodPrefill} onPrefillConsumed={() => setFoodPrefill(null)} onSubmit={handleAddFood} />
        {food.length > 0 && (
          <ul className="divide-y divide-slate-800 border-t border-slate-800 pt-2">
            {food.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-white">{f.description}</p>
                  <p className="text-xs text-slate-500">
                    {f.calories} kcal · P{Math.round(f.protein)} C{Math.round(f.carbs)} F{Math.round(f.fat)}
                    {f.source === "ai" && " · AI"}
                  </p>
                </div>
                <button onClick={() => handleDeleteFood(f.id)} className="text-red-500 hover:text-red-700">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Log workout</h2>
          <ScreenshotUpload parseType="workout" onParsed={(r) => setWorkoutPrefill(r)} />
        </div>
        <WorkoutForm
          bodyWeightLbs={profile.bodyWeightLbs}
          prefill={workoutPrefill}
          onPrefillConsumed={() => setWorkoutPrefill(null)}
          onSubmit={handleAddWorkout}
        />
        {workouts.length > 0 && (
          <ul className="divide-y divide-slate-800 border-t border-slate-800 pt-2">
            {workouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-white">
                    {w.activity} · {w.durationMinutes} min
                  </p>
                  <p className="text-xs text-slate-500">
                    {w.caloriesBurned} kcal{w.intensity ? ` · ${w.intensity}` : ""}
                    {w.source === "ai" && " · AI"}
                    {w.notes ? ` · ${w.notes}` : ""}
                  </p>
                </div>
                <button onClick={() => handleDeleteWorkout(w.id)} className="text-red-500 hover:text-red-700">
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

function DayChecklist({
  rule,
}: {
  rule: {
    metCalories: boolean;
    metProtein: boolean;
    metCarbs: boolean;
    metFat: boolean;
    loggedWorkout: boolean;
    pass: boolean;
  };
}) {
  const items: { label: string; ok: boolean }[] = [
    { label: "Calories on target", ok: rule.metCalories },
    { label: "Protein goal", ok: rule.metProtein },
    { label: "Carbs on target", ok: rule.metCarbs },
    { label: "Fat on target", ok: rule.metFat },
    { label: "Workout logged", ok: rule.loggedWorkout },
  ];
  return (
    <ul className="space-y-1 text-sm">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className={i.ok ? "text-[#0ca30c]" : "text-slate-600"}>{i.ok ? "✓" : "○"}</span>
          <span className={i.ok ? "text-slate-300" : "text-slate-500"}>{i.label}</span>
        </li>
      ))}
    </ul>
  );
}

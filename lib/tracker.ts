export type TrackerProfile = {
  id: string;
  bodyWeightLbs: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
};

export type FoodEntry = {
  id: string;
  date: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  createdAt: string;
};

export type WorkoutEntry = {
  id: string;
  date: string;
  activity: string;
  intensity: string | null;
  durationMinutes: number;
  caloriesBurned: number;
  source: string;
  notes: string | null;
  createdAt: string;
};

export type DayTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  caloriesBurned: number;
};

export function todayLocalDate(): string {
  const now = new Date();
  return dateToLocalString(now);
}

export function dateToLocalString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type FoodMacros = Pick<FoodEntry, "calories" | "protein" | "carbs" | "fat">;

export function foodTotals(entries: FoodMacros[]): Omit<DayTotals, "caloriesBurned"> {
  return entries.reduce(
    (sum, e) => ({
      calories: sum.calories + e.calories,
      protein: sum.protein + e.protein,
      carbs: sum.carbs + e.carbs,
      fat: sum.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function workoutCaloriesBurned(entries: Pick<WorkoutEntry, "caloriesBurned">[]): number {
  return entries.reduce((sum, e) => sum + e.caloriesBurned, 0);
}

export type DayRuleResult = {
  pass: boolean;
  metCalories: boolean;
  metProtein: boolean;
  metCarbs: boolean;
  metFat: boolean;
  loggedWorkout: boolean;
};

// 75-Hard-style pass/fail for a single day: strict, no partial credit.
// - Calories logged must not exceed target.
// - Protein must meet or exceed target (a floor, not a ceiling).
// - Carbs and fat must not exceed target.
// - At least one workout must be logged.
export function evaluateDay(
  food: Omit<DayTotals, "caloriesBurned">,
  caloriesBurned: number,
  profile: TrackerProfile
): DayRuleResult {
  const metCalories = food.calories > 0 && food.calories <= profile.calorieTarget;
  const metProtein = food.protein >= profile.proteinTarget;
  const metCarbs = food.carbs <= profile.carbsTarget;
  const metFat = food.fat <= profile.fatTarget;
  const loggedWorkout = caloriesBurned > 0;

  return {
    pass: metCalories && metProtein && metCarbs && metFat && loggedWorkout,
    metCalories,
    metProtein,
    metCarbs,
    metFat,
    loggedWorkout,
  };
}

export type StreakResult = {
  current: number;
  longest: number;
};

// `days` must be sorted ascending by date and represent every day in the
// range being considered (missing days count as a fail/gap). `today` is
// excluded from breaking the current streak if it simply has no data yet.
export function computeStreak(
  days: { date: string; pass: boolean }[],
  today: string
): StreakResult {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.pass) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.date === today && !d.pass) {
      // today doesn't count against the streak until the day is over
      continue;
    }
    if (d.pass) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

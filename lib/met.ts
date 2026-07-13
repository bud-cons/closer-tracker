// Calorie-burn estimates using MET (Metabolic Equivalent of Task) values,
// the same method wearables and exercise-science references use:
// calories = MET x bodyweight(kg) x duration(hours).
// Values are drawn from the Compendium of Physical Activities.

export const ACTIVITIES = ["BJJ", "Weights", "Walk", "Run", "Other"] as const;
export type Activity = (typeof ACTIVITIES)[number];

export const INTENSITIES = ["light", "moderate", "vigorous"] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const INTENSITY_LABELS: Record<Intensity, string> = {
  light: "Light (drilling / technique / easy pace)",
  moderate: "Moderate (steady effort)",
  vigorous: "Vigorous (hard rolling / heavy lifting / sprinting)",
};

const MET_TABLE: Record<Activity, Record<Intensity, number>> = {
  BJJ: { light: 6, moderate: 8.5, vigorous: 13 },
  Weights: { light: 3, moderate: 4.5, vigorous: 6 },
  Walk: { light: 2.8, moderate: 3.8, vigorous: 5 },
  Run: { light: 8, moderate: 10, vigorous: 12.5 },
  Other: { light: 3, moderate: 5, vigorous: 8 },
};

export function metFor(activity: Activity, intensity: Intensity): number {
  return MET_TABLE[activity][intensity];
}

export function estimateCaloriesBurned(
  activity: Activity,
  intensity: Intensity,
  durationMinutes: number,
  bodyWeightLbs: number
): number {
  const met = metFor(activity, intensity);
  const weightKg = bodyWeightLbs * 0.453592;
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}

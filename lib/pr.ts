// Estimated one-rep max via the Epley formula: 1RM = weight x (1 + reps/30).
// A single at any weight is already its own 1RM (reps=1 -> no adjustment).
export function estimateOneRepMax(weightLbs: number, reps: number): number {
  if (reps <= 1) return weightLbs;
  return weightLbs * (1 + reps / 30);
}

export type LiftLog = {
  id: string;
  date: string;
  exercise: string;
  weightLbs: number;
  reps: number;
  notes: string | null;
};

export type ExercisePR = {
  exercise: string;
  heaviestWeight: { weightLbs: number; reps: number; date: string; id: string };
  bestEstimatedOneRepMax: { value: number; weightLbs: number; reps: number; date: string; id: string };
};

// Groups lifts by exercise and finds, per exercise, both the heaviest single
// weight ever logged (any reps) and the best estimated 1-rep max (accounts
// for reps, so a high-rep set at a lower weight can still be the "real" PR).
export function computePRs(lifts: LiftLog[]): ExercisePR[] {
  const byExercise = new Map<string, LiftLog[]>();
  for (const lift of lifts) {
    const list = byExercise.get(lift.exercise) ?? [];
    list.push(lift);
    byExercise.set(lift.exercise, list);
  }

  const results: ExercisePR[] = [];
  for (const [exercise, entries] of byExercise) {
    let heaviest = entries[0];
    let best1rm = { entry: entries[0], value: estimateOneRepMax(entries[0].weightLbs, entries[0].reps) };

    for (const e of entries) {
      if (e.weightLbs > heaviest.weightLbs) heaviest = e;
      const e1rm = estimateOneRepMax(e.weightLbs, e.reps);
      if (e1rm > best1rm.value) best1rm = { entry: e, value: e1rm };
    }

    results.push({
      exercise,
      heaviestWeight: {
        weightLbs: heaviest.weightLbs,
        reps: heaviest.reps,
        date: heaviest.date,
        id: heaviest.id,
      },
      bestEstimatedOneRepMax: {
        value: Math.round(best1rm.value),
        weightLbs: best1rm.entry.weightLbs,
        reps: best1rm.entry.reps,
        date: best1rm.entry.date,
        id: best1rm.entry.id,
      },
    });
  }

  return results.sort((a, b) => a.exercise.localeCompare(b.exercise));
}

// Whether `candidate` set a new PR against everything logged before it for
// the same exercise (by heaviest weight, or by estimated 1RM).
export function isNewPR(
  candidate: LiftLog,
  priorEntriesSameExercise: LiftLog[]
): { heaviestWeight: boolean; estimatedOneRepMax: boolean } {
  const candidate1rm = estimateOneRepMax(candidate.weightLbs, candidate.reps);
  const priorMaxWeight = priorEntriesSameExercise.reduce((max, e) => Math.max(max, e.weightLbs), 0);
  const priorMax1rm = priorEntriesSameExercise.reduce(
    (max, e) => Math.max(max, estimateOneRepMax(e.weightLbs, e.reps)),
    0
  );
  return {
    heaviestWeight: candidate.weightLbs > priorMaxWeight,
    estimatedOneRepMax: candidate1rm > priorMax1rm,
  };
}

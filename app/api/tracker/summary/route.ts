import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateDay, foodTotals, workoutCaloriesBurned } from "@/lib/tracker";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PROFILE_ID = "default";

function subDaysUTC(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
}

// Returns per-day totals + pass/fail for a window of days ending at `today`,
// plus the resulting streak. `today` and `days` are supplied by the client
// so day boundaries follow the user's local calendar, not the server's.
export async function GET(request: NextRequest) {
  const today = request.nextUrl.searchParams.get("today") ?? "";
  const days = Number(request.nextUrl.searchParams.get("days") ?? "90");
  if (!DATE_RE.test(today) || !Number.isFinite(days) || days < 1 || days > 400) {
    return NextResponse.json({ error: "Invalid today/days" }, { status: 400 });
  }

  const from = subDaysUTC(today, days - 1);

  const profile = await prisma.trackerProfile.upsert({
    where: { id: PROFILE_ID },
    update: {},
    create: { id: PROFILE_ID },
  });

  const [foodEntries, workoutEntries] = await Promise.all([
    prisma.foodEntry.findMany({ where: { date: { gte: from, lte: today } } }),
    prisma.workoutEntry.findMany({ where: { date: { gte: from, lte: today } } }),
  ]);

  const dateList: string[] = [];
  for (let i = 0; i < days; i++) dateList.push(subDaysUTC(today, days - 1 - i));

  const result = dateList.map((date) => {
    const food = foodTotals(foodEntries.filter((e) => e.date === date));
    const caloriesBurned = workoutCaloriesBurned(workoutEntries.filter((e) => e.date === date));
    const rule = evaluateDay(food, caloriesBurned, profile);
    return { date, ...food, caloriesBurned, ...rule };
  });

  return NextResponse.json({ profile, days: result });
}

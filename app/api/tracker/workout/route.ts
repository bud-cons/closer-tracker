import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACTIVITIES, INTENSITIES, estimateCaloriesBurned } from "@/lib/met";
import type { Activity, Intensity } from "@/lib/met";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PROFILE_ID = "default";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Missing or invalid date" }, { status: 400 });
  }
  const entries = await prisma.workoutEntry.findMany({
    where: { date },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, activity, intensity, durationMinutes, caloriesBurned, source, notes } = body;

  if (
    !DATE_RE.test(date) ||
    typeof activity !== "string" ||
    typeof durationMinutes !== "number" ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return NextResponse.json({ error: "Invalid workout entry" }, { status: 400 });
  }

  let resolvedCalories: number;

  if (source === "met") {
    if (
      !ACTIVITIES.includes(activity as Activity) ||
      !INTENSITIES.includes(intensity as Intensity)
    ) {
      return NextResponse.json({ error: "Invalid activity/intensity" }, { status: 400 });
    }
    const profile = await prisma.trackerProfile.findUnique({ where: { id: PROFILE_ID } });
    const bodyWeightLbs = profile?.bodyWeightLbs ?? 180;
    resolvedCalories = estimateCaloriesBurned(
      activity as Activity,
      intensity as Intensity,
      durationMinutes,
      bodyWeightLbs
    );
  } else {
    if (typeof caloriesBurned !== "number" || !Number.isFinite(caloriesBurned) || caloriesBurned < 0) {
      return NextResponse.json({ error: "Invalid calories burned" }, { status: 400 });
    }
    resolvedCalories = Math.round(caloriesBurned);
  }

  const entry = await prisma.workoutEntry.create({
    data: {
      date,
      activity,
      intensity: typeof intensity === "string" ? intensity : null,
      durationMinutes: Math.round(durationMinutes),
      caloriesBurned: resolvedCalories,
      source: source === "met" ? "met" : source === "ai" ? "ai" : "manual",
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
  });
  return NextResponse.json({ entry }, { status: 201 });
}

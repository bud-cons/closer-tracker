import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isNewPR } from "@/lib/pr";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (date && !DATE_RE.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const entries = await prisma.liftEntry.findMany({
    where: date ? { date } : {},
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, exercise, weightLbs, reps, notes } = body;

  if (
    !DATE_RE.test(date) ||
    typeof exercise !== "string" ||
    !exercise.trim() ||
    typeof weightLbs !== "number" ||
    !Number.isFinite(weightLbs) ||
    weightLbs <= 0 ||
    typeof reps !== "number" ||
    !Number.isInteger(reps) ||
    reps <= 0
  ) {
    return NextResponse.json({ error: "Invalid lift entry" }, { status: 400 });
  }

  const exerciseName = exercise.trim();
  const priorEntries = await prisma.liftEntry.findMany({ where: { exercise: exerciseName } });

  const entry = await prisma.liftEntry.create({
    data: {
      date,
      exercise: exerciseName,
      weightLbs,
      reps,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
  });

  const pr = isNewPR(entry, priorEntries);

  return NextResponse.json({ entry, pr }, { status: 201 });
}

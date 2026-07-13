import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Missing or invalid date" }, { status: 400 });
  }
  const entries = await prisma.foodEntry.findMany({
    where: { date },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, description, calories, protein, carbs, fat, source } = body;

  if (
    !DATE_RE.test(date) ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof calories !== "number" ||
    typeof protein !== "number" ||
    typeof carbs !== "number" ||
    typeof fat !== "number" ||
    [calories, protein, carbs, fat].some((n) => !Number.isFinite(n) || n < 0)
  ) {
    return NextResponse.json({ error: "Invalid food entry" }, { status: 400 });
  }

  const entry = await prisma.foodEntry.create({
    data: {
      date,
      description: description.trim(),
      calories: Math.round(calories),
      protein,
      carbs,
      fat,
      source: source === "ai" ? "ai" : "manual",
    },
  });
  return NextResponse.json({ entry }, { status: 201 });
}

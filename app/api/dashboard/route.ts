import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStats, monthRange } from "@/lib/stats";
import { PEOPLE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month") ?? "";
  const range = monthRange(month);

  const closers = await prisma.closer.findMany({ orderBy: { order: "asc" } });
  const appointments = await prisma.appointment.findMany({
    where: range ? { appointmentDate: { gte: range.gte, lt: range.lt } } : {},
  });

  const closerResults = closers.map((closer) => ({
    id: closer.id,
    name: closer.name,
    stats: computeStats(appointments.filter((a) => a.closerId === closer.id)),
  }));

  const setterSummary = PEOPLE.map((setter) => ({
    setter,
    stats: computeStats(appointments.filter((a) => a.setterOrigin === setter)),
  }));

  return NextResponse.json({ closers: closerResults, setterSummary });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStats, monthRange } from "@/lib/stats";
import { byDateThenTime } from "@/lib/sort";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const closer = await prisma.closer.findUnique({ where: { id } });
  if (!closer) {
    return NextResponse.json({ error: "Closer not found" }, { status: 404 });
  }

  const month = request.nextUrl.searchParams.get("month") ?? "";
  const setter = request.nextUrl.searchParams.get("setter") ?? "";
  const range = monthRange(month);

  const appointments = await prisma.appointment.findMany({
    where: {
      closerId: id,
      ...(range ? { appointmentDate: { gte: range.gte, lt: range.lt } } : {}),
    },
  });
  appointments.sort(byDateThenTime);

  const stats = computeStats(appointments);
  const setterStats = setter
    ? computeStats(appointments.filter((a) => a.setterOrigin === setter))
    : stats;

  return NextResponse.json({ closer, appointments, stats, setterStats });
}

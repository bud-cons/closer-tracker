import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function toDateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const closer = await prisma.closer.findUnique({ where: { id } });
  if (!closer) {
    return NextResponse.json({ error: "Closer not found" }, { status: 404 });
  }

  const body = await request.json();

  const appointmentDate = toDateOrNull(body.appointmentDate);
  if (!appointmentDate) {
    return NextResponse.json({ error: "appointmentDate is required" }, { status: 400 });
  }
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.setterOrigin || typeof body.setterOrigin !== "string") {
    return NextResponse.json({ error: "setterOrigin is required" }, { status: 400 });
  }
  if (!body.showed || typeof body.showed !== "string") {
    return NextResponse.json({ error: "showed is required" }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      closerId: id,
      name: body.name,
      dateBooked: toDateOrNull(body.dateBooked),
      appointmentDate,
      requestedTime: body.requestedTime || null,
      setterOrigin: body.setterOrigin,
      showed: body.showed,
      result: body.result || null,
      rescheduleDate: toDateOrNull(body.rescheduleDate),
      cashCollected: Number(body.cashCollected) || 0,
      commission: Number(body.commission) || 0,
      objection: body.objection || null,
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}

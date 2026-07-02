import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function toDateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const body = await request.json();

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      dateBooked: body.dateBooked !== undefined ? toDateOrNull(body.dateBooked) : existing.dateBooked,
      appointmentDate:
        body.appointmentDate !== undefined
          ? toDateOrNull(body.appointmentDate) ?? existing.appointmentDate
          : existing.appointmentDate,
      requestedTime: body.requestedTime ?? null,
      setterOrigin: body.setterOrigin ?? existing.setterOrigin,
      showed: body.showed ?? existing.showed,
      result: body.result ?? null,
      rescheduleDate: body.rescheduleDate !== undefined ? toDateOrNull(body.rescheduleDate) : existing.rescheduleDate,
      cashCollected: body.cashCollected !== undefined ? Number(body.cashCollected) || 0 : existing.cashCollected,
      commission: body.commission !== undefined ? Number(body.commission) || 0 : existing.commission,
      objection: body.objection ?? null,
    },
  });

  return NextResponse.json({ appointment });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.appointment.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const closers = await prisma.closer.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true, order: true },
  });
  return NextResponse.json({ closers });
}

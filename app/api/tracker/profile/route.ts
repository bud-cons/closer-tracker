import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const PROFILE_ID = "default";

async function getOrCreateProfile() {
  return prisma.trackerProfile.upsert({
    where: { id: PROFILE_ID },
    update: {},
    create: { id: PROFILE_ID },
  });
}

export async function GET() {
  const profile = await getOrCreateProfile();
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { bodyWeightLbs, calorieTarget, proteinTarget, carbsTarget, fatTarget } = body;

  if (
    typeof bodyWeightLbs !== "number" ||
    typeof calorieTarget !== "number" ||
    typeof proteinTarget !== "number" ||
    typeof carbsTarget !== "number" ||
    typeof fatTarget !== "number" ||
    [bodyWeightLbs, calorieTarget, proteinTarget, carbsTarget, fatTarget].some(
      (n) => !Number.isFinite(n) || n < 0
    )
  ) {
    return NextResponse.json({ error: "Invalid profile values" }, { status: 400 });
  }

  await getOrCreateProfile();
  const profile = await prisma.trackerProfile.update({
    where: { id: PROFILE_ID },
    data: { bodyWeightLbs, calorieTarget, proteinTarget, carbsTarget, fatTarget },
  });
  return NextResponse.json({ profile });
}

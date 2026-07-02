import { PrismaClient } from "@prisma/client";
import { PEOPLE } from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < PEOPLE.length; i++) {
    await prisma.closer.upsert({
      where: { name: PEOPLE[i] },
      update: { order: i },
      create: { name: PEOPLE[i], order: i },
    });
  }
  console.log(`Seeded ${PEOPLE.length} closers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

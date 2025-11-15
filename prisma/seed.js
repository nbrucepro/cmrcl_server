import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminId = "02caf09a-07ac-43e0-a045-05bcfc8f7a3b";

  const categories = [
    "Malaysian",
    "Melamine",
    "ZRK",
    "Mattress",
    "Lock",
  ];

  for (const name of categories) {
    const existing = await prisma.category.findFirst({
      where: { name, adminId },
    });

    if (!existing) {
      await prisma.category.create({
        data: { name, adminId },
      });
      console.log(`✅ Category "${name}" created.`);
    } else {
      console.log(`⚠️ Category "${name}" already exists.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

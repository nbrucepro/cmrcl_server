import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Replace this with the adminId you want to associate the categories with
  const adminId = "8859d616-3dae-49ab-892e-cd8e6ea0a084";

  const categories = ["door", "lock"];

  for (const name of categories) {
    // Check if category already exists to avoid duplicates
    const existing = await prisma.category.findFirst({
      where: { name, adminId },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name,
          adminId,
        },
      });
      console.log(`Category "${name}" created.`);
    } else {
      console.log(`Category "${name}" already exists.`);
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

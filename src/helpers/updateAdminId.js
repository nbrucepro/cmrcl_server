import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.products.updateMany({
    data: { adminId: "8859d616-3dae-49ab-892e-cd8e6ea0a084" },
  });

  console.log(" All products updated with default adminId");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

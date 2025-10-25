import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const adminId = "ec82c0a0-971d-4862-9dab-8bce356b622e";

async function main() {
  console.log("🌱 Seeding categories, designs, and attributes...");

  // 🧱 CATEGORY 1: SHOES
  const shoes = await prisma.category.create({
    data: {
      name: "Shoes",
      adminId,
      designs: {
        create: [
          {
            name: "Air Max",
            sizes: ["39", "40", "41", "42", "43", "44"],
          },
          {
            name: "Converse",
            sizes: ["38", "39", "40", "41", "42"],
          },
        ],
      },
      categoryAttributes: {
        create: [
          { name: "Size" },
          { name: "Color" },
          { name: "Material" },
          { name: "Brand" },
        ],
      },
    },
  });

  // 🧱 CATEGORY 2: CLOTHES
  const clothes = await prisma.category.create({
    data: {
      name: "Clothes",
      adminId,
      designs: {
        create: [
          {
            name: "Polo T-Shirt",
            sizes: ["S", "M", "L", "XL", "XXL"],
          },
          {
            name: "Hoodie",
            sizes: ["S", "M", "L", "XL"],
          },
        ],
      },
      categoryAttributes: {
        create: [
          { name: "Size" },
          { name: "Color" },
          { name: "Fabric Type" },
          { name: "Sleeve Length" },
        ],
      },
    },
  });

  console.log("✅ Seeding complete:");
  console.log({ shoes, clothes });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

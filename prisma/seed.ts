import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: {
        name: 'Electronics',
        description: 'Electronic devices and components'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Clothing' },
      update: {},
      create: {
        name: 'Clothing',
        description: 'Apparel and accessories'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Books' },
      update: {},
      create: {
        name: 'Books',
        description: 'Books and publications'
      }
    })
  ]);

  console.log('✅ Categories created');

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'LAP-001' },
      update: {},
      create: {
        name: 'Laptop',
        description: 'High-performance laptop',
        sku: 'LAP-001',
        price: 999.99,
        quantity: 25,
        minStock: 5,
        maxStock: 50,
        categoryId: categories[0].id
      }
    }),
    prisma.product.upsert({
      where: { sku: 'TSH-001' },
      update: {},
      create: {
        name: 'T-Shirt',
        description: 'Cotton t-shirt',
        sku: 'TSH-001',
        price: 19.99,
        quantity: 100,
        minStock: 20,
        maxStock: 200,
        categoryId: categories[1].id
      }
    })
  ]);

  console.log('✅ Products created');
  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
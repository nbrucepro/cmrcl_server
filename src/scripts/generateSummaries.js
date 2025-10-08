import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function generateSummaries() {
  try {
    console.log("🧾 Generating sales and purchase summaries...");

    // --- SALES SUMMARY ---
    const sales = await prisma.sales.findMany({
      include: { admin: true },
    });

    const salesGrouped = {};

    for (const sale of sales) {
      const dateKey = sale.timestamp.toISOString().split("T")[0]; // YYYY-MM-DD
      const key = `${sale.adminId}-${dateKey}`;

      if (!salesGrouped[key]) {
        salesGrouped[key] = { adminId: sale.adminId, totalValue: 0, date: new Date(dateKey) };
      }

      salesGrouped[key].totalValue += sale.totalAmount;
    }

    for (const key in salesGrouped) {
      const summary = salesGrouped[key];
      await prisma.salesSummary.create({
        data: {
          adminId: summary.adminId,
          totalValue: summary.totalValue,
          date: summary.date,
          changePercentage: 0,
        },
      });
    }

    console.log("✅ SalesSummary generated.");

    // --- PURCHASE SUMMARY ---
    const purchases = await prisma.purchases.findMany({
      include: { admin: true },
    });

    const purchasesGrouped = {};

    for (const purchase of purchases) {
      const dateKey = purchase.timestamp.toISOString().split("T")[0];
      const key = `${purchase.adminId}-${dateKey}`;

      if (!purchasesGrouped[key]) {
        purchasesGrouped[key] = { adminId: purchase.adminId, totalPurchased: 0, date: new Date(dateKey) };
      }

      purchasesGrouped[key].totalPurchased += purchase.totalCost;
    }

    for (const key in purchasesGrouped) {
      const summary = purchasesGrouped[key];
      await prisma.purchaseSummary.create({
        data: {
          adminId: summary.adminId,
          totalPurchased: summary.totalPurchased,
          date: summary.date,
          changePercentage: 0,
        },
      });
    }

    console.log("✅ PurchaseSummary generated.");
  } catch (err) {
    console.error("❌ Error generating summaries:", err);
  } finally {
    await prisma.$disconnect();
  }
}

generateSummaries();

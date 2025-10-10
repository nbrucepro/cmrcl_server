import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Update or create daily sales/purchase summary after transaction.
 * @param {string} type - "sale" or "purchase"
 * @param {string} adminId
 * @param {number} amount
 */
export async function updateSummary(type, adminId, amount) {
  const dateKey = new Date();
  const startOfDay = new Date(dateKey.setHours(0, 0, 0, 0));

  if (type === "sale") {
    const existing = await prisma.salesSummary.findFirst({
      where: { adminId, date: startOfDay },
    });

    if (existing) {
      await prisma.salesSummary.update({
        where: { summaryId: existing.summaryId },
        data: { totalValue: { increment: amount } },
      });
    } else {
      await prisma.salesSummary.create({
        data: {
          adminId,
          date: startOfDay,
          totalValue: amount,
          changePercentage: 0,
        },
      });
    }
  } else if (type === "purchase") {
    const existing = await prisma.purchaseSummary.findFirst({
      where: { adminId, date: startOfDay },
    });

    if (existing) {
      await prisma.purchaseSummary.update({
        where: { summaryId: existing.summaryId },
        data: { totalPurchased: { increment: amount } },
      });
    } else {
      await prisma.purchaseSummary.create({
        data: {
          adminId,
          date: startOfDay,
          totalPurchased: amount,
          changePercentage: 0,
        },
      });
    }
  }
}

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const updateSummary = async (type, action, adminId, amountDiff, timestamp) => {
    if (!timestamp || isNaN(new Date(timestamp))) {
      console.error("❌ Invalid timestamp provided:", timestamp);
      return;
    }
  
    const dateKey = new Date(timestamp);
    const startOfDay = new Date(dateKey);
    startOfDay.setHours(0, 0, 0, 0);
  
    const table = type === "sale" ? "salesSummary" : "purchaseSummary";
    const field = type === "sale" ? "totalValue" : "totalPurchased";
    const idField = table === "salesSummary" ? "salesSummaryId" : "purchaseSummaryId";
  
    const existing = await prisma[table].findFirst({
      where: { adminId, date: startOfDay },
    });
  
    let change = action === "delete" ? -Math.abs(amountDiff) : amountDiff;
  
    if (existing) {
      await prisma[table].update({
        where: { [idField]: existing[idField] },
        data: { [field]: { increment: change } },
      });
    } else {
      await prisma[table].create({
        data: {
          adminId,
          date: startOfDay,
          [field]: Math.max(change, 0),
          changePercentage: 0,
        },
      });
    }
  };
  
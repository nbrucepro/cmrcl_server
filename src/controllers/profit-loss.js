
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { startOfMonth, endOfMonth } from "date-fns";

export const getProfitsLosses = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    const adminId = req?.admin?.adminId; // ✅ from 
    console.log(req)

    if (!adminId) {
      return res.status(403).json({ error: "Unauthorized: Missing adminId" });
    }

    // ✅ Support both date range and month/year filters
    const start =
      startDate && endDate
        ? new Date(startDate)
        : startOfMonth(new Date(Number(year) || new Date().getFullYear(), (Number(month) || new Date().getMonth() + 1) - 1));
    const end =
      startDate && endDate
        ? new Date(endDate)
        : endOfMonth(new Date(Number(year) || new Date().getFullYear(), (Number(month) || new Date().getMonth() + 1) - 1));

    const [sales, purchases, expenses] = await Promise.all([
      prisma.sales.aggregate({
        _sum: { totalAmount: true },
        where: { adminId, timestamp: { gte: start, lte: end } },
      }),
      prisma.purchases.aggregate({
        _sum: { totalCost: true },
        where: { adminId, timestamp: { gte: start, lte: end } },
      }),
      prisma.expenses.aggregate({
        _sum: { amount: true },
        where: { adminId, timestamp: { gte: start, lte: end } },
      }),
    ]);

    const totalSales = sales._sum.totalAmount || 0;
    const totalPurchases = purchases._sum.totalCost || 0;
    const totalExpenses = expenses._sum.amount || 0;
    const netProfit = totalSales - (totalPurchases + totalExpenses);

    // Optional: save summary
    await prisma.profitLossSummary.create({
      data: {
        adminId,
        totalSales,
        totalPurchases,
        totalExpenses,
        netProfit,
        periodStart: start,
        periodEnd: end,
      },
    });

    res.json({
      totalSales,
      totalPurchases,
      totalExpenses,
      netProfit,
      period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
    });
  } catch (error) {
    console.error("Error calculating profit/loss:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

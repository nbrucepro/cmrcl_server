import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getDashboardMetrics = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { month, year } = req.query;

    if (!adminId || !month || !year) {
      return res
        .status(400)
        .json({ message: "adminId, month, and year are required" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const products = await prisma.products.findMany({
      where: { adminId },
      include: { variants: true, category: true },
    });

    const salesData = await prisma.sales.findMany({
      where: {
        adminId,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    const totalSales = salesData.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const purchaseData = await prisma.purchases.findMany({
      where: {
        adminId,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    const totalPurchases = purchaseData.reduce(
      (sum, p) => sum + p.totalCost,
      0
    );

    const expenseData = await prisma.expenses.findMany({
      where: {
        adminId,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    const totalExpenses = expenseData.reduce((sum, e) => sum + e.amount, 0);

    const productsWithProfit = await Promise.all(
      products.map(async (product) => {
        const productSales = salesData.filter(
          (s) => s.productId === product.productId
        );
        const productPurchases = purchaseData.filter(
          (p) => p.productId === product.productId
        );

        const soldCount = productSales.reduce((sum, s) => sum + s.quantity, 0);
        const soldRevenue = productSales.reduce(
          (sum, s) => sum + s.totalAmount,
          0
        );
        const purchasedCost = productPurchases.reduce(
          (sum, p) => sum + p.totalCost,
          0
        );

        const profit = soldRevenue - purchasedCost;

        return {
          ...product,
          soldCount,
          soldRevenue,
          purchasedCost,
          profit,
        };
      })
    );

    const popularProducts = productsWithProfit
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    const netProfit = totalSales - totalPurchases - totalExpenses;

    const salesGroupedByDay = salesData.reduce((acc, sale) => {
      const day = new Date(sale.timestamp).toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + sale.totalAmount;
      return acc;
    }, {});

    const salesSummary = Object.entries(salesGroupedByDay).map(
      ([date, totalValue], i, arr) => {
        const prev = arr[i - 1]?.[1] || totalValue;
        const changePercentage = ((totalValue - prev) / prev) * 100 || 0;
        return { date, totalValue, changePercentage };
      }
    );

    const averageChangePercentage =
      salesSummary.reduce((acc, s) => acc + s.changePercentage, 0) /
      (salesSummary.length || 1);

    const highestValueData = salesSummary.reduce(
      (max, s) => (s.totalValue > (max?.totalValue || 0) ? s : max),
      {}
    );
    const highestValueDate = highestValueData?.date || null;

    const purchaseGroupedByDay = purchaseData.reduce((acc, p) => {
      const day = new Date(p.timestamp).toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + p.totalCost;
      return acc;
    }, {});

    const purchaseSummary = Object.entries(purchaseGroupedByDay).map(
      ([date, totalPurchased], i, arr) => {
        const prev = arr[i - 1]?.[1] || totalPurchased;
        const changePercentage = ((totalPurchased - prev) / prev) * 100 || 0;
        return { date, totalPurchased, changePercentage };
      }
    );

    const avgChangePercentage =
      purchaseSummary.reduce((acc, p) => acc + p.changePercentage, 0) /
      (purchaseSummary.length || 1);

    const highestPurchaseData = purchaseSummary.reduce(
      (max, p) => (p.totalPurchased > (max?.totalPurchased || 0) ? p : max),
      {}
    );
    const highestPurchaseDate = highestPurchaseData?.date || null;

    const existingSummary = await prisma.profitLossSummary.findFirst({
      where: { adminId, periodStart: startDate, periodEnd: endDate },
    });

    if (!existingSummary) {
      await prisma.profitLossSummary.create({
        data: {
          adminId,
          totalSales,
          totalPurchases,
          totalExpenses,
          netProfit,
          periodStart: startDate,
          periodEnd: endDate,
        },
      });
    } else {
      await prisma.profitLossSummary.update({
        where: { id: existingSummary.id },
        data: { totalSales, totalPurchases, totalExpenses, netProfit },
      });
    }

    res.json({
      productsWithProfit,
      popularProducts,
      salesSummary,
      purchaseSummary,
      totalSales,
      totalPurchases,
      totalExpenses,
      netProfit,
      averageChangePercentage,
      highestValueData,
      highestValueDate,
      avgChangePercentage,
      highestPurchaseData,
      highestPurchaseDate,
    });
  } catch (error) {
    console.error("Error getting dashboard metrics:", error);
    res.status(500).json({
      message: "Error retrieving dashboard metrics",
      error: error.message,
    });
  }
};

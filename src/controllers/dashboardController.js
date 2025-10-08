import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboardMetrics = async (req, res) => {
  try {
    // Get adminId from query, params, or cookies depending on your setup
    const adminId = req.admin.adminId;
      console.log(adminId)
    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const popularProducts = await prisma.products.findMany({
      where: { adminId },
      take: 15,
      orderBy: { stockQuantity: "desc" },
    });

    const salesSummary = await prisma.salesSummary.findMany({
      where: { adminId },
      take: 5,
      orderBy: { date: "desc" },
    });

    const purchaseSummary = await prisma.purchaseSummary.findMany({
      where: { adminId },
      take: 5,
      orderBy: { date: "desc" },
    });

    const expenseSummary = await prisma.expenseSummary.findMany({
      where: { adminId },
      take: 5,
      orderBy: { date: "desc" },
    });

    const expenseByCategorySummaryRaw = await prisma.expenseByCategory.findMany({
      where: {
        expenseSummary: {
          adminId, // filter based on related ExpenseSummary’s adminId
        },
      },
      take: 5,
      orderBy: { date: "desc" },
      include: {
        expenseSummary: true, // optional, if you want to include parent info
      },
    });
    

    const expenseByCategorySummary = expenseByCategorySummaryRaw.map((item) => ({
      ...item,
      amount: item.amount.toString(),
    }));

    res.json({
      popularProducts,
      salesSummary,
      purchaseSummary,
      expenseSummary,
      expenseByCategorySummary,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error retrieving dashboard metrics", error });
  }
};

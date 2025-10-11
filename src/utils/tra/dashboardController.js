import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboardMetrics = async (req, res) => {
  try {
    // Get adminId from query, params, or cookies depending on your setup
    const adminId = req.admin.adminId;
    const { month, year } = req.query; 
    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const products = await prisma.products.findMany({
      where: { adminId },
      include: {
        variants: {
          include: {
            attributes: true,
          },
        },
        category: true,
      },
    });
    
    // const popularProducts = products
    //   .map((p) => ({
    //     ...p,
    //     totalStock: p.variants.reduce(
    //       (sum, variant) => sum + (variant.stockQuantity || 0),
    //       0
    //     ),
    //   }))
    //   .sort((a, b) => b.totalStock - a.totalStock)
    //   .slice(0, 15);
   const popularProductsWithSoldCount = await Promise.all(
       products.map(async (p) => {
         // total stock from variants
         const totalStock = p.variants.reduce(
           (sum, variant) => sum + (variant.stockQuantity || 0),
           0
         );
    
         // sold count from Sales table
         const soldCountData = await prisma.sales.aggregate({
           where: { productId: p.productId, adminId },
           _sum: { quantity: true },
         });
    
         const soldCount = soldCountData._sum.quantity || 0;
    
         return { ...p, totalStock, soldCount };
       })
      );
    
      // Sort by sold count (most popular first)
     const popularProducts = popularProductsWithSoldCount
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 15);

    const salesSummary = await prisma.salesSummary.findMany({
      where: { adminId, date: { gte: startDate, lte: endDate }},
      take: 5,
      orderBy: { date: "desc" },
    });
    const purchaseSummary = await prisma.purchaseSummary.findMany({
      where: { adminId, date: { gte: startDate, lte: endDate }},
      take: 5,
      orderBy: { date: "desc" },
    });

    const expenseSummary = await prisma.expenseSummary.findMany({
      where: { adminId, date: { gte: startDate, lte: endDate }},
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

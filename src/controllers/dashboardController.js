import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getDashboardMetrics = async (req, res) => {
	try {
		const adminId = req.admin.adminId;
		const { month, year } = req.query;

		if (!adminId || !month || !year) {
			return res
				.status(400)
				.json({ message: 'adminId, month, and year are required' });
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
			0,
		);

		const purchaseData = await prisma.purchases.findMany({
			where: {
				adminId,
				timestamp: { gte: startDate, lte: endDate },
			},
		});

		const totalPurchases = purchaseData.reduce(
			(sum, p) => sum + p.totalCost,
			0,
		);

		const expenseData = await prisma.expenses.findMany({
			where: {
				adminId,
				timestamp: { gte: startDate, lte: endDate },
			},
		});

		const totalExpenses = expenseData.reduce((sum, e) => sum + e.amount, 0);
		const allPurchases = await prisma.purchases.findMany({
			where: {
				adminId,
				timestamp: { gte: startDate, lte: endDate },
			},
			orderBy: { timestamp: 'asc' },
		});

		const productsWithProfit = await Promise.all(
			products.map(async (product) => {
				const productSales = salesData.filter(
					(s) => s.productId === product.productId,
				);

				let soldRevenue = 0;
				let soldCost = 0;

				for (const sale of productSales) {
					let remaining = sale.quantity;
					let cost = 0;

					const productPurchases = allPurchases
						.filter(
							(p) =>
								p.productId === product.productId &&
								p.timestamp <= sale.timestamp,
						)
						.map((p) => ({ ...p }));

					for (const purchase of productPurchases) {
						if (remaining <= 0) break;

						const available = purchase.quantity;
						const used = Math.min(available, remaining);

						cost += used * purchase.unitCost;
						remaining -= used;
						purchase.quantity -= used;
					}

					const fallbackUnitCost = product.variants?.[0]?.purchasePrice || 0;
					if (remaining > 0) cost += remaining * fallbackUnitCost;

					soldCost += cost;
					soldRevenue += sale.totalAmount;
				}

				const profit = soldRevenue - soldCost;

				return {
					...product,
					soldCount: productSales.reduce((sum, s) => sum + s.quantity, 0),
					soldRevenue,
					profit,
				};
			}),
		);

		const popularProducts = productsWithProfit
			.sort((a, b) => b.soldCount - a.soldCount)
			.slice(0, 5);
		const totalProductProfit = productsWithProfit.reduce(
			(sum, p) => sum + p.profit,
			0,
		);

		const netProfit = totalProductProfit;

		const salesGroupedByDay = salesData.reduce((acc, sale) => {
			const day = new Date(sale.timestamp).toISOString().split('T')[0];
			acc[day] = (acc[day] || 0) + sale.totalAmount;
			return acc;
		}, {});

		const salesSummary = Object.entries(salesGroupedByDay).map(
			([date, totalValue], i, arr) => {
				const prev = arr[i - 1]?.[1] || totalValue;
				const changePercentage = ((totalValue - prev) / prev) * 100 || 0;
				return { date, totalValue, changePercentage };
			},
		);

		const averageChangePercentage =
			salesSummary.reduce((acc, s) => acc + s.changePercentage, 0) /
			(salesSummary.length || 1);

		const highestValueData = salesSummary.reduce(
			(max, s) => (s.totalValue > (max?.totalValue || 0) ? s : max),
			{},
		);
		const highestValueDate = highestValueData?.date || null;

		const purchaseGroupedByDay = purchaseData.reduce((acc, p) => {
			const day = new Date(p.timestamp).toISOString().split('T')[0];
			acc[day] = (acc[day] || 0) + p.totalCost;
			return acc;
		}, {});

		const purchaseSummary = Object.entries(purchaseGroupedByDay).map(
			([date, totalPurchased], i, arr) => {
				const prev = arr[i - 1]?.[1] || totalPurchased;
				const changePercentage = ((totalPurchased - prev) / prev) * 100 || 0;
				return { date, totalPurchased, changePercentage };
			},
		);

		const avgChangePercentage =
			purchaseSummary.reduce((acc, p) => acc + p.changePercentage, 0) /
			(purchaseSummary.length || 1);

		const highestPurchaseData = purchaseSummary.reduce(
			(max, p) => (p.totalPurchased > (max?.totalPurchased || 0) ? p : max),
			{},
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
		// ---- GROUP PROFIT BY CATEGORY DYNAMICALLY ----

		// Fetch all categories
		const categories = await prisma.category.findMany({
			where: { adminId },
			select: { name: true },
		});

		// Generate category keys dynamically
		const CATEGORY_KEYS = categories.map((c) => c.name.toLowerCase());

		// Initialize profit object
		const profitPerCategory = CATEGORY_KEYS.reduce((acc, name) => {
			acc[name] = 0;
			return acc;
		}, {});

		// Sum profit by category
		productsWithProfit.forEach((p) => {
			const categoryName = p.category?.name?.toLowerCase() || '';

			if (CATEGORY_KEYS.includes(categoryName)) {
				profitPerCategory[categoryName] += p.profit || 0;
			}
		});

		// ===== GROUP SALES & PURCHASES BY CATEGORY =====
		const salesPerCategory = {};
		const purchasesPerCategory = {};

		// Initialize with categories
		categories.forEach((c) => {
			const key = c.name.toLowerCase();
			salesPerCategory[key] = 0;
			purchasesPerCategory[key] = 0;
		});

		// SALES by category
		salesData.forEach((sale) => {
			const product = products.find((p) => p.productId === sale.productId);
			if (!product) return;

			const category = product.category?.name?.toLowerCase();
			if (!category) return;

			salesPerCategory[category] += sale.totalAmount;
		});

		// PURCHASES by category
		purchaseData.forEach((pur) => {
			const product = products.find((p) => p.productId === pur.productId);
			if (!product) return;

			const category = product.category?.name?.toLowerCase();
			if (!category) return;

			purchasesPerCategory[category] += pur.totalCost;
		});

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
			profitPerCategory,
      salesPerCategory,
      purchasesPerCategory
		});
	} catch (error) {
		console.error('Error getting dashboard metrics:', error);
		res.status(500).json({
			message: 'Error retrieving dashboard metrics',
			error: error.message,
		});
	}
};

import { PrismaClient } from "@prisma/client";
import { updateSummary } from "../utils/updateSummary.js";

const prisma = new PrismaClient();

// CREATE Sale (already good)
export const createSale = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const { productId, quantity, unitPrice } = req.body;

    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const product = await prisma.products.findUnique({
      where: { productId },
      include: { variants: true },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.variants[0].stockQuantity < quantity)
      return res.status(400).json({ message: "Not enough stock available" });

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sales.create({
        data: {
          productId,
          adminId, // ✅ include adminId
          quantity,
          unitPrice,
          totalAmount: quantity * unitPrice,
          timestamp: new Date(),
        },
      });

      await tx.productVariant.update({
        where: { variantId: product.variants[0].variantId },
        data: { stockQuantity: { decrement: quantity } },
      });

      return newSale;
    });

    // 🧾 Update daily sales summary
    // await updateSummary("sale", adminId, sale.totalAmount);
    await updateSummary(
      "sale",
      "create",
      adminId,
      sale.totalAmount,
      sale.timestamp
    );

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating sale" });
  }
};

// GET All Sales
export const getSales = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const sales = await prisma.sales.findMany({
      where: { adminId },
      include: {
        product: {
          include: {
            variants: {
              include: {
                attributes: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    const formatted = sales.map((s) => {
      const variant = s.product?.variants?.[0];
      return {
        saleId: s.saleId,
        productId: s.productId,
        productName: s.product?.name || "—",
        categoryId: s.product.categoryId,
        pAttributes: variant?.attributes,
        sellingPrice: variant?.sellingPrice || s.unitPrice,
        quantity: s.quantity,
        totalAmount: s.totalAmount,
        stockAfterSale: variant?.stockQuantity || 0,
        date: s.timestamp,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error retrieving sales:", error);
    res.status(500).json({ message: "Error retrieving sales" });
  }
};
export const getSalesWithProfit = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });
    const sales = await prisma.sales.findMany({
      where: { adminId },
      include: {
        product: { include: { variants: { include: { attributes: true } } } },
      },
      orderBy: { timestamp: "asc" },
    });

    const purchases = await prisma.purchases.findMany({
      orderBy: { timestamp: "asc" },
    });

    const salesWithProfit = sales.map((sale) => {
      let remaining = sale.quantity;
      let cost = 0;
      const productPurchases = purchases
        .filter(
          (p) => p.productId === sale.productId && p.timestamp <= sale.timestamp
        ) // only past purchases
        .map((p) => ({ ...p }));

      for (const purchase of productPurchases) {
        if (remaining <= 0) break;

        const available = purchase.quantity;
        const used = Math.min(available, remaining);

        cost += used * purchase.unitCost;
        remaining -= used;
        purchase.quantity -= used;
      }
      const variant = sale.product?.variants?.[0];
      const fallbackUnitCost = variant?.purchasePrice || 0;
      if (remaining > 0) {
        cost += remaining * fallbackUnitCost;
      }
      const profit = sale.totalAmount - cost;

      const formatAmount = (amt) =>
        amt != null
          ? "Rs " +
            amt.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "—";

      const date = new Date(sale.timestamp);
      const formattedDate = isNaN(date.getTime())
        ? "Invalid Date"
        : date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

      return {
        saleId: sale.saleId,
        productId: sale.productId,
        productName: sale.product?.name || "—",
        categoryId: sale.product.categoryId,
        pAttributes: variant?.attributes || [],
        sellingPrice: variant?.sellingPrice || sale.unitPrice,
        quantity: sale.quantity,
        totalAmount: sale.totalAmount,
        profit: profit,
        stockAfterSale: variant?.stockQuantity || 0,
        date: formattedDate,
        cost,
      };
    });

    res.status(200).json(salesWithProfit);
  } catch (err) {
    console.error("Error retrieving sales with profit:", err);
    res.status(500).json({ message: "Error retrieving sales with profit" });
  }
};

export const updateSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const { quantity, unitPrice } = req.body;
    const adminId = req.admin?.adminId;

    const existingSale = await prisma.sales.findUnique({ where: { saleId } });
    if (!existingSale)
      return res.status(404).json({ message: "Sale not found" });

    const newTotal = quantity * unitPrice;
    const amountDiff = newTotal - existingSale.totalAmount;

    const updatedSale = await prisma.sales.update({
      where: { saleId },
      data: { quantity, unitPrice, totalAmount: newTotal },
    });

    // Adjust summary difference
    await updateSummary(
      "sale",
      "update",
      adminId,
      amountDiff,
      existingSale.timestamp
    );

    res.status(200).json(updatedSale);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating sale" });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const adminId = req.admin?.adminId;

    const sale = await prisma.sales.findUnique({ where: { saleId } });
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    await prisma.sales.delete({ where: { saleId } });

    // Subtract from summary
    await updateSummary(
      "sale",
      "delete",
      adminId,
      sale.totalAmount,
      sale.timestamp
    );

    res.status(200).json({ message: "Sale deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting sale" });
  }
};

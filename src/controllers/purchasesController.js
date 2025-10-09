import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// CREATE PURCHASE
export const createPurchase = async (req, res) => {
  try {
    const adminId = req.admin?.adminId; // ✅ get from middleware/cookie
    const { productId, quantity, unitCost } = req.body;

    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const product = await prisma.products.findUnique({
      where: { productId },
      include: { variants: true },
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.variants.length === 0)
        return res.status(400).json({ message: "No variants found for product" });

    const purchase = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchases.create({
        data: {
          productId,
          adminId, // ✅ include adminId
          quantity,
          unitCost,
          totalCost: quantity * unitCost,
          timestamp: new Date(),
        },
      });

      await tx.productVariant.update({
          where: { variantId: product.variants[0].variantId },
          data: {
            stockQuantity: { increment: quantity },
            purchasePrice: unitCost,
          },
      });

      return newPurchase;
    });

    res.status(201).json(purchase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating purchase" });
  }
};

// GET ALL PURCHASES (filtered by admin)
export const getPurchases = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const purchases = await prisma.purchases.findMany({
      where: { adminId }, // ✅ filter by admin
      include: {
        product: {
          include: {
            variants: true,
          },
      },
      },
      orderBy: { timestamp: "desc" },
    });

    const formatted = purchases.map((p) => {
      const variant = p.product?.variants?.[0];
      return {
        purchaseId: p.purchaseId,
        productId: p.productId,
        productName: p.product?.name || "—",
        purchasePrice: variant?.purchasePrice || 0,
        quantity: p.quantity,
        totalCost: p.totalCost,
        stockAfterPurchase: variant?.stockQuantity || 0,
        date: p.timestamp,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving purchases" });
  }
};

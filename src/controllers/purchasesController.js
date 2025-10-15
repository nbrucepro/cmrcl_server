import { PrismaClient } from "@prisma/client";
import { updateSummary } from "../utils/updateSummary.js";

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
            // purchasePrice: unitCost,
          },
      });

      return newPurchase;
    });
    
    // 🧾 Update daily purchase summary
    // await updateSummary("purchase", adminId, purchase.totalCost);
    await updateSummary("purchase", "create", adminId, purchase.totalCost, purchase.timestamp);
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
            variants: {
              include: {
                attributes:true
              }
            },
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
        categoryId:p.product.categoryId,
        pAttributes:variant?.attributes,
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

export const updatePurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { quantity, unitCost } = req.body;
    const adminId = req.admin?.adminId;

    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    // 🧾 Fetch existing purchase first
    const existingPurchase = await prisma.purchases.findUnique({
      where: { purchaseId },
      include: { product: { include: { variants: true } } },
    });

    if (!existingPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const variant = existingPurchase.product.variants[0];
    const oldQuantity = existingPurchase.quantity;
    const oldTotal = existingPurchase.totalCost;

    const newTotal = quantity * unitCost;
    const amountDiff = newTotal - oldTotal;

    // ⚙️ Update purchase & adjust stock accordingly
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchases.update({
        where: { purchaseId },
        data: {
          quantity,
          unitCost,
          totalCost: newTotal,
        },
      });

      // Adjust stock difference
      const stockDiff = quantity - oldQuantity;
      await tx.productVariant.update({
        where: { variantId: variant.variantId },
        data: { stockQuantity: { increment: stockDiff } },
      });

      return updated;
    });

    // 🧾 Update purchase summary difference
    await updateSummary("purchase", "update", adminId, amountDiff, existingPurchase.timestamp);

    res.status(200).json(updatedPurchase);
  } catch (err) {
    console.error("Error updating purchase:", err);
    res.status(500).json({ message: "Error updating purchase" });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const adminId = req.admin?.adminId;

    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    // 🧾 Find existing purchase
    const purchase = await prisma.purchases.findUnique({
      where: { purchaseId },
      include: { product: { include: { variants: true } } },
    });

    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    const variant = purchase.product.variants[0];

    await prisma.$transaction(async (tx) => {
      // Restore stock
      await tx.productVariant.update({
        where: { variantId: variant.variantId },
        data: { stockQuantity: { decrement: purchase.quantity } },
      });

      // Delete purchase record
      await tx.purchases.delete({ where: { purchaseId } });
    });

    // 🧾 Subtract from daily purchase summary
    await updateSummary("purchase", "delete", adminId, purchase.totalCost, purchase.timestamp);

    res.status(200).json({ message: "Purchase deleted successfully" });
  } catch (err) {
    console.error("Error deleting purchase:", err);
    res.status(500).json({ message: "Error deleting purchase" });
  }
};


import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// CREATE Purchase (already good)
export const createPurchase = async (req, res) => {
  try {
    const { productId, quantity, unitCost } = req.body;

    const product = await prisma.products.findUnique({ where: { productId } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const purchase = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchases.create({
        data: {
          productId,
          quantity,
          unitCost,
          totalCost: quantity * unitCost,
          timestamp: new Date(),
        },
      });

      await tx.products.update({
        where: { productId },
        data: { stockQuantity: { increment: quantity } },
      });

      return newPurchase;
    });

    res.status(201).json(purchase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating purchase" });
  }
};

// GET All Purchases
export const getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchases.findMany({
      include: { product: true },
      orderBy: { timestamp: "desc" },
    });

    // map for frontend-friendly rows
    const formatted = purchases.map((p) => ({
      id: p.purchaseId,
      productId: p.productId,
      productName: p.product?.name,
      quantity: p.quantity,
      price: p.unitCost,
      totalCost: p.totalCost,
      date: p.timestamp,
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving purchases" });
  }
};

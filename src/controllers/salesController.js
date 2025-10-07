import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// CREATE Sale (already good)
export const createSale = async (req, res) => {
  try {
    const { productId, quantity, unitPrice } = req.body;

    const product = await prisma.products.findUnique({ where: { productId } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.stockQuantity < quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sales.create({
        data: {
          productId,
          quantity,
          unitPrice,
          totalAmount: quantity * unitPrice,
          timestamp: new Date(),
        },
      });

      await tx.products.update({
        where: { productId },
        data: { stockQuantity: { decrement: quantity } },
      });

      return newSale;
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating sale" });
  }
};

// GET All Sales
export const getSales = async (req, res) => {
  try {
    const sales = await prisma.sales.findMany({
      include: { product: true },
      orderBy: { timestamp: "desc" },
    });

    const formatted = sales.map((s) => ({
      id: s.saleId,
      productId: s.productId,
      productName: s.product?.name,
      quantity: s.quantity,
      price: s.unitPrice,
      totalAmount: s.totalAmount,
      date: s.timestamp,
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving sales" });
  }
};

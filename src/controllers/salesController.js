import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// CREATE Sale (already good)
export const createSale = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const { productId, quantity, unitPrice } = req.body;

    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const product = await prisma.products.findUnique({ where: { productId } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.stockQuantity < quantity)
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
    const adminId = req.admin?.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const sales = await prisma.sales.findMany({
      where: { adminId }, // ✅ filter by admin
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
